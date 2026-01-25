import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SurveyPage } from "@/components/survey/SurveyPage";
import { redirect } from "next/navigation";

export default async function StudentSurveyPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch active questions with options
  const questions = await prisma.surveyQuestion.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: {
      options: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          text: true,
          order: true,
        },
      },
    },
  });

  // Fetch user's answers
  const answers = await prisma.surveyAnswer.findMany({
    where: { userId: session.user.id },
    select: {
      questionId: true,
      optionId: true,
    },
  });

  // Create a map of questionId -> optionId
  const answersMap: Record<string, string> = {};
  for (const answer of answers) {
    answersMap[answer.questionId] = answer.optionId;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Umfragen</h1>
        <p className="text-gray-600 mt-2">
          Beantworte die Fragen für das Abibuch.
        </p>
      </div>

      <SurveyPage initialQuestions={questions} initialAnswers={answersMap} />
    </div>
  );
}
