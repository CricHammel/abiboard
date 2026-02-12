import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ExportPage } from "@/components/admin/export/ExportPage";
import { getDeadline } from "@/lib/deadline";

export const metadata: Metadata = { title: "Datenexport" };

export default async function AdminExportPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const deadline = await getDeadline();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Datenexport</h1>
        <p className="text-gray-600 mt-1">
          Daten als TSV-Dateien für den Abibuch-Druck herunterladen.
        </p>
      </div>
      <ExportPage initialDeadline={deadline?.toISOString() ?? null} />
    </div>
  );
}
