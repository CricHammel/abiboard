import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SteckbriefeOverview } from "@/components/admin/steckbriefe/SteckbriefeOverview";

export default async function SteckbriefUebersichtPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const students = await prisma.student.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profile: {
            select: { status: true, updatedAt: true },
          },
        },
      },
    },
  });

  const totalRegistered = students.filter((s) => s.user).length;
  const submittedCount = students.filter(
    (s) => s.user?.profile?.status === "SUBMITTED"
  ).length;

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Übersicht aller Steckbrief-Einreichungen.
      </p>

      <Card>
        <ProgressBar
          value={submittedCount}
          max={totalRegistered}
          label="Eingereicht"
          color="green"
        />
      </Card>

      <Card>
        <SteckbriefeOverview students={students} />
      </Card>
    </div>
  );
}
