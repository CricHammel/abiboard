import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { SurveyManagement } from "@/components/admin/survey/SurveyManagement";
import { redirect } from "next/navigation";

export default async function SurveyQuestionsPage() {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Umfragen</h1>
        <p className="text-gray-600 mt-2">
          Verwalte die Umfrage-Fragen und Antwortmöglichkeiten.
        </p>
      </div>

      <Card>
        <SurveyManagement initialQuestions={questions} />
      </Card>
    </div>
  );
}
