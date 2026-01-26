import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { SurveyManagement } from "@/components/admin/survey/SurveyManagement";
import { redirect } from "next/navigation";

export default async function UmfragenFragenPage() {
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
      <p className="text-gray-600">
        Verwalte die Umfrage-Fragen und Antwortmöglichkeiten.
      </p>

      <Card>
        <SurveyManagement initialQuestions={questions} />
      </Card>
    </div>
  );
}
