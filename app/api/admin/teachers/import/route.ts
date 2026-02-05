import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Salutation } from "@prisma/client";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

interface ImportResult {
  success: number;
  skipped: number;
  errors: string[];
}

function parseSalutation(value: string): Salutation | null {
  const normalized = value.toLowerCase().replace(/\./g, "").trim();
  if (normalized === "hr" || normalized === "herr") return "HERR";
  if (normalized === "fr" || normalized === "frau") return "FRAU";
  return null;
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

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const salutationRaw = row.salutation?.trim();
      const lastName = row.lastName?.trim();

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

      const firstName = row.firstName?.trim() || undefined;
      const subject = row.subject?.trim() || undefined;

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

    await logAdminAction({
      alias,
      action: "IMPORT",
      entity: "Teacher",
      entityName: `${result.success} importiert`,
      newValues: {
        imported: result.success,
        skipped: result.skipped,
        errors: result.errors.length,
      },
    });

    return NextResponse.json(
      {
        message: `Import abgeschlossen: ${result.success} Lehrer hinzugefügt, ${result.skipped} übersprungen.`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Teacher import error:", error);
    await logAdminAction({
      alias,
      action: "IMPORT",
      entity: "Teacher",
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
