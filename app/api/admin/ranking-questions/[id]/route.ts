import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateQuestionSchema } from "@/lib/validation";

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
    const validation = updateQuestionSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const existing = await prisma.rankingQuestion.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Frage nicht gefunden." },
        { status: 404 }
      );
    }

    const { text, type, answerMode, active } = validation.data;

    const updated = await prisma.rankingQuestion.update({
      where: { id },
      data: {
        ...(text && { text }),
        ...(type && { type }),
        ...(answerMode !== undefined && { answerMode }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(
      { message: "Frage erfolgreich aktualisiert.", question: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Question update error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existing = await prisma.rankingQuestion.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Frage nicht gefunden." },
        { status: 404 }
      );
    }

    await prisma.rankingQuestion.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json(
      { message: "Frage erfolgreich deaktiviert." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Question delete error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
