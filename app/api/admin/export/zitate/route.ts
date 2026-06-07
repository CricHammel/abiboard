import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildCsv, csvResponse } from "@/lib/csv-export";
import { NextResponse } from "next/server";
import { formatTeacherName } from "@/lib/format";

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

  const headers = ["Lehrer", "Zitat"];
  const rows = quotes.map((q) => {
    return [formatTeacherName(q.teacher, { includeSubject: false }), q.text];
  });

  const csv = buildCsv(headers, rows);
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

  const headers = ["Vorname", "Nachname", "Zitat"];
  const rows = quotes.map((q) => [
    q.student.firstName,
    q.student.lastName,
    q.text,
  ]);

  const csv = buildCsv(headers, rows);
  return csvResponse(csv, "zitate_schueler.csv");
}
