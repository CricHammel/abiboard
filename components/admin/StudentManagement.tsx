"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudentList } from "./StudentList";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
}

export function StudentManagement({ students }: StudentManagementProps) {
  const router = useRouter();
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
    router.push(`/admin/schueler/${studentId}`);
  };

  const handleToggleActive = (
    studentId: string,
    studentName: string,
    isActive: boolean
  ) => {
    setConfirmDialog({
      isOpen: true,
      studentId,
      studentName,
      isActive,
    });
  };

  const handleConfirmToggleActive = async () => {
    setIsLoading(true);

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
        alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      }
    } catch {
      alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
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
    <>
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
    </>
  );
}
