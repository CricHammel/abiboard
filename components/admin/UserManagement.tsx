"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserList } from "./UserList";
import { ConfirmDialog } from "./ConfirmDialog";
import { Role, ProfileStatus } from "@prisma/client";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  profile?: { status: ProfileStatus } | null;
}

interface UserManagementProps {
  users: User[];
}

export function UserManagement({ users }: UserManagementProps) {
  const router = useRouter();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    isActive: boolean;
  }>({
    isOpen: false,
    userId: "",
    userName: "",
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = (userId: string) => {
    router.push(`/admin/benutzer/${userId}`);
  };

  const handleToggleActive = (
    userId: string,
    userName: string,
    isActive: boolean
  ) => {
    setConfirmDialog({
      isOpen: true,
      userId,
      userName,
      isActive,
    });
  };

  const handleConfirmToggleActive = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${confirmDialog.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !confirmDialog.isActive,
        }),
      });

      if (response.ok) {
        setConfirmDialog({ isOpen: false, userId: "", userName: "", isActive: true });
        router.refresh();
      } else {
        alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      }
    } catch (error) {
      alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelToggleActive = () => {
    setConfirmDialog({ isOpen: false, userId: "", userName: "", isActive: true });
  };

  return (
    <>
      <UserList
        users={users}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.isActive
            ? "Benutzer deaktivieren"
            : "Benutzer aktivieren"
        }
        message={
          confirmDialog.isActive
            ? `Möchtest du den Benutzer "${confirmDialog.userName}" wirklich deaktivieren? Der Benutzer kann sich dann nicht mehr anmelden.`
            : `Möchtest du den Benutzer "${confirmDialog.userName}" wirklich aktivieren? Der Benutzer kann sich dann wieder anmelden.`
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
