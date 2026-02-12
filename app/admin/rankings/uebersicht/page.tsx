import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RankingStats } from "@/components/admin/rankings/RankingStats";
import { QuestionManagement } from "@/components/admin/ranking-questions/QuestionManagement";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RankingsUebersichtPage() {
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
      <RankingStats
        totalStudents={totalStudents}
        submittedCount={submissions.length}
        submitted={submitted}
        notSubmitted={notSubmitted}
      />

      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Fragen verwalten
          </h2>
          <Link href="/admin/rankings/uebersicht/import">
            <Button variant="secondary">CSV Import</Button>
          </Link>
        </div>

        <Card>
          <QuestionManagement initialQuestions={questions} />
        </Card>
      </div>
    </div>
  );
}
