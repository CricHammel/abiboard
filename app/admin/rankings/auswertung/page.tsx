import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { RankingResults } from "@/components/admin/rankings/RankingResults";
import { redirect } from "next/navigation";

export default async function RankingsAuswertungPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const questions = await prisma.rankingQuestion.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <Card>
        <RankingResults questions={questions} />
      </Card>
    </div>
  );
}
