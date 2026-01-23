import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { RankingStats } from "@/components/admin/rankings/RankingStats";
import { redirect } from "next/navigation";

export default async function AdminRankingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  // Only count users who have a linked Student entry (registered via whitelist)
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
  const notSubmitted = await prisma.user.findMany({
    where: {
      ...studentFilter,
      id: { notIn: submittedUserIds },
    },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ranking-Statistiken</h1>
        <p className="text-gray-600 mt-2">
          Übersicht über den Teilnahmestand und die Ergebnisse.
        </p>
      </div>

      <Card>
        <RankingStats
          initialData={{
            totalStudents,
            submittedCount: submissions.length,
            notSubmitted,
            questions,
          }}
        />
      </Card>
    </div>
  );
}
