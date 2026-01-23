import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RankingQuestionType } from "@prisma/client";

interface ImportResult {
  success: number;
  skipped: number;
  errors: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === "," || char === ";") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseType(value: string): RankingQuestionType | null {
  const normalized = value.toLowerCase().trim();
  if (normalized === "schüler" || normalized === "schueler" || normalized === "student") return "STUDENT";
  if (normalized === "lehrer" || normalized === "teacher") return "TEACHER";
  return null;
}

function parseBoolean(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return normalized === "ja" || normalized === "yes" || normalized === "true" || normalized === "1";
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen." },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Bitte lade eine CSV-Datei hoch." },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "Die CSV-Datei ist leer oder enthält keine Daten." },
        { status: 400 }
      );
    }

    const header = parseCSVLine(lines[0].toLowerCase());
    const textIdx = header.findIndex(
      (h) => h === "text" || h === "frage" || h === "question"
    );
    const typeIdx = header.findIndex(
      (h) => h === "typ" || h === "type" || h === "kategorie"
    );
    const genderIdx = header.findIndex(
      (h) => h === "geschlechtsspezifisch" || h === "gender_specific" || h === "geschlecht"
    );

    if (textIdx === -1 || typeIdx === -1) {
      return NextResponse.json(
        {
          error:
            "Die CSV-Datei muss die Spalten 'Text' und 'Typ' enthalten.",
        },
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
      genderSpecific: boolean;
      order: number;
    }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      const questionText = values[textIdx]?.trim();
      const typeRaw = values[typeIdx]?.trim();

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

      const genderSpecific = genderIdx !== -1 && values[genderIdx]
        ? parseBoolean(values[genderIdx])
        : false;

      questionsToCreate.push({
        text: questionText,
        type,
        genderSpecific,
        order: nextOrder++,
      });
    }

    if (questionsToCreate.length > 0) {
      await prisma.rankingQuestion.createMany({
        data: questionsToCreate,
      });
      result.success = questionsToCreate.length;
    }

    return NextResponse.json(
      {
        message: `Import abgeschlossen: ${result.success} Fragen hinzugefügt.`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Question CSV import error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
