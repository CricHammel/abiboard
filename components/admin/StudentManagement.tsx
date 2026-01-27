"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StudentList } from "./StudentList";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: "MALE" | "FEMALE" | null;
  active: boolean;
  createdAt: Date;
  userId: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    active: boolean;
  } | null;
}

interface StudentManagementProps {
  students: Student[];
  basePath: string;
}

export function StudentManagement({ students, basePath }: StudentManagementProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    isActive: boolean;
  }>({
    isOpen: false,
    studentId: "",
    studentName: "",
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = (studentId: string) => {
    router.push(`${basePath}/${studentId}`);
  };

  const handleToggleActive = (
    studentId: string,
    studentName: string,
    isActive: boolean
  ) => {
    setError(null);
    setConfirmDialog({
      isOpen: true,
      studentId,
      studentName,
      isActive,
    });
  };

  const handleConfirmToggleActive = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/students/${confirmDialog.studentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            active: !confirmDialog.isActive,
          }),
        }
      );

      if (response.ok) {
        setConfirmDialog({
          isOpen: false,
          studentId: "",
          studentName: "",
          isActive: true,
        });
        router.refresh();
      } else {
        setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        setConfirmDialog({
          isOpen: false,
          studentId: "",
          studentName: "",
          isActive: true,
        });
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      setConfirmDialog({
        isOpen: false,
        studentId: "",
        studentName: "",
        isActive: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelToggleActive = () => {
    setConfirmDialog({
      isOpen: false,
      studentId: "",
      studentName: "",
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {students.length} Schüler
        </h2>
        <Link href={`${basePath}/neu`}>
          <Button variant="primary">
            Neuer Schüler
          </Button>
        </Link>
      </div>

      <StudentList
        students={students}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.isActive
            ? "Eintrag deaktivieren"
            : "Eintrag aktivieren"
        }
        message={
          confirmDialog.isActive
            ? `M\u00f6chtest du den Eintrag f\u00fcr "${confirmDialog.studentName}" wirklich deaktivieren? Der Sch\u00fcler kann sich dann nicht mehr registrieren.`
            : `M\u00f6chtest du den Eintrag f\u00fcr "${confirmDialog.studentName}" wirklich aktivieren? Der Sch\u00fcler kann sich dann wieder registrieren.`
        }
        confirmText={confirmDialog.isActive ? "Deaktivieren" : "Aktivieren"}
        variant={confirmDialog.isActive ? "danger" : "warning"}
        onConfirm={handleConfirmToggleActive}
        onCancel={handleCancelToggleActive}
        isLoading={isLoading}
      />
    </div>
  );
}
