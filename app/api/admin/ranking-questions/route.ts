import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createQuestionSchema } from "@/lib/validation";

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

    const questions = await prisma.rankingQuestion.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error("Questions fetch error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const validation = createQuestionSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { text, type, genderSpecific } = validation.data;

    // Auto-assign order (last + 1)
    const lastQuestion = await prisma.rankingQuestion.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (lastQuestion?.order ?? 0) + 1;

    const question = await prisma.rankingQuestion.create({
      data: {
        text,
        type,
        genderSpecific: genderSpecific ?? false,
        order: nextOrder,
      },
    });

    return NextResponse.json(
      { message: "Frage erfolgreich erstellt.", question },
      { status: 201 }
    );
  } catch (error) {
    console.error("Question creation error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
