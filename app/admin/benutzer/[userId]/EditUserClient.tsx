"use client";

import { useRouter } from "next/navigation";
import { UserForm } from "@/components/admin/UserForm";
import { Role } from "@prisma/client";

interface EditUserClientProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    active: boolean;
  };
}

export function EditUserClient({ user }: EditUserClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/benutzer");
  };

  return <UserForm mode="edit" initialData={user} onSuccess={handleSuccess} />;
}
