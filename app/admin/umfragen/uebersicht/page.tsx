import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { SurveyStats } from "@/components/admin/survey/SurveyStats";
import { SurveyManagement } from "@/components/admin/survey/SurveyManagement";
import { redirect } from "next/navigation";

export default async function UmfragenUebersichtPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const questions = await prisma.surveyQuestion.findMany({
    orderBy: { order: "asc" },
    include: {
      options: {
        orderBy: { order: "asc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <SurveyStats />

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Fragen verwalten
        </h2>
        <Card>
          <SurveyManagement initialQuestions={questions} />
        </Card>
      </div>
    </div>
  );
}
