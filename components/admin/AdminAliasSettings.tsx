"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
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

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function AdminAliasSettings() {
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [currentAlias, setCurrentAlias] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(false);
  }, []);

  const loadCurrentAlias = useCallback(() => {
    const alias = getCookie(ADMIN_ALIAS_COOKIE);
    const timestamp = getCookie(ADMIN_ALIAS_TIMESTAMP_COOKIE);

    if (alias && timestamp) {
      const timestampMs = parseInt(timestamp, 10);
      if (!isNaN(timestampMs) && Date.now() - timestampMs < ALIAS_TIMEOUT_MS) {
        setCurrentAlias(alias === "unknown" ? null : alias);
        return;
      }
    }
    setCurrentAlias(null);
  }, []);

  useEffect(() => {
    loadAliases();
    loadCurrentAlias();
  }, [loadAliases, loadCurrentAlias]);

  const handleDelete = async (alias: Alias) => {
    if (alias.name === currentAlias) {
      setError("Du kannst dein aktuell gewähltes Kürzel nicht löschen.");
      return;
    }

    setDeleting(alias.id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/aliases?id=${alias.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAliases((prev) => prev.filter((a) => a.id !== alias.id));
      } else {
        const data = await res.json();
        setError(data.error || "Fehler beim Löschen");
      }
    } catch {
      setError("Fehler beim Löschen");
    }

    setDeleting(null);
  };

  const handleSwitch = (aliasName: string) => {
    setSwitching(true);
    setError(null);

    const maxAgeSeconds = ALIAS_TIMEOUT_MS / 1000;
    const now = Date.now();
    setCookie(ADMIN_ALIAS_COOKIE, aliasName, maxAgeSeconds);
    setCookie(ADMIN_ALIAS_TIMESTAMP_COOKIE, now.toString(), maxAgeSeconds);

    setCurrentAlias(aliasName);
    setSwitching(false);
  };

  const handleClearAlias = () => {
    setSwitching(true);
    setError(null);

    // Delete cookies so the modal appears again
    deleteCookie(ADMIN_ALIAS_COOKIE);
    deleteCookie(ADMIN_ALIAS_TIMESTAMP_COOKIE);

    setCurrentAlias(null);
    setSwitching(false);
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Laden...</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}

      {/* Current alias */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Aktuelles Kürzel:{" "}
          <span className="font-medium text-gray-900">
            {currentAlias || "Nicht gesetzt"}
          </span>
        </p>
        {currentAlias && (
          <button
            onClick={handleClearAlias}
            disabled={switching}
            className="text-sm text-primary hover:text-primary-dark mt-1 disabled:opacity-50"
          >
            Kürzel zurücksetzen
          </button>
        )}
      </div>

      {/* Alias list */}
      {aliases.length === 0 ? (
        <p className="text-sm text-gray-500">
          Noch keine Kürzel vorhanden. Kürzel werden erstellt, wenn sich Admins
          zum ersten Mal anmelden.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Bekannte Kürzel ({aliases.length}):
          </p>
          <div className="space-y-2">
            {aliases.map((alias) => {
              const isCurrent = alias.name === currentAlias;
              return (
                <div
                  key={alias.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {alias.name}
                    </span>
                    {isCurrent && (
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded">
                        Aktiv
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCurrent && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSwitch(alias.name)}
                        disabled={switching}
                      >
                        Wechseln
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(alias)}
                      loading={deleting === alias.id}
                      disabled={deleting !== null || isCurrent}
                    >
                      Löschen
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Kürzel werden verwendet, um Admin-Aktivitäten zuzuordnen. Das Löschen
        eines Kürzels entfernt es nur aus der Auswahlliste — bestehende
        Log-Einträge bleiben erhalten.
      </p>
    </div>
  );
}
