import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createSurveyQuestionSchema } from "@/lib/validation";

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

    const questions = await prisma.surveyQuestion.findMany({
      orderBy: { order: "asc" },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error("Survey questions fetch error:", error);
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
    const validation = createSurveyQuestionSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { text, options } = validation.data;

    // Auto-assign order (last + 1)
    const lastQuestion = await prisma.surveyQuestion.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (lastQuestion?.order ?? 0) + 1;

    // Create question with options in a transaction
    const question = await prisma.surveyQuestion.create({
      data: {
        text,
        order: nextOrder,
        options: {
          create: options.map((option, index) => ({
            text: option.text,
            order: index + 1,
          })),
        },
      },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(
      { message: "Frage erfolgreich erstellt.", question },
      { status: 201 }
    );
  } catch (error) {
    console.error("Survey question creation error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
