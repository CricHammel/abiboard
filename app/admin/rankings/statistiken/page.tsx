import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { RankingStats } from "@/components/admin/rankings/RankingStats";
import { redirect } from "next/navigation";

export default async function RankingsStatistikenPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const studentFilter = { role: "STUDENT" as const, active: true, student: { isNot: null } };

  const [totalStudents, submissions, questions] = await Promise.all([
    prisma.user.count({
      where: studentFilter,
    }),
    prisma.rankingSubmission.findMany({
      where: { status: "SUBMITTED" },
      select: { userId: true },
    }),
    prisma.rankingQuestion.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const submittedUserIds = submissions.map((s) => s.userId);
  const [submitted, notSubmitted] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...studentFilter,
        id: { in: submittedUserIds },
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.user.findMany({
      where: {
        ...studentFilter,
        id: { notIn: submittedUserIds },
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Übersicht über den Teilnahmestand und die Ergebnisse.
      </p>

      <Card>
        <RankingStats
          initialData={{
            totalStudents,
            submittedCount: submissions.length,
            submitted,
            notSubmitted,
            questions,
          }}
        />
      </Card>
    </div>
  );
}
