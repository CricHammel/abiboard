import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildTsv, tsvResponse } from "@/lib/tsv-export";
import { NextResponse } from "next/server";
import { isDeadlinePassed } from "@/lib/deadline";
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

    // Get all active questions
    const questions = await prisma.rankingQuestion.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });

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
      const tsv = buildTsv(
        ["Frage", "Kategorie", "Platz", "Name", "Stimmen", "Prozent"],
        []
      );
      return tsvResponse(tsv, "rankings.tsv");
    }

    // Get all votes from relevant users
    const votes = await prisma.rankingVote.findMany({
      where: {
        voterId: { in: voterIds },
        question: { active: true },
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

    const headers = ["Frage", "Kategorie", "Platz", "Name", "Stimmen", "Prozent"];
    const rows: string[][] = [];

    for (const question of questions) {
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
        // Male results
        const maleResults = results.filter((r) => r.genderTarget === "MALE").slice(0, 5);
        for (let i = 0; i < maleResults.length; i++) {
          const r = maleResults[i];
          const pct = Math.round((r.count / totalVoters) * 1000) / 10;
          rows.push([question.text, "Männlich", String(i + 1), r.name, String(r.count), `${pct}%`]);
        }
        // Female results
        const femaleResults = results.filter((r) => r.genderTarget === "FEMALE").slice(0, 5);
        for (let i = 0; i < femaleResults.length; i++) {
          const r = femaleResults[i];
          const pct = Math.round((r.count / totalVoters) * 1000) / 10;
          rows.push([question.text, "Weiblich", String(i + 1), r.name, String(r.count), `${pct}%`]);
        }
      } else if (question.answerMode === "DUO") {
        // Duo results
        const duoResults = results.filter((r) => r.genderTarget === "ALL").slice(0, 5);
        for (let i = 0; i < duoResults.length; i++) {
          const r = duoResults[i];
          const pct = Math.round((r.count / totalVoters) * 1000) / 10;
          rows.push([question.text, "Duo", String(i + 1), r.name, String(r.count), `${pct}%`]);
        }
      } else {
        // Single results
        const allResults = results.filter((r) => r.genderTarget === "ALL").slice(0, 5);
        for (let i = 0; i < allResults.length; i++) {
          const r = allResults[i];
          const pct = Math.round((r.count / totalVoters) * 1000) / 10;
          rows.push([question.text, "Einzeln", String(i + 1), r.name, String(r.count), `${pct}%`]);
        }
      }
    }

    const tsv = buildTsv(headers, rows);
    return tsvResponse(tsv, "rankings.tsv");
  } catch (error) {
    console.error("Export rankings error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
