import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FieldType } from "@prisma/client";
import { SteckbriefForm } from "@/components/steckbrief/SteckbriefForm";
import { ContactInfoForm } from "@/components/steckbrief/ContactInfoForm";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { toFieldDefinition } from "@/lib/steckbrief-validation-dynamic";
import { isDeadlinePassed } from "@/lib/deadline";

export default async function SteckbriefPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Load profile with values
  let profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      values: {
        include: {
          field: true,
        },
      },
    },
  });

  // Auto-create if doesn't exist
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: session.user.id,
      },
      include: {
        values: {
          include: {
            field: true,
          },
        },
      },
    });
  }

  const deadlinePassed = await isDeadlinePassed();

  // Load active field definitions
  const fields = await prisma.steckbriefField.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  // Build values map from SteckbriefValue records
  const values: Record<string, unknown> = {};
  for (const value of profile.values) {
    const field = value.field;
    if (!field.active) continue;

    switch (field.type) {
      case FieldType.TEXT:
      case FieldType.TEXTAREA:
      case FieldType.DATE:
        values[field.key] = value.textValue || "";
        break;
      case FieldType.SINGLE_IMAGE:
        values[field.key] = value.imageValue || null;
        break;
      case FieldType.MULTI_IMAGE:
        values[field.key] = value.imagesValue || [];
        break;
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Mein Steckbrief"
        description="Fülle deine Informationen für das Abibuch aus. Du kannst deine Angaben jederzeit als Entwurf speichern und später weiter bearbeiten."
        className="mb-6"
      />

      {deadlinePassed && (
        <div className="mb-6">
          <Alert variant="info">
            Die Abgabefrist ist abgelaufen. Inhalte können nicht mehr bearbeitet werden.
          </Alert>
        </div>
      )}

      <Card>
        <SteckbriefForm
          fields={fields.map(toFieldDefinition)}
          initialValues={values}
          status={profile.status}
          deadlinePassed={deadlinePassed}
        />
      </Card>

      <ContactInfoForm
        initialData={{
          contactEmail: profile.contactEmail || "",
          contactPhone: profile.contactPhone || "",
          contactInsta: profile.contactInsta || "",
        }}
        deadlinePassed={deadlinePassed}
      />
    </div>
  );
}
