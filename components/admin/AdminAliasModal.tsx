"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ADMIN_ALIAS_COOKIE,
  ADMIN_ALIAS_TIMESTAMP_COOKIE,
  ALIAS_TIMEOUT_MS,
} from "@/lib/audit-log";

interface Alias {
  id: string;
  name: string;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function AdminAliasModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [selectedAlias, setSelectedAlias] = useState<string>("");
  const [newAliasName, setNewAliasName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIfModalNeeded = useCallback(() => {
    const alias = getCookie(ADMIN_ALIAS_COOKIE);
    const timestamp = getCookie(ADMIN_ALIAS_TIMESTAMP_COOKIE);

    if (alias && timestamp) {
      const timestampMs = parseInt(timestamp, 10);
      if (!isNaN(timestampMs) && Date.now() - timestampMs < ALIAS_TIMEOUT_MS) {
        // Valid alias exists and not expired
        return false;
      }
    }
    return true;
  }, []);

  const loadAliases = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/aliases");
      if (res.ok) {
        const data = await res.json();
        setAliases(data);
      }
    } catch {
      console.error("Failed to load aliases");
    }
  }, []);

  useEffect(() => {
    if (checkIfModalNeeded()) {
      loadAliases();
      setIsOpen(true);
    }
  }, [checkIfModalNeeded, loadAliases]);

  const handleSelectAlias = (aliasName: string) => {
    setIsLoading(true);
    setError(null);

    // Set cookies (valid for 2 hours)
    const maxAgeSeconds = ALIAS_TIMEOUT_MS / 1000;
    // eslint-disable-next-line react-hooks/purity -- Date.now() is called in event handler, not during render
    const now = Date.now();
    setCookie(ADMIN_ALIAS_COOKIE, aliasName, maxAgeSeconds);
    setCookie(ADMIN_ALIAS_TIMESTAMP_COOKIE, now.toString(), maxAgeSeconds);

    setIsLoading(false);
    setIsOpen(false);
  };

  const handleCreateAndSelect = async () => {
    if (!newAliasName.trim()) {
      setError("Bitte gib ein Kürzel ein");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAliasName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Erstellen");
        setIsLoading(false);
        return;
      }

      // Select the new alias
      handleSelectAlias(newAliasName.trim());
    } catch {
      setError("Fehler beim Erstellen");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Set as "unknown"
    const maxAgeSeconds = ALIAS_TIMEOUT_MS / 1000;
    const now = Date.now();
    setCookie(ADMIN_ALIAS_COOKIE, "unknown", maxAgeSeconds);
    setCookie(ADMIN_ALIAS_TIMESTAMP_COOKIE, now.toString(), maxAgeSeconds);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Wer bist du?</h2>
        <p className="text-gray-600 text-sm">
          Wähle dein Kürzel, damit Änderungen zugeordnet werden können.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}

        {!isCreatingNew ? (
          <>
            {/* Existing aliases */}
            {aliases.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Bekannte Kürzel:
                </p>
                <div className="flex flex-wrap gap-2">
                  {aliases.map((alias) => (
                    <button
                      key={alias.id}
                      onClick={() => handleSelectAlias(alias.name)}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedAlias === alias.name
                          ? "border-primary bg-primary-light text-primary"
                          : "border-gray-200 hover:border-primary hover:bg-gray-50"
                      } disabled:opacity-50`}
                    >
                      {alias.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsCreatingNew(true)}
                disabled={isLoading}
                className="w-full"
              >
                Neues Kürzel erstellen
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Create new alias form */}
            <div className="space-y-3">
              <Input
                label="Neues Kürzel"
                value={newAliasName}
                onChange={(e) => setNewAliasName(e.target.value)}
                placeholder="z.B. Max, Lisa..."
                maxLength={20}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateAndSelect();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewAliasName("");
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Zurück
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateAndSelect}
                  loading={isLoading}
                  disabled={isLoading || !newAliasName.trim()}
                  className="flex-1"
                >
                  Erstellen & Auswählen
                </Button>
              </div>
            </div>
          </>
        )}

        <div className="border-t pt-4">
          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Überspringen
          </button>
        </div>
      </div>
    </div>
  );
}
