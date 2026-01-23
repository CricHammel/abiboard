"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface StudentDetailClientProps {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: "MALE" | "FEMALE" | null;
    active: boolean;
    userId: string | null;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      active: boolean;
      createdAt: Date;
      profile: {
        status: "DRAFT" | "SUBMITTED" | "APPROVED";
        updatedAt: Date;
      } | null;
    } | null;
  };
}

export function StudentDetailClient({ student }: StudentDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(student.firstName);
  const [lastName, setLastName] = useState(student.lastName);
  const [email, setEmail] = useState(student.email);
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">(student.gender || "");
  const [errors, setErrors] = useState<{ general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: "activate" | "deactivate";
  }>({ isOpen: false, action: "deactivate" });

  const handleSave = async () => {
    setErrors({});
    setIsLoading(true);

    const updateData: Record<string, unknown> = {};
    if (firstName !== student.firstName) updateData.firstName = firstName;
    if (lastName !== student.lastName) updateData.lastName = lastName;
    if (email !== student.email) updateData.email = email;
    const currentGender = gender || null;
    if (currentGender !== (student.gender ?? null)) updateData.gender = currentGender;

    if (Object.keys(updateData).length === 0) {
      setIsEditing(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || "Ein Fehler ist aufgetreten." });
        setIsLoading(false);
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setErrors({ general: "Ein Fehler ist aufgetreten." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !student.active }),
      });

      if (response.ok) {
        setConfirmDialog({ isOpen: false, action: "deactivate" });
        router.refresh();
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: "DRAFT" | "SUBMITTED" | "APPROVED") => {
    const config = {
      DRAFT: { label: "Entwurf", className: "bg-gray-100 text-gray-700" },
      SUBMITTED: { label: "Eingereicht", className: "bg-yellow-100 text-yellow-700" },
      APPROVED: { label: "Genehmigt", className: "bg-green-100 text-green-700" },
    };
    const { label, className } = config[status];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Whitelist-Daten */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Schülerdaten</h2>
          <div className="flex items-center gap-2">
            {student.active ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Aktiv
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Inaktiv
              </span>
            )}
          </div>
        </div>

        {errors.general && <ErrorMessage message={errors.general} className="mb-4" />}

        {isEditing ? (
          <div className="space-y-4">
            <Input
              label="Vorname"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
            />
            <Input
              label="Nachname"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
            />
            <Input
              label="E-Mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Geschlecht
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE" | "")}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light min-h-[44px] text-base"
                disabled={isLoading}
              >
                <option value="">— Nicht angegeben</option>
                <option value="MALE">Männlich</option>
                <option value="FEMALE">Weiblich</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleSave} loading={isLoading}>
                Speichern
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFirstName(student.firstName);
                  setLastName(student.lastName);
                  setEmail(student.email);
                  setGender(student.gender || "");
                  setErrors({});
                }}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Vorname</p>
                <p className="text-gray-900">{student.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nachname</p>
                <p className="text-gray-900">{student.lastName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">E-Mail</p>
                <p className="text-gray-900">{student.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Geschlecht</p>
                <p className="text-gray-900">
                  {student.gender === "MALE" ? "Männlich" : student.gender === "FEMALE" ? "Weiblich" : "—"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Bearbeiten
              </Button>
              <Button
                variant={student.active ? "danger" : "primary"}
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    action: student.active ? "deactivate" : "activate",
                  })
                }
              >
                {student.active ? "Deaktivieren" : "Aktivieren"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Registrierungsstatus */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Registrierung</h2>
        {student.user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Registriert
              </span>
              {!student.user.active && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Account inaktiv
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Registriert am</p>
              <p className="text-gray-900">{formatDate(student.user.createdAt)}</p>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Nicht registriert
            </span>
            <p className="mt-2 text-sm">
              Dieser Schüler hat sich noch nicht registriert.
            </p>
          </div>
        )}
      </Card>

      {/* Steckbrief-Status (nur wenn registriert) */}
      {student.user && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Steckbrief</h2>
          {student.user.profile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getStatusBadge(student.user.profile.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Zuletzt bearbeitet</p>
                <p className="text-gray-900">{formatDate(student.user.profile.updatedAt)}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Kein Steckbrief vorhanden.</p>
          )}
        </Card>
      )}

      {/* Platzhalter für zukünftige Features */}
      {student.user && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Weitere Beiträge</h2>
          <p className="text-gray-500 text-sm">
            Rankings, Kommentare und Umfragen werden hier angezeigt, sobald diese Features verfügbar sind.
          </p>
        </Card>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.action === "deactivate" ? "Schüler deaktivieren" : "Schüler aktivieren"}
        message={
          confirmDialog.action === "deactivate"
            ? `Möchtest du ${student.firstName} ${student.lastName} wirklich deaktivieren? Der Schüler kann sich dann nicht mehr registrieren.`
            : `Möchtest du ${student.firstName} ${student.lastName} wirklich aktivieren? Der Schüler kann sich dann wieder registrieren.`
        }
        confirmText={confirmDialog.action === "deactivate" ? "Deaktivieren" : "Aktivieren"}
        variant={confirmDialog.action === "deactivate" ? "danger" : "warning"}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmDialog({ isOpen: false, action: "deactivate" })}
        isLoading={isLoading}
      />
    </>
  );
}
