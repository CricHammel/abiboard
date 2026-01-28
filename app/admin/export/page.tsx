import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ExportPage } from "@/components/admin/export/ExportPage";

export default async function AdminExportPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Datenexport</h1>
        <p className="text-gray-600 mt-1">
          Daten als TSV-Dateien für den Abibuch-Druck herunterladen.
        </p>
      </div>
      <ExportPage />
    </div>
  );
}
