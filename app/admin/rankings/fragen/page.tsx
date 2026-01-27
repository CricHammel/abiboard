import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuestionManagement } from "@/components/admin/ranking-questions/QuestionManagement";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RankingsFragenPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const questions = await prisma.rankingQuestion.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-gray-600">
          Verwalte die Fragen für die Rankings.
        </p>
        <div className="flex gap-2">
          <Link href="/admin/rankings/fragen/import">
            <Button variant="secondary">CSV Import</Button>
          </Link>
        </div>
      </div>

      <Card>
        <QuestionManagement initialQuestions={questions} />
      </Card>
    </div>
  );
}
