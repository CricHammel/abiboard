import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Zugriff verweigert. Admin-Rechte erforderlich." },
        { status: 403 }
      );
    }

    const { questionId } = await params;

    const question = await prisma.rankingQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Frage nicht gefunden." },
        { status: 404 }
      );
    }

    // Only count votes from users who have submitted
    const submittedUserIds = await prisma.rankingSubmission.findMany({
      where: { status: "SUBMITTED" },
      select: { userId: true },
    });
    const submittedIds = submittedUserIds.map((s) => s.userId);

    const votes = await prisma.rankingVote.findMany({
      where: {
        questionId,
        voterId: { in: submittedIds },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, gender: true } },
        teacher: { select: { id: true, salutation: true, firstName: true, lastName: true, subject: true } },
      },
    });

    // Aggregate votes by person and genderTarget
    const aggregated: Record<string, {
      personId: string;
      personType: "student" | "teacher";
      name: string;
      genderTarget: string;
      count: number;
      student?: { id: string; firstName: string; lastName: string; gender: string | null };
      teacher?: { id: string; salutation: string; firstName: string | null; lastName: string; subject: string | null };
    }> = {};

    for (const vote of votes) {
      const personId = vote.studentId || vote.teacherId || "";
      const key = `${personId}-${vote.genderTarget}`;

      if (!aggregated[key]) {
        let name = "";
        let personType: "student" | "teacher" = "student";

        if (vote.student) {
          name = `${vote.student.firstName} ${vote.student.lastName}`;
          personType = "student";
        } else if (vote.teacher) {
          const salutation = vote.teacher.salutation === "HERR" ? "Hr." : "Fr.";
          name = `${salutation} ${vote.teacher.lastName}`;
          if (vote.teacher.subject) name += ` (${vote.teacher.subject})`;
          personType = "teacher";
        }

        aggregated[key] = {
          personId,
          personType,
          name,
          genderTarget: vote.genderTarget,
          count: 0,
          ...(vote.student && { student: vote.student }),
          ...(vote.teacher && { teacher: vote.teacher }),
        };
      }

      aggregated[key].count++;
    }

    // Sort by count descending
    const results = Object.values(aggregated).sort((a, b) => b.count - a.count);

    // Split by genderTarget if gender-specific
    if (question.genderSpecific) {
      const maleResults = results.filter((r) => r.genderTarget === "MALE");
      const femaleResults = results.filter((r) => r.genderTarget === "FEMALE");
      return NextResponse.json({
        question,
        genderSpecific: true,
        results: { male: maleResults, female: femaleResults },
        totalVoters: submittedIds.length,
      });
    }

    return NextResponse.json({
      question,
      genderSpecific: false,
      results: results.filter((r) => r.genderTarget === "ALL"),
      totalVoters: submittedIds.length,
    });
  } catch (error) {
    console.error("Question stats error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
