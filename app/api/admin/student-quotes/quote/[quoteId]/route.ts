import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateStudentQuoteSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
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
    const existing = await prisma.studentQuote.findUnique({
      where: { id: quoteId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Zitat nicht gefunden." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateStudentQuoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const updated = await prisma.studentQuote.update({
      where: { id: quoteId },
      data: { text: validation.data.text.trim() },
    });

    return NextResponse.json(
      { message: "Zitat aktualisiert.", quote: updated },
      { status: 200 }
    );
  } catch {
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
    const existing = await prisma.studentQuote.findUnique({
      where: { id: quoteId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Zitat nicht gefunden." },
        { status: 404 }
      );
    }

    await prisma.studentQuote.delete({
      where: { id: quoteId },
    });

    return NextResponse.json(
      { message: "Zitat gelöscht." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
