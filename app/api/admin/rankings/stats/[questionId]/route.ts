import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatTeacherName } from "@/lib/format";

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
        student2: { select: { id: true, firstName: true, lastName: true, gender: true } },
        teacher2: { select: { id: true, salutation: true, firstName: true, lastName: true, subject: true } },
      },
    });

    // Aggregate votes by person/pair and genderTarget
    const aggregated: Record<string, {
      personId: string;
      personId2?: string;
      personType: "student" | "teacher";
      name: string;
      genderTarget: string;
      count: number;
      isDuo?: boolean;
      student?: { id: string; firstName: string; lastName: string; gender: string | null };
      teacher?: { id: string; salutation: string; firstName: string | null; lastName: string; subject: string | null };
      student2?: { id: string; firstName: string; lastName: string; gender: string | null };
      teacher2?: { id: string; salutation: string; firstName: string | null; lastName: string; subject: string | null };
    }> = {};

    for (const vote of votes) {
      // Check if this is a Duo vote
      const isDuo = !!(vote.studentId2 || vote.teacherId2);

      let key: string;
      let personId: string;
      let personId2: string | undefined;
      let name: string;
      let personType: "student" | "teacher" = "student";

      if (isDuo) {
        // Duo mode: create key from both IDs (already sorted in API)
        if (vote.student && vote.student2) {
          personId = vote.studentId!;
          personId2 = vote.studentId2!;
          key = `${personId}-${personId2}-${vote.genderTarget}`;
          name = `${vote.student.firstName} ${vote.student.lastName} & ${vote.student2.firstName} ${vote.student2.lastName}`;
          personType = "student";
        } else if (vote.teacher && vote.teacher2) {
          personId = vote.teacherId!;
          personId2 = vote.teacherId2!;
          key = `${personId}-${personId2}-${vote.genderTarget}`;
          name = `${formatTeacherName(vote.teacher)} & ${formatTeacherName(vote.teacher2)}`;
          personType = "teacher";
        } else {
          continue; // Skip invalid votes
        }
      } else {
        // Single/Gender-Specific mode
        personId = vote.studentId || vote.teacherId || "";
        key = `${personId}-${vote.genderTarget}`;

        if (vote.student) {
          name = `${vote.student.firstName} ${vote.student.lastName}`;
          personType = "student";
        } else if (vote.teacher) {
          name = formatTeacherName(vote.teacher);
          personType = "teacher";
        } else {
          continue; // Skip invalid votes
        }
      }

      if (!aggregated[key]) {
        aggregated[key] = {
          personId,
          ...(personId2 && { personId2 }),
          personType,
          name,
          genderTarget: vote.genderTarget,
          count: 0,
          isDuo,
          ...(vote.student && { student: vote.student }),
          ...(vote.teacher && { teacher: vote.teacher }),
          ...(vote.student2 && { student2: vote.student2 }),
          ...(vote.teacher2 && { teacher2: vote.teacher2 }),
        };
      }

      aggregated[key].count++;
    }

    // Sort by count descending
    const results = Object.values(aggregated).sort((a, b) => b.count - a.count);

    // Split by genderTarget/answerMode
    if (question.answerMode === "GENDER_SPECIFIC") {
      const maleResults = results.filter((r) => r.genderTarget === "MALE");
      const femaleResults = results.filter((r) => r.genderTarget === "FEMALE");
      return NextResponse.json({
        question,
        answerMode: question.answerMode,
        results: { male: maleResults, female: femaleResults },
        totalVoters: submittedIds.length,
      });
    }

    return NextResponse.json({
      question,
      answerMode: question.answerMode,
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
