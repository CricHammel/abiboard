import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildCsv, csvResponse } from "@/lib/csv-export";
import { NextResponse } from "next/server";
import { formatTeacherName, formatStudentName, getDuplicateFirstNames } from "@/lib/format";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur für Admins zugänglich." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "lehrer") {
      return exportTeacherQuotes();
    } else if (type === "schueler") {
      return exportStudentQuotes();
    } else {
      return NextResponse.json(
        { error: "Parameter 'type' muss 'lehrer' oder 'schueler' sein." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Export quotes error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}

// Quotation marks (straight/curly doubles and guillemets) that some students
// wrap their quote in. Removed so quotes look consistent. Single quotes /
// apostrophes are kept on purpose (they occur inside words like "geht's").
const QUOTE_CHARS = /["“”„‟«»‹›]/g;

function stripQuoteMarks(text: string): string {
  return text.replace(QUOTE_CHARS, "").trim();
}

/**
 * Builds a CSV grouped into one "block" per person, as InDesign needs it:
 * a heading row repeating the name in both columns, then one row per quote,
 * then a blank separator row. Blocks follow the input order (sorted by last
 * name); quotes keep their order within each block.
 */
function buildBlockedQuoteCsv(
  nameHeader: string,
  quotes: { personId: string; name: string; text: string }[]
): string {
  const groups = new Map<string, { name: string; texts: string[] }>();
  for (const quote of quotes) {
    let group = groups.get(quote.personId);
    if (!group) {
      group = { name: quote.name, texts: [] };
      groups.set(quote.personId, group);
    }
    group.texts.push(quote.text);
  }

  const rows: string[][] = [];
  for (const group of groups.values()) {
    rows.push([group.name, group.name]); // heading row: name in both columns
    for (const text of group.texts) {
      rows.push([group.name, text]);
    }
    rows.push(["", ""]); // blank separator line after each block
  }

  return buildCsv([nameHeader, "Zitat"], rows);
}

async function exportTeacherQuotes(): Promise<Response> {
  const quotes = await prisma.teacherQuote.findMany({
    where: {
      teacher: { active: true },
    },
    include: {
      teacher: {
        select: { salutation: true, firstName: true, lastName: true, subject: true },
      },
    },
    orderBy: [
      { teacher: { lastName: "asc" } },
      { createdAt: "asc" },
    ],
  });

  const csv = buildBlockedQuoteCsv(
    "Lehrer",
    quotes.map((q) => ({
      personId: q.teacherId,
      name: formatTeacherName(q.teacher, { includeSubject: false }),
      text: stripQuoteMarks(q.text),
    }))
  );
  return csvResponse(csv, "zitate_lehrer.csv");
}

async function exportStudentQuotes(): Promise<Response> {
  const quotes = await prisma.studentQuote.findMany({
    where: {
      student: { active: true },
    },
    include: {
      student: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: [
      { student: { lastName: "asc" } },
      { createdAt: "asc" },
    ],
  });

  // First name only, disambiguated against the whole class.
  const allStudents = await prisma.student.findMany({ select: { firstName: true } });
  const duplicateFirstNames = getDuplicateFirstNames(allStudents);

  const csv = buildBlockedQuoteCsv(
    "Schüler",
    quotes.map((q) => ({
      personId: q.studentId,
      name: formatStudentName(q.student, duplicateFirstNames),
      text: stripQuoteMarks(q.text),
    }))
  );
  return csvResponse(csv, "zitate_schueler.csv");
}
