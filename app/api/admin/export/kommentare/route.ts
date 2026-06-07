import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildCsv, csvResponse } from "@/lib/csv-export";
import { NextResponse } from "next/server";
import { formatTeacherName } from "@/lib/format";

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

    const headers = ["Typ", "Empfänger", "Autor", "Kommentar"];
    const rows = comments.map((comment) => {
      let typ: string;
      let recipient: string;

      if (comment.targetStudent) {
        typ = "Schüler/in";
        recipient = `${comment.targetStudent.firstName} ${comment.targetStudent.lastName}`;
      } else if (comment.targetTeacher) {
        typ = "Lehrer/in";
        recipient = formatTeacherName(comment.targetTeacher, { includeSubject: false });
      } else {
        typ = "Unbekannt";
        recipient = "";
      }

      const author = `${comment.author.firstName} ${comment.author.lastName}`;
      return [typ, recipient, author, comment.text];
    });

    // Sort by recipient name
    rows.sort((a, b) => a[1].localeCompare(b[1], "de"));

    const csv = buildCsv(headers, rows);
    return csvResponse(csv, "kommentare.csv");
  } catch (error) {
    console.error("Export comments error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
