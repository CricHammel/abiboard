import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { FieldManagement } from "@/components/admin/steckbrief-fields/FieldManagement";
import { toFieldDefinition } from "@/lib/steckbrief-validation-dynamic";

export default async function SteckbriefFieldsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Load all fields (including inactive)
  const fields = await prisma.steckbriefField.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Steckbrief-Felder</h1>
        <p className="mt-2 text-gray-600">
          Verwalte die Felder, die im Steckbrief angezeigt werden. Du kannst
          Felder hinzufügen, bearbeiten, die Reihenfolge ändern oder
          deaktivieren.
        </p>
      </div>

      <Card>
        <FieldManagement initialFields={fields.map(toFieldDefinition)} />
      </Card>
    </div>
  );
}
