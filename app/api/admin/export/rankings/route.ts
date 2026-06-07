import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildCsv, csvResponse } from "@/lib/csv-export";
import { NextResponse } from "next/server";
import { isDeadlinePassed } from "@/lib/deadline";
import { formatTeacherName } from "@/lib/format";
import type { RankingQuestionType } from "@prisma/client";

const HEADERS = [
  "Frage",
  "Name 1. Platz",
  "Prozent 1. Platz",
  "Name 2. Platz",
  "Prozent 2. Platz",
  "Name 3. Platz",
  "Prozent 3. Platz",
];

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur für Admins zugänglich." }, { status: 403 });
    }

    const typeParam = new URL(request.url).searchParams.get("type");
    const questionType: RankingQuestionType =
      typeParam === "lehrer" ? "TEACHER" : "STUDENT";
    const filename =
      questionType === "TEACHER" ? "rankings_lehrer.csv" : "rankings_schueler.csv";

    // Get all active questions of the requested type. DUO questions are moved
    // to the end while the existing order is otherwise preserved.
    const questions = await prisma.rankingQuestion.findMany({
      where: { active: true, type: questionType },
      orderBy: { order: "asc" },
    });
    const orderedQuestions = [
      ...questions.filter((q) => q.answerMode !== "DUO"),
      ...questions.filter((q) => q.answerMode === "DUO"),
    ];

    // After deadline: include all votes, not just submitted
    const deadlinePassed = await isDeadlinePassed();

    let voterIds: string[];
    if (deadlinePassed) {
      // Include all users who have votes
      const allVoters = await prisma.rankingVote.findMany({
        where: { question: { active: true } },
        select: { voterId: true },
        distinct: ["voterId"],
      });
      voterIds = allVoters.map((v) => v.voterId);
    } else {
      const submittedUserIds = await prisma.rankingSubmission.findMany({
        where: { status: "SUBMITTED" },
        select: { userId: true },
      });
      voterIds = submittedUserIds.map((s) => s.userId);
    }
    const totalVoters = voterIds.length;

    if (totalVoters === 0) {
      return csvResponse(buildCsv(HEADERS, []), filename);
    }

    // Get all votes from relevant users for the requested question type
    const votes = await prisma.rankingVote.findMany({
      where: {
        voterId: { in: voterIds },
        question: { active: true, type: questionType },
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        teacher: { select: { salutation: true, firstName: true, lastName: true, subject: true } },
        student2: { select: { firstName: true, lastName: true } },
        teacher2: { select: { salutation: true, firstName: true, lastName: true, subject: true } },
      },
    });

    // Group votes by question
    const votesByQuestion: Record<string, typeof votes> = {};
    for (const vote of votes) {
      if (!votesByQuestion[vote.questionId]) votesByQuestion[vote.questionId] = [];
      votesByQuestion[vote.questionId].push(vote);
    }

    // Build one row with the top 3 places spread across the place columns.
    const buildRow = (
      questionText: string,
      results: { name: string; count: number }[]
    ): string[] => {
      const row = [questionText];
      for (let i = 0; i < 3; i++) {
        const r = results[i];
        if (r) {
          const pct = Math.round((r.count / totalVoters) * 100);
          row.push(r.name, `${pct}%`);
        } else {
          row.push("", "");
        }
      }
      return row;
    };

    const rows: string[][] = [];

    for (const question of orderedQuestions) {
      const questionVotes = votesByQuestion[question.id] || [];

      // Aggregate by person/pair + genderTarget
      const aggregated: Record<string, { name: string; count: number; genderTarget: string }> = {};

      for (const vote of questionVotes) {
        // Check if this is a Duo vote
        const isDuo = !!(vote.studentId2 || vote.teacherId2);
        let key: string;
        let name = "";

        if (isDuo) {
          // Duo mode: create key from both IDs
          if (vote.student && vote.student2) {
            key = `${vote.studentId}-${vote.studentId2}-${vote.genderTarget}`;
            name = `${vote.student.firstName} ${vote.student.lastName} & ${vote.student2.firstName} ${vote.student2.lastName}`;
          } else if (vote.teacher && vote.teacher2) {
            key = `${vote.teacherId}-${vote.teacherId2}-${vote.genderTarget}`;
            name = `${formatTeacherName(vote.teacher)} & ${formatTeacherName(vote.teacher2)}`;
          } else {
            continue;
          }
        } else {
          // Single/Gender-Specific mode
          const personId = vote.studentId || vote.teacherId || "";
          key = `${personId}-${vote.genderTarget}`;

          if (vote.student) {
            name = `${vote.student.firstName} ${vote.student.lastName}`;
          } else if (vote.teacher) {
            name = formatTeacherName(vote.teacher);
          }
        }

        if (!aggregated[key]) {
          aggregated[key] = { name, count: 0, genderTarget: vote.genderTarget };
        }
        aggregated[key].count++;
      }

      const results = Object.values(aggregated).sort((a, b) => b.count - a.count);

      if (question.answerMode === "GENDER_SPECIFIC") {
        // Two rows without label (male first, then female) — annotated manually.
        const maleResults = results.filter((r) => r.genderTarget === "MALE");
        const femaleResults = results.filter((r) => r.genderTarget === "FEMALE");
        rows.push(buildRow(question.text, maleResults));
        rows.push(buildRow(question.text, femaleResults));
      } else {
        // SINGLE and DUO both produce a single ALL ranking row.
        const allResults = results.filter((r) => r.genderTarget === "ALL");
        rows.push(buildRow(question.text, allResults));
      }
    }

    return csvResponse(buildCsv(HEADERS, rows), filename);
  } catch (error) {
    console.error("Export rankings error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
