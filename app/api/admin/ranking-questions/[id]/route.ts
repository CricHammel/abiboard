import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateQuestionSchema } from "@/lib/validation";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const alias = getAdminAlias(request);
  const { id } = await params;

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

    const body = await request.json();
    const validation = updateQuestionSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      await logAdminAction({
        alias,
        action: "UPDATE",
        entity: "RankingQuestion",
        entityId: id,
        success: false,
        error: firstError?.message || "Ungültige Eingabedaten",
      });
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

    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "RankingQuestion",
      entityId: id,
      entityName: updated.text,
      oldValues: {
        text: existing.text,
        type: existing.type,
        answerMode: existing.answerMode,
        active: existing.active,
      },
      newValues: { text, type, answerMode, active },
    });

    return NextResponse.json(
      { message: "Frage erfolgreich aktualisiert.", question: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Question update error:", error);
    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "RankingQuestion",
      entityId: id,
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
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
  const alias = getAdminAlias(request);
  const { id } = await params;

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

    await logAdminAction({
      alias,
      action: "DELETE",
      entity: "RankingQuestion",
      entityId: id,
      entityName: existing.text,
      oldValues: { active: true },
      newValues: { active: false },
    });

    return NextResponse.json(
      { message: "Frage erfolgreich deaktiviert." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Question delete error:", error);
    await logAdminAction({
      alias,
      action: "DELETE",
      entity: "RankingQuestion",
      entityId: id,
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
