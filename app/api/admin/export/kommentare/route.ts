import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildTsv, tsvResponse } from "@/lib/tsv-export";
import { NextResponse } from "next/server";

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
        targetStudent: {
          select: { firstName: true, lastName: true },
        },
        targetTeacher: {
          select: { salutation: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const headers = ["Typ", "Empfänger", "Kommentar"];
    const rows = comments.map((comment) => {
      let typ: string;
      let recipient: string;

      if (comment.targetStudent) {
        typ = "Schüler/in";
        recipient = `${comment.targetStudent.firstName} ${comment.targetStudent.lastName}`;
      } else if (comment.targetTeacher) {
        typ = "Lehrer/in";
        const sal = comment.targetTeacher.salutation === "HERR" ? "Hr." : "Fr.";
        recipient = `${sal} ${comment.targetTeacher.lastName}`;
      } else {
        typ = "Unbekannt";
        recipient = "";
      }

      return [typ, recipient, comment.text];
    });

    // Sort by recipient name
    rows.sort((a, b) => a[1].localeCompare(b[1], "de"));

    const tsv = buildTsv(headers, rows);
    return tsvResponse(tsv, "kommentare.tsv");
  } catch (error) {
    console.error("Export comments error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
