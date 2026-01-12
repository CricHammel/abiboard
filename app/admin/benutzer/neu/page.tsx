"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { UserForm } from "@/components/admin/UserForm";
import Link from "next/link";

export default function NewUserPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/benutzer");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/benutzer"
          className="text-primary hover:underline text-sm mb-2 inline-block"
        >
          ← Zurück zur Benutzerverwaltung
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Neuer Benutzer</h1>
        <p className="text-gray-600 mt-2">
          Erstelle einen neuen Benutzer-Account.
        </p>
      </div>

      <Card>
        <UserForm mode="create" onSuccess={handleSuccess} />
      </Card>
    </div>
  );
}
