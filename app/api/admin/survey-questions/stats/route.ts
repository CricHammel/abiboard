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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Zugriff verweigert. Admin-Rechte erforderlich." },
        { status: 403 }
      );
    }

    // Get all active questions with options
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

    // Count total active students
    const totalStudents = await prisma.user.count({
      where: {
        role: "STUDENT",
        active: true,
      },
    });

    // Count students who answered at least one question
    const studentsWithAnswers = await prisma.surveyAnswer.groupBy({
      by: ["userId"],
    });
    const participatingStudents = studentsWithAnswers.length;

    // Get answer counts per option for each question
    const answerCounts = await prisma.surveyAnswer.groupBy({
      by: ["questionId", "optionId"],
      _count: {
        id: true,
      },
    });

    // Build a map for quick lookup
    const answerCountMap: Record<string, Record<string, number>> = {};
    for (const item of answerCounts) {
      if (!answerCountMap[item.questionId]) {
        answerCountMap[item.questionId] = {};
      }
      answerCountMap[item.questionId][item.optionId] = item._count.id;
    }

    // Get total answers per question
    const totalAnswersPerQuestion = await prisma.surveyAnswer.groupBy({
      by: ["questionId"],
      _count: {
        id: true,
      },
    });

    const totalAnswersMap: Record<string, number> = {};
    for (const item of totalAnswersPerQuestion) {
      totalAnswersMap[item.questionId] = item._count.id;
    }

    // Build stats for each question
    const questionStats = questions.map((question) => {
      const totalAnswers = totalAnswersMap[question.id] || 0;
      const optionCounts = answerCountMap[question.id] || {};

      return {
        id: question.id,
        text: question.text,
        totalAnswers,
        options: question.options.map((option) => {
          const count = optionCounts[option.id] || 0;
          const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;

          return {
            id: option.id,
            text: option.text,
            count,
            percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
          };
        }),
      };
    });

    return NextResponse.json(
      {
        totalStudents,
        participatingStudents,
        participationRate:
          totalStudents > 0
            ? Math.round((participatingStudents / totalStudents) * 100 * 10) / 10
            : 0,
        questions: questionStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Survey stats fetch error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
