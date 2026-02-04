"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TeacherList } from "./TeacherList";
import { TeacherForm } from "./TeacherForm";
import { formatTeacherName } from "@/lib/format";

interface Teacher {
  id: string;
  salutation: "HERR" | "FRAU";
  firstName: string | null;
  lastName: string;
  subject: string | null;
  active: boolean;
}

interface TeacherManagementProps {
  initialTeachers: Teacher[];
}

export function TeacherManagement({ initialTeachers }: TeacherManagementProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    teacher: Teacher | null;
  }>({ isOpen: false, teacher: null });

  const handleCreate = async (data: {
    salutation: "HERR" | "FRAU";
    lastName: string;
    firstName?: string | null;
    subject?: string | null;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      if (result.teacher) {
        setTeachers((prev) => [...prev, result.teacher]);
      }

      setSuccessMessage("Lehrer erfolgreich hinzugefügt.");
      setIsCreating(false);
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: {
    salutation: "HERR" | "FRAU";
    lastName: string;
    firstName?: string | null;
    subject?: string | null;
  }) => {
    if (!editingTeacher) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/teachers/${editingTeacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      if (result.teacher) {
        setTeachers((prev) =>
          prev.map((t) => (t.id === editingTeacher.id ? result.teacher : t))
        );
      }

      setSuccessMessage("Lehrer erfolgreich aktualisiert.");
      setEditingTeacher(null);
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    const teacher = confirmDialog.teacher;
    if (!teacher) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !teacher.active }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      setTeachers((prev) =>
        prev.map((t) =>
          t.id === teacher.id ? { ...t, active: !t.active } : t
        )
      );
      setSuccessMessage(
        teacher.active ? "Lehrer deaktiviert." : "Lehrer aktiviert."
      );
      setConfirmDialog({ isOpen: false, teacher: null });
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {successMessage && (
        <Alert variant="success">{successMessage}</Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {teachers.length} Lehrer
        </h2>
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditingTeacher(null);
            setError(null);
            setSuccessMessage(null);
          }}
          variant="primary"
          disabled={isLoading || isCreating}
        >
          Neuer Lehrer
        </Button>
      </div>

      {isCreating && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Neuen Lehrer hinzufügen
          </h3>
          <TeacherForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isLoading={isLoading}
          />
        </div>
      )}

      {editingTeacher && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Lehrer bearbeiten: {formatTeacherName(editingTeacher, { shortForm: true, includeSubject: false })}
          </h3>
          <TeacherForm
            teacher={editingTeacher}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTeacher(null)}
            isLoading={isLoading}
          />
        </div>
      )}

      <TeacherList
        teachers={teachers}
        onEdit={(teacher) => {
          setEditingTeacher(teacher);
          setIsCreating(false);
          setError(null);
          setSuccessMessage(null);
          setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
        }}
        onToggleActive={(teacher) =>
          setConfirmDialog({ isOpen: true, teacher })
        }
        disabled={isLoading || isCreating || !!editingTeacher}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.teacher?.active
            ? "Lehrer deaktivieren"
            : "Lehrer aktivieren"
        }
        message={
          confirmDialog.teacher?.active
            ? `Möchtest du ${formatTeacherName(confirmDialog.teacher, { shortForm: true, includeSubject: false })} wirklich deaktivieren?`
            : `Möchtest du ${confirmDialog.teacher ? formatTeacherName(confirmDialog.teacher, { shortForm: true, includeSubject: false }) : ""} wirklich aktivieren?`
        }
        confirmText={
          confirmDialog.teacher?.active ? "Deaktivieren" : "Aktivieren"
        }
        variant={confirmDialog.teacher?.active ? "danger" : "warning"}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmDialog({ isOpen: false, teacher: null })}
        isLoading={isLoading}
      />
    </div>
  );
}
