import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { FieldManagement } from "@/components/admin/steckbrief-fields/FieldManagement";
import { toFieldDefinition } from "@/lib/steckbrief-validation-dynamic";

export default async function SteckbriefFelderPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const fields = await prisma.steckbriefField.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <p className="text-gray-600 mb-6">
        Verwalte die Felder, die im Steckbrief angezeigt werden. Du kannst
        Felder hinzufügen, bearbeiten, die Reihenfolge ändern oder
        deaktivieren.
      </p>

      <Card>
        <FieldManagement initialFields={fields.map(toFieldDefinition)} />
      </Card>
    </div>
  );
}
