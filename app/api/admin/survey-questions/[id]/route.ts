import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateSurveyQuestionSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const validation = updateSurveyQuestionSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const existing = await prisma.surveyQuestion.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Frage nicht gefunden." },
        { status: 404 }
      );
    }

    const { text, options, active } = validation.data;

    // If options are provided, replace all existing options
    // This will cascade-delete any answers for those options
    if (options) {
      await prisma.$transaction(async (tx) => {
        // Delete all existing options (cascades to answers)
        await tx.surveyOption.deleteMany({
          where: { questionId: id },
        });

        // Update question and create new options
        await tx.surveyQuestion.update({
          where: { id },
          data: {
            ...(text && { text }),
            ...(active !== undefined && { active }),
            options: {
              create: options.map((option, index) => ({
                text: option.text,
                order: index + 1,
              })),
            },
          },
        });
      });
    } else {
      // Just update question text or active status
      await prisma.surveyQuestion.update({
        where: { id },
        data: {
          ...(text && { text }),
          ...(active !== undefined && { active }),
        },
      });
    }

    // Fetch updated question with options
    const updated = await prisma.surveyQuestion.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(
      { message: "Frage erfolgreich aktualisiert.", question: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Survey question update error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
