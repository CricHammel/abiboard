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

    const questions = await prisma.surveyQuestion.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      include: {
        options: {
          orderBy: { order: "asc" },
          select: { id: true, text: true },
        },
      },
    });

    // Count answers per option
    const answerCounts = await prisma.surveyAnswer.groupBy({
      by: ["questionId", "optionId"],
      _count: { id: true },
    });

    const countMap: Record<string, Record<string, number>> = {};
    for (const item of answerCounts) {
      if (!countMap[item.questionId]) countMap[item.questionId] = {};
      countMap[item.questionId][item.optionId] = item._count.id;
    }

    // Total answers per question
    const totalPerQuestion = await prisma.surveyAnswer.groupBy({
      by: ["questionId"],
      _count: { id: true },
    });
    const totalMap: Record<string, number> = {};
    for (const item of totalPerQuestion) {
      totalMap[item.questionId] = item._count.id;
    }

    const headers = ["Frage", "Antwort", "Stimmen", "Prozent"];
    const rows: string[][] = [];

    for (const question of questions) {
      const total = totalMap[question.id] || 0;
      const optionCounts = countMap[question.id] || {};

      // Sort options by vote count descending
      const sortedOptions = [...question.options].sort((a, b) => {
        return (optionCounts[b.id] || 0) - (optionCounts[a.id] || 0);
      });

      for (const option of sortedOptions) {
        const count = optionCounts[option.id] || 0;
        const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
        rows.push([question.text, option.text, String(count), `${pct}%`]);
      }
    }

    const tsv = buildTsv(headers, rows);
    return tsvResponse(tsv, "umfragen.tsv");
  } catch (error) {
    console.error("Export surveys error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
