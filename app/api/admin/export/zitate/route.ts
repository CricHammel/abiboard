import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildTsv, tsvResponse } from "@/lib/tsv-export";
import { NextResponse } from "next/server";

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

  const headers = ["Lehrer", "Anrede", "Fach", "Zitat"];
  const rows = quotes.map((q) => {
    const sal = q.teacher.salutation === "HERR" ? "Herr" : "Frau";
    const name = q.teacher.firstName
      ? `${q.teacher.firstName} ${q.teacher.lastName}`
      : q.teacher.lastName;
    return [name, sal, q.teacher.subject || "", q.text];
  });

  const tsv = buildTsv(headers, rows);
  return tsvResponse(tsv, "zitate_lehrer.tsv");
}

async function exportStudentQuotes(): Promise<Response> {
  const quotes = await prisma.studentQuote.findMany({
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

  const tsv = buildTsv(headers, rows);
  return tsvResponse(tsv, "zitate_schueler.tsv");
}
