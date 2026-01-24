import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTeacherQuotesSchema } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teacherId: string }> }
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

  const { teacherId } = await params;

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId, active: true },
      select: {
        id: true,
        salutation: true,
        firstName: true,
        lastName: true,
        subject: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Lehrer nicht gefunden." },
        { status: 404 }
      );
    }

    const quotes = await prisma.teacherQuote.findMany({
      where: { teacherId },
      select: {
        id: true,
        text: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const quotesWithOwnership = quotes.map((quote) => ({
      id: quote.id,
      text: quote.text,
      createdAt: quote.createdAt,
      isOwn: quote.userId === session.user.id,
    }));

    return NextResponse.json(
      { teacher, quotes: quotesWithOwnership },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teacherId: string }> }
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

  const { teacherId } = await params;

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId, active: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Lehrer nicht gefunden." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = createTeacherQuotesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { quotes } = validation.data;

    const createdQuotes = await prisma.teacherQuote.createMany({
      data: quotes.map((text) => ({
        text: text.trim(),
        teacherId,
        userId: session.user.id,
      })),
    });

    return NextResponse.json(
      {
        message: `${createdQuotes.count} Zitat${createdQuotes.count !== 1 ? "e" : ""} hinzugefügt.`,
        count: createdQuotes.count,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
