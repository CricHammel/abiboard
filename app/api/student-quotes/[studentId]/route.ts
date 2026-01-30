import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStudentQuotesSchema } from "@/lib/validation";
import { isDeadlinePassed } from "@/lib/deadline";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
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

  const { studentId } = await params;

  try {
    const student = await prisma.student.findFirst({
      where: { id: studentId, active: true, NOT: { userId: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Schüler nicht gefunden." },
        { status: 404 }
      );
    }

    // Check if trying to view own quotes (not allowed)
    const currentStudent = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (currentStudent?.id === studentId) {
      return NextResponse.json(
        { error: "Du kannst keine Zitate über dich selbst ansehen." },
        { status: 403 }
      );
    }

    const quotes = await prisma.studentQuote.findMany({
      where: { studentId },
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
      { student, quotes: quotesWithOwnership },
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
  { params }: { params: Promise<{ studentId: string }> }
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

  if (await isDeadlinePassed()) {
    return NextResponse.json(
      { error: "Die Abgabefrist ist abgelaufen." },
      { status: 403 }
    );
  }

  const { studentId } = await params;

  try {
    const student = await prisma.student.findFirst({
      where: { id: studentId, active: true, NOT: { userId: null } },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Schüler nicht gefunden." },
        { status: 404 }
      );
    }

    // Check if trying to add quotes about self
    const currentStudent = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (currentStudent?.id === studentId) {
      return NextResponse.json(
        { error: "Du kannst keine Zitate über dich selbst hinzufügen." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createStudentQuotesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { quotes } = validation.data;

    const createdQuotes = await prisma.studentQuote.createMany({
      data: quotes.map((text) => ({
        text: text.trim(),
        studentId,
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
