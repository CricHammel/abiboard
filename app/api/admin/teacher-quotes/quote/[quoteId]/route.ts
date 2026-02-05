import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTeacherQuoteSchema } from "@/lib/validation";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const alias = getAdminAlias(request);
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

  const { quoteId } = await params;

  try {
    const existing = await prisma.teacherQuote.findUnique({
      where: { id: quoteId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Zitat nicht gefunden." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateTeacherQuoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const updated = await prisma.teacherQuote.update({
      where: { id: quoteId },
      data: { text: validation.data.text.trim() },
    });

    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "TeacherQuote",
      entityId: quoteId,
      oldValues: { text: existing.text },
      newValues: { text: validation.data.text.trim() },
    });

    return NextResponse.json(
      { message: "Zitat aktualisiert.", quote: updated },
      { status: 200 }
    );
  } catch (error) {
    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "TeacherQuote",
      entityId: quoteId,
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
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const alias = getAdminAlias(request);
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

  const { quoteId } = await params;

  try {
    const existing = await prisma.teacherQuote.findUnique({
      where: { id: quoteId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Zitat nicht gefunden." },
        { status: 404 }
      );
    }

    await prisma.teacherQuote.delete({
      where: { id: quoteId },
    });

    await logAdminAction({
      alias,
      action: "DELETE",
      entity: "TeacherQuote",
      entityId: quoteId,
      oldValues: { text: existing.text },
    });

    return NextResponse.json(
      { message: "Zitat gelöscht." },
      { status: 200 }
    );
  } catch (error) {
    await logAdminAction({
      alias,
      action: "DELETE",
      entity: "TeacherQuote",
      entityId: quoteId,
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
