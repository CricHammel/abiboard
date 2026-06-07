import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildCsv, csvResponse } from "@/lib/csv-export";
import { NextResponse } from "next/server";
import { formatTeacherName, formatStudentName, getDuplicateFirstNames } from "@/lib/format";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur für Admins zugänglich." }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        OR: [
          { targetStudent: { active: true } },
          { targetTeacher: { active: true } },
        ],
      },
      include: {
        author: {
          select: { firstName: true, lastName: true },
        },
        targetStudent: {
          select: { firstName: true, lastName: true },
        },
        targetTeacher: {
          select: { salutation: true, lastName: true, subject: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Students (recipients and authors) are shown by first name only,
    // disambiguated against the whole class.
    const allStudents = await prisma.student.findMany({ select: { firstName: true } });
    const duplicateFirstNames = getDuplicateFirstNames(allStudents);

    const headers = ["Typ", "Empfänger", "Autor", "Kommentar"];
    const entries = comments.map((comment) => {
      let typ: string;
      let recipient: string;
      // Last name of the recipient, used as a stable sort key.
      let recipientSortKey: string;

      if (comment.targetStudent) {
        typ = "Schüler/in";
        recipient = formatStudentName(comment.targetStudent, duplicateFirstNames);
        recipientSortKey = comment.targetStudent.lastName;
      } else if (comment.targetTeacher) {
        typ = "Lehrer/in";
        recipient = formatTeacherName(comment.targetTeacher, { includeSubject: false });
        recipientSortKey = comment.targetTeacher.lastName;
      } else {
        typ = "Unbekannt";
        recipient = "";
        recipientSortKey = "";
      }

      const author = formatStudentName(comment.author, duplicateFirstNames);
      return { row: [typ, recipient, author, comment.text], recipientSortKey };
    });

    // Sort by recipient last name
    entries.sort((a, b) => a.recipientSortKey.localeCompare(b.recipientSortKey, "de"));
    const rows = entries.map((e) => e.row);

    const csv = buildCsv(headers, rows);
    return csvResponse(csv, "kommentare.csv");
  } catch (error) {
    console.error("Export comments error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
