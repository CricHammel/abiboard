import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Zugriff verweigert." },
        { status: 403 }
      );
    }

    // Fetch active questions with options and user's answers
    const [questions, answers] = await Promise.all([
      prisma.surveyQuestion.findMany({
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
      }),
      prisma.surveyAnswer.findMany({
        where: { userId: session.user.id },
        select: {
          questionId: true,
          optionId: true,
        },
      }),
    ]);

    // Create a map of questionId -> optionId for easy lookup
    const answersMap: Record<string, string> = {};
    for (const answer of answers) {
      answersMap[answer.questionId] = answer.optionId;
    }

    return NextResponse.json(
      {
        questions,
        answers: answersMap,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Survey fetch error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
