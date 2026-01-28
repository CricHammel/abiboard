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

    // Get all active questions
    const questions = await prisma.rankingQuestion.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });

    // Get submitted user IDs only
    const submittedUserIds = await prisma.rankingSubmission.findMany({
      where: { status: "SUBMITTED" },
      select: { userId: true },
    });
    const submittedIds = submittedUserIds.map((s) => s.userId);
    const totalVoters = submittedIds.length;

    if (totalVoters === 0) {
      const tsv = buildTsv(
        ["Frage", "Kategorie", "Platz", "Name", "Stimmen", "Prozent"],
        []
      );
      return tsvResponse(tsv, "rankings.tsv");
    }

    // Get all votes from submitted users
    const votes = await prisma.rankingVote.findMany({
      where: {
        voterId: { in: submittedIds },
        question: { active: true },
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        teacher: { select: { salutation: true, firstName: true, lastName: true, subject: true } },
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

      // Aggregate by person + genderTarget
      const aggregated: Record<string, { name: string; count: number; genderTarget: string }> = {};

      for (const vote of questionVotes) {
        const personId = vote.studentId || vote.teacherId || "";
        const key = `${personId}-${vote.genderTarget}`;

        if (!aggregated[key]) {
          let name = "";
          if (vote.student) {
            name = `${vote.student.firstName} ${vote.student.lastName}`;
          } else if (vote.teacher) {
            const sal = vote.teacher.salutation === "HERR" ? "Hr." : "Fr.";
            name = `${sal} ${vote.teacher.lastName}`;
            if (vote.teacher.subject) name += ` (${vote.teacher.subject})`;
          }
          aggregated[key] = { name, count: 0, genderTarget: vote.genderTarget };
        }
        aggregated[key].count++;
      }

      const results = Object.values(aggregated).sort((a, b) => b.count - a.count);

      if (question.genderSpecific) {
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
      } else {
        const allResults = results.filter((r) => r.genderTarget === "ALL").slice(0, 5);
        for (let i = 0; i < allResults.length; i++) {
          const r = allResults[i];
          const pct = Math.round((r.count / totalVoters) * 1000) / 10;
          rows.push([question.text, "Alle", String(i + 1), r.name, String(r.count), `${pct}%`]);
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
