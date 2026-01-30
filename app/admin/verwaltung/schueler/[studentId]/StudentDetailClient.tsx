"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface FeatureData {
  rankingSubmissionStatus: "DRAFT" | "SUBMITTED" | null;
  rankingVoteCount: number;
  totalSurveyQuestions: number;
  surveyAnswerCount: number;
  teacherQuoteCount: number;
  studentQuoteCount: number;
  commentCount: number;
}

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
        status: "DRAFT" | "SUBMITTED";
        updatedAt: Date;
      } | null;
    } | null;
  };
  featureData: FeatureData | null;
}

type AreaStatus = "done" | "in_progress" | "not_started";

const statusConfig: Record<AreaStatus, { dot: string; label: string }> = {
  done: { dot: "bg-green-500", label: "Erledigt" },
  in_progress: { dot: "bg-amber-500", label: "In Bearbeitung" },
  not_started: { dot: "bg-gray-300", label: "Nicht begonnen" },
};

export function StudentDetailClient({ student, featureData }: StudentDetailClientProps) {
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

      {/* Feature-Übersicht (nur wenn registriert) */}
      {student.user && featureData && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Beiträge</h2>
          <div className="space-y-4">
            {(() => {
              const profile = student.user!.profile;
              const steckbriefStatus: AreaStatus =
                profile?.status === "SUBMITTED" ? "done" : profile ? "in_progress" : "not_started";

              const rankingStatus: AreaStatus =
                featureData.rankingSubmissionStatus === "SUBMITTED"
                  ? "done"
                  : featureData.rankingVoteCount > 0
                    ? "in_progress"
                    : "not_started";

              const umfragenStatus: AreaStatus =
                featureData.totalSurveyQuestions > 0 && featureData.surveyAnswerCount >= featureData.totalSurveyQuestions
                  ? "done"
                  : featureData.surveyAnswerCount > 0
                    ? "in_progress"
                    : "not_started";

              const totalQuotes = featureData.teacherQuoteCount + featureData.studentQuoteCount;
              const zitateStatus: AreaStatus = totalQuotes > 0 ? "done" : "not_started";

              const kommentareStatus: AreaStatus = featureData.commentCount > 0 ? "done" : "not_started";

              const areas = [
                {
                  name: "Steckbrief",
                  status: steckbriefStatus,
                  detail: profile?.status === "SUBMITTED"
                    ? "Eingereicht"
                    : profile
                      ? "Entwurf"
                      : "Nicht begonnen",
                  extra: profile?.updatedAt
                    ? `Zuletzt bearbeitet: ${formatDate(profile.updatedAt)}`
                    : undefined,
                },
                {
                  name: "Rankings",
                  status: rankingStatus,
                  detail: featureData.rankingSubmissionStatus === "SUBMITTED"
                    ? "Eingereicht"
                    : featureData.rankingVoteCount > 0
                      ? `${featureData.rankingVoteCount} Stimmen (Entwurf)`
                      : "Nicht begonnen",
                },
                {
                  name: "Umfragen",
                  status: umfragenStatus,
                  detail: featureData.totalSurveyQuestions > 0
                    ? `${featureData.surveyAnswerCount}/${featureData.totalSurveyQuestions} beantwortet`
                    : "Keine Umfragen vorhanden",
                },
                {
                  name: "Zitate",
                  status: zitateStatus,
                  detail: totalQuotes > 0
                    ? `${featureData.teacherQuoteCount} Lehrer, ${featureData.studentQuoteCount} Schüler`
                    : "Keine Zitate",
                },
                {
                  name: "Kommentare",
                  status: kommentareStatus,
                  detail: featureData.commentCount > 0
                    ? `${featureData.commentCount} geschrieben`
                    : "Keine Kommentare",
                },
              ];

              return areas.map((area) => (
                <div key={area.name} className="flex items-start gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${statusConfig[area.status].dot}`}
                    title={statusConfig[area.status].label}
                  />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-gray-900">{area.name}</span>
                      <span className="text-sm text-gray-500">{area.detail}</span>
                    </div>
                    {area.extra && (
                      <p className="text-xs text-gray-400 mt-0.5">{area.extra}</p>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
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
