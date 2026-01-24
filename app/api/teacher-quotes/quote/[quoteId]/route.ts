import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  if (session.user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Zugriff verweigert." },
      { status: 403 }
    );
  }

  const { quoteId } = await params;

  try {
    const quote = await prisma.teacherQuote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Zitat nicht gefunden." },
        { status: 404 }
      );
    }

    if (quote.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Du kannst nur deine eigenen Zitate löschen." },
        { status: 403 }
      );
    }

    await prisma.teacherQuote.delete({
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
