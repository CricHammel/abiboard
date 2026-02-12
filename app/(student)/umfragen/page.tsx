import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SurveyPage } from "@/components/survey/SurveyPage";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { isDeadlinePassed } from "@/lib/deadline";

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

  const deadlinePassed = await isDeadlinePassed();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Umfragen"
        description="Beantworte die Fragen für das Abibuch."
      />

      {deadlinePassed && (
        <Alert variant="info">
          Die Abgabefrist ist abgelaufen. Inhalte können nicht mehr bearbeitet werden.
        </Alert>
      )}

      <SurveyPage initialQuestions={questions} initialAnswers={answersMap} deadlinePassed={deadlinePassed} />
    </div>
  );
}
