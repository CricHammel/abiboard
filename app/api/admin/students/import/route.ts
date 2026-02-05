import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

const SCHOOL_EMAIL_DOMAIN = "@lessing-ffm.net";

interface ImportResult {
  success: number;
  skipped: number;
  errors: string[];
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

    // Get existing students to check for duplicates
    const existingStudents = await prisma.student.findMany({
      select: { email: true },
    });
    const existingEmails = new Set(existingStudents.map((s) => s.email));

    const studentsToCreate: {
      firstName: string;
      lastName: string;
      email: string;
      gender?: "MALE" | "FEMALE";
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const firstName = row.firstName?.trim();
      const lastName = row.lastName?.trim();

      if (!firstName || !lastName) {
        result.errors.push(`Zeile ${i + 1}: Vorname oder Nachname fehlt.`);
        continue;
      }

      // Generate email if not provided
      let email: string;
      if (row.email?.trim()) {
        email = row.email.trim().toLowerCase();
      } else {
        // Generate email from name: vorname.nachname@domain
        const normalizedFirstName = firstName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/ä/g, "ae")
          .replace(/ö/g, "oe")
          .replace(/ü/g, "ue")
          .replace(/ß/g, "ss")
          .replace(/[^a-z]/g, "");
        const normalizedLastName = lastName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/ä/g, "ae")
          .replace(/ö/g, "oe")
          .replace(/ü/g, "ue")
          .replace(/ß/g, "ss")
          .replace(/[^a-z]/g, "");
        email = `${normalizedFirstName}.${normalizedLastName}${SCHOOL_EMAIL_DOMAIN}`;
      }

      // Validate email domain
      if (!email.endsWith(SCHOOL_EMAIL_DOMAIN)) {
        result.errors.push(
          `Zeile ${i + 1}: E-Mail-Adresse muss auf ${SCHOOL_EMAIL_DOMAIN} enden.`
        );
        continue;
      }

      // Check for duplicates
      if (existingEmails.has(email)) {
        result.skipped++;
        continue;
      }

      // Check for duplicates within the import batch
      if (studentsToCreate.some((s) => s.email === email)) {
        result.skipped++;
        continue;
      }

      // Parse gender
      let gender: "MALE" | "FEMALE" | undefined;
      if (row.gender?.trim()) {
        const genderValue = row.gender.trim().toLowerCase();
        if (genderValue === "m" || genderValue === "männlich" || genderValue === "male") {
          gender = "MALE";
        } else if (genderValue === "w" || genderValue === "weiblich" || genderValue === "female") {
          gender = "FEMALE";
        }
      }

      studentsToCreate.push({ firstName, lastName, email, gender });
      existingEmails.add(email);
    }

    // Bulk create students
    if (studentsToCreate.length > 0) {
      await prisma.student.createMany({
        data: studentsToCreate,
        skipDuplicates: true,
      });
      result.success = studentsToCreate.length;
    }

    await logAdminAction({
      alias,
      action: "IMPORT",
      entity: "Student",
      entityName: `${result.success} importiert`,
      newValues: {
        imported: result.success,
        skipped: result.skipped,
        errors: result.errors.length,
      },
    });

    return NextResponse.json(
      {
        message: `Import abgeschlossen: ${result.success} Schüler hinzugefügt, ${result.skipped} übersprungen.`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CSV import error:", error);
    await logAdminAction({
      alias,
      action: "IMPORT",
      entity: "Student",
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
