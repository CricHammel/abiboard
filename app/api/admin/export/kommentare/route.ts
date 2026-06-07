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

    const type = new URL(request.url).searchParams.get("type");
    if (type !== "schueler" && type !== "lehrer") {
      return NextResponse.json(
        { error: "Parameter 'type' muss 'lehrer' oder 'schueler' sein." },
        { status: 400 }
      );
    }

    return type === "lehrer" ? exportTeacherComments() : exportStudentComments();
  } catch (error) {
    console.error("Export comments error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}

/**
 * One row per recipient, with comments spread across "Kommentar N" columns up
 * to the highest comment count of any recipient. Each comment cell ends with
 * the author's name in parentheses, e.g. "bla bla (Franz)". This wide, padded
 * layout is intentionally non-normalized — it is what InDesign Data Merge needs.
 */
function buildCommentCsv(
  groups: { recipient: string; sortKey: string; comments: string[] }[]
): string {
  groups.sort((a, b) => a.sortKey.localeCompare(b.sortKey, "de"));

  const maxComments = groups.reduce((max, g) => Math.max(max, g.comments.length), 0);
  const headers = [
    "Empfänger",
    ...Array.from({ length: maxComments }, (_, i) => `Kommentar ${i + 1}`),
  ];

  const rows = groups.map((g) => {
    const row = [g.recipient];
    for (let i = 0; i < maxComments; i++) {
      row.push(g.comments[i] ?? "");
    }
    return row;
  });

  return buildCsv(headers, rows);
}

async function exportStudentComments(): Promise<Response> {
  const comments = await prisma.comment.findMany({
    where: { targetStudent: { active: true } },
    include: {
      author: { select: { firstName: true, lastName: true } },
      targetStudent: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const allStudents = await prisma.student.findMany({ select: { firstName: true } });
  const duplicateFirstNames = getDuplicateFirstNames(allStudents);

  const groups = new Map<string, { recipient: string; sortKey: string; comments: string[] }>();
  for (const comment of comments) {
    if (!comment.targetStudentId || !comment.targetStudent) continue;
    let group = groups.get(comment.targetStudentId);
    if (!group) {
      group = {
        recipient: formatStudentName(comment.targetStudent, duplicateFirstNames),
        sortKey: comment.targetStudent.lastName,
        comments: [],
      };
      groups.set(comment.targetStudentId, group);
    }
    const author = formatStudentName(comment.author, duplicateFirstNames);
    group.comments.push(`${comment.text} (${author})`);
  }

  return csvResponse(buildCommentCsv([...groups.values()]), "kommentare_schueler.csv");
}

async function exportTeacherComments(): Promise<Response> {
  const comments = await prisma.comment.findMany({
    where: { targetTeacher: { active: true } },
    include: {
      author: { select: { firstName: true, lastName: true } },
      targetTeacher: { select: { salutation: true, lastName: true, subject: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const allStudents = await prisma.student.findMany({ select: { firstName: true } });
  const duplicateFirstNames = getDuplicateFirstNames(allStudents);

  const groups = new Map<string, { recipient: string; sortKey: string; comments: string[] }>();
  for (const comment of comments) {
    if (!comment.targetTeacherId || !comment.targetTeacher) continue;
    let group = groups.get(comment.targetTeacherId);
    if (!group) {
      group = {
        recipient: formatTeacherName(comment.targetTeacher, { includeSubject: false }),
        sortKey: comment.targetTeacher.lastName,
        comments: [],
      };
      groups.set(comment.targetTeacherId, group);
    }
    const author = formatStudentName(comment.author, duplicateFirstNames);
    group.comments.push(`${comment.text} (${author})`);
  }

  return csvResponse(buildCommentCsv([...groups.values()]), "kommentare_lehrer.csv");
}
