import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RankingQuestionType, AnswerMode } from "@prisma/client";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

interface ImportResult {
  success: number;
  skipped: number;
  errors: string[];
}

function parseType(value: string): RankingQuestionType | null {
  const normalized = value.toLowerCase().trim();
  if (normalized === "schüler" || normalized === "schueler" || normalized === "student") return "STUDENT";
  if (normalized === "lehrer" || normalized === "teacher") return "TEACHER";
  return null;
}

function parseAnswerMode(value: string): AnswerMode {
  const normalized = value.toLowerCase().trim();
  if (normalized === "gender_specific" || normalized === "genderspecific" || normalized === "m/w" || normalized === "geschlechtsspezifisch") {
    return "GENDER_SPECIFIC";
  }
  if (normalized === "duo" || normalized === "paar" || normalized === "zwei") {
    return "DUO";
  }
  // Legacy support: "ja/yes/true/1" means gender-specific
  if (normalized === "ja" || normalized === "yes" || normalized === "true" || normalized === "1") {
    return "GENDER_SPECIFIC";
  }
  return "SINGLE";
}

export async function POST(request: Request) {
  const alias = getAdminAlias(request);

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
    const rows: Record<string, string>[] = body.rows;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Keine Daten zum Importieren." },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: 0,
      skipped: 0,
      errors: [],
    };

    // Get current max order
    const lastQuestion = await prisma.rankingQuestion.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let nextOrder = (lastQuestion?.order ?? 0) + 1;

    const questionsToCreate: {
      text: string;
      type: RankingQuestionType;
      answerMode: AnswerMode;
      order: number;
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const questionText = row.text?.trim();
      const typeRaw = row.type?.trim();

      if (!questionText || !typeRaw) {
        result.errors.push(`Zeile ${i + 1}: Text oder Typ fehlt.`);
        continue;
      }

      const type = parseType(typeRaw);
      if (!type) {
        result.errors.push(
          `Zeile ${i + 1}: Ungültiger Typ "${typeRaw}". Erlaubt: Schüler, Lehrer.`
        );
        continue;
      }

      // Support both old "genderSpecific" and new "answerMode" column names
      const answerModeRaw = row.answerMode?.trim() || row.genderSpecific?.trim() || "";
      const answerMode = parseAnswerMode(answerModeRaw);

      questionsToCreate.push({
        text: questionText,
        type,
        answerMode,
        order: nextOrder++,
      });
    }

    if (questionsToCreate.length > 0) {
      await prisma.rankingQuestion.createMany({
        data: questionsToCreate,
      });
      result.success = questionsToCreate.length;
    }

    await logAdminAction({
      alias,
      action: "IMPORT",
      entity: "RankingQuestion",
      entityName: `${result.success} importiert`,
      newValues: {
        imported: result.success,
        errors: result.errors.length,
      },
    });

    return NextResponse.json(
      {
        message: `Import abgeschlossen: ${result.success} Fragen hinzugefügt.`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Question import error:", error);
    await logAdminAction({
      alias,
      action: "IMPORT",
      entity: "RankingQuestion",
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
