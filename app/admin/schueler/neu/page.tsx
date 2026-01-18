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
          &larr; Zur&uuml;ck zur Sch&uuml;lerliste
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Neuer Sch&uuml;ler</h1>
        <p className="text-gray-600 mt-2">
          F&uuml;ge einen Sch&uuml;ler zur Whitelist hinzu.
        </p>
      </div>

      <Card>
        <StudentForm mode="create" onSuccess={handleSuccess} />
      </Card>
    </div>
  );
}
