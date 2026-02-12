import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ParticipationSection } from "@/components/ui/ParticipationSection";
import { FieldManagement } from "@/components/admin/steckbrief-fields/FieldManagement";
import { toFieldDefinition } from "@/lib/steckbrief-validation-dynamic";

export default async function SteckbriefPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const [students, fields] = await Promise.all([
    prisma.student.findMany({
      where: { active: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: { status: true },
            },
          },
        },
      },
    }),
    prisma.steckbriefField.findMany({
      orderBy: { order: "asc" },
    }),
  ]);

  const totalRegistered = students.filter((s) => s.user).length;
  const submittedStudents = students.filter(
    (s) => s.user?.profile?.status === "SUBMITTED"
  );
  const draftStudents = students.filter(
    (s) => s.user && s.user.profile?.status !== "SUBMITTED"
  );
  const submittedList = submittedStudents.map((s) => ({
    id: s.id,
    firstName: s.user!.firstName,
    lastName: s.user!.lastName,
  }));
  const draftList = draftStudents.map((s) => ({
    id: s.id,
    firstName: s.user!.firstName,
    lastName: s.user!.lastName,
  }));

  return (
    <div className="space-y-6">
      <StatsGrid
        items={[
          { label: "Registriert", value: totalRegistered },
          { label: "Eingereicht", value: submittedStudents.length, color: "green" },
          { label: "Entwurf", value: draftStudents.length, color: "amber" },
        ]}
      />

      <ProgressBar
        value={submittedStudents.length}
        max={totalRegistered}
        label="Eingereicht"
        color="green"
      />

      <ParticipationSection
        groups={[
          { label: "Eingereicht", color: "green", items: submittedList },
          { label: "Entwurf", color: "amber", items: draftList },
        ]}
      />

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Felder verwalten
        </h2>
        <Card>
          <FieldManagement initialFields={fields.map(toFieldDefinition)} />
        </Card>
      </div>
    </div>
  );
}
