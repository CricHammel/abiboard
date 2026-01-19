"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { StudentForm } from "@/components/admin/StudentForm";
import Link from "next/link";

export default function NewStudentPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/schueler");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/schueler"
          className="text-primary hover:underline text-sm mb-2 inline-block"
        >
          ← Zurück zur Schülerliste
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Neuer Schüler</h1>
        <p className="text-gray-600 mt-2">
          Füge einen Schüler zur Whitelist hinzu.
        </p>
      </div>

      <Card>
        <StudentForm mode="create" onSuccess={handleSuccess} />
      </Card>
    </div>
  );
}
