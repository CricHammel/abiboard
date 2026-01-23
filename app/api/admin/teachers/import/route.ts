import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Salutation } from "@prisma/client";

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

function parseSalutation(value: string): Salutation | null {
  const normalized = value.toLowerCase().replace(/\./g, "").trim();
  if (normalized === "hr" || normalized === "herr") return "HERR";
  if (normalized === "fr" || normalized === "frau") return "FRAU";
  return null;
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
    const salutationIdx = header.findIndex(
      (h) => h === "anrede" || h === "salutation"
    );
    const lastNameIdx = header.findIndex(
      (h) => h === "nachname" || h === "lastname" || h === "last_name"
    );
    const firstNameIdx = header.findIndex(
      (h) => h === "vorname" || h === "firstname" || h === "first_name"
    );
    const subjectIdx = header.findIndex(
      (h) => h === "fach" || h === "subject"
    );

    if (salutationIdx === -1 || lastNameIdx === -1) {
      return NextResponse.json(
        {
          error:
            "Die CSV-Datei muss die Spalten 'Anrede' und 'Nachname' enthalten.",
        },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: 0,
      skipped: 0,
      errors: [],
    };

    const existingTeachers = await prisma.teacher.findMany({
      select: { lastName: true, salutation: true },
    });
    const existingKeys = new Set(
      existingTeachers.map((t) => `${t.salutation}:${t.lastName.toLowerCase()}`)
    );

    const teachersToCreate: {
      salutation: Salutation;
      lastName: string;
      firstName?: string;
      subject?: string;
    }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      const salutationRaw = values[salutationIdx]?.trim();
      const lastName = values[lastNameIdx]?.trim();

      if (!salutationRaw || !lastName) {
        result.errors.push(`Zeile ${i + 1}: Anrede oder Nachname fehlt.`);
        continue;
      }

      const salutation = parseSalutation(salutationRaw);
      if (!salutation) {
        result.errors.push(
          `Zeile ${i + 1}: Ungültige Anrede "${salutationRaw}". Erlaubt: Hr., Fr.`
        );
        continue;
      }

      const key = `${salutation}:${lastName.toLowerCase()}`;
      if (existingKeys.has(key)) {
        result.skipped++;
        continue;
      }

      if (teachersToCreate.some(
        (t) => `${t.salutation}:${t.lastName.toLowerCase()}` === key
      )) {
        result.skipped++;
        continue;
      }

      const firstName = firstNameIdx !== -1 ? values[firstNameIdx]?.trim() || undefined : undefined;
      const subject = subjectIdx !== -1 ? values[subjectIdx]?.trim() || undefined : undefined;

      teachersToCreate.push({ salutation, lastName, firstName, subject });
      existingKeys.add(key);
    }

    if (teachersToCreate.length > 0) {
      await prisma.teacher.createMany({
        data: teachersToCreate,
        skipDuplicates: true,
      });
      result.success = teachersToCreate.length;
    }

    return NextResponse.json(
      {
        message: `Import abgeschlossen: ${result.success} Lehrer hinzugefügt, ${result.skipped} übersprungen.`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Teacher CSV import error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
