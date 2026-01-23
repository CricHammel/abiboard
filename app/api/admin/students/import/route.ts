import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const SCHOOL_EMAIL_DOMAIN = "@lessing-ffm.net";

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

    // Parse header to find column indices
    const header = parseCSVLine(lines[0].toLowerCase());
    const firstNameIdx = header.findIndex(
      (h) => h === "vorname" || h === "firstname" || h === "first_name"
    );
    const lastNameIdx = header.findIndex(
      (h) => h === "nachname" || h === "lastname" || h === "last_name"
    );
    const emailIdx = header.findIndex((h) => h === "email" || h === "e-mail");
    const genderIdx = header.findIndex(
      (h) => h === "geschlecht" || h === "gender"
    );

    if (firstNameIdx === -1 || lastNameIdx === -1) {
      return NextResponse.json(
        {
          error:
            "Die CSV-Datei muss die Spalten 'Vorname' und 'Nachname' enthalten.",
        },
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

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      const firstName = values[firstNameIdx]?.trim();
      const lastName = values[lastNameIdx]?.trim();

      if (!firstName || !lastName) {
        result.errors.push(`Zeile ${i + 1}: Vorname oder Nachname fehlt.`);
        continue;
      }

      // Generate email if not provided
      let email: string;
      if (emailIdx !== -1 && values[emailIdx]?.trim()) {
        email = values[emailIdx].trim().toLowerCase();
      } else {
        // Generate email from name: vorname.nachname@domain
        const normalizedFirstName = firstName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
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

      // Parse gender if column exists
      let gender: "MALE" | "FEMALE" | undefined;
      if (genderIdx !== -1) {
        const genderValue = values[genderIdx]?.trim().toLowerCase();
        if (genderValue === "m" || genderValue === "männlich" || genderValue === "male") {
          gender = "MALE";
        } else if (genderValue === "w" || genderValue === "weiblich" || genderValue === "female") {
          gender = "FEMALE";
        }
      }

      studentsToCreate.push({ firstName, lastName, email, gender });
      existingEmails.add(email); // Track for duplicates within batch
    }

    // Bulk create students
    if (studentsToCreate.length > 0) {
      await prisma.student.createMany({
        data: studentsToCreate,
        skipDuplicates: true,
      });
      result.success = studentsToCreate.length;
    }

    return NextResponse.json(
      {
        message: `Import abgeschlossen: ${result.success} Schüler hinzugefügt, ${result.skipped} übersprungen.`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
