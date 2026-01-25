import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { surveyAnswerSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
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

    const body = await request.json();
    const validation = surveyAnswerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { optionId } = validation.data;

    // Verify question exists and is active
    const question = await prisma.surveyQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, active: true },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Frage nicht gefunden." },
        { status: 404 }
      );
    }

    if (!question.active) {
      return NextResponse.json(
        { error: "Diese Frage ist nicht mehr aktiv." },
        { status: 400 }
      );
    }

    // Verify option exists and belongs to the question
    const option = await prisma.surveyOption.findUnique({
      where: { id: optionId },
      select: { id: true, questionId: true },
    });

    if (!option) {
      return NextResponse.json(
        { error: "Antwort nicht gefunden." },
        { status: 404 }
      );
    }

    if (option.questionId !== questionId) {
      return NextResponse.json(
        { error: "Antwort gehört nicht zu dieser Frage." },
        { status: 400 }
      );
    }

    // Upsert the answer (create or update)
    await prisma.surveyAnswer.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
      create: {
        userId: session.user.id,
        questionId,
        optionId,
      },
      update: {
        optionId,
      },
    });

    return NextResponse.json(
      { message: "Antwort gespeichert." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Survey answer save error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
