import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
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

    // Only count users with a linked Student entry (registered via whitelist)
    const studentFilter = { role: "STUDENT" as const, active: true, student: { isNot: null } };

    const [totalStudents, submissions, questions] = await Promise.all([
      prisma.user.count({
        where: studentFilter,
      }),
      prisma.rankingSubmission.findMany({
        where: { status: "SUBMITTED" },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.rankingQuestion.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
      }),
    ]);

    // Find students who haven't submitted
    const submittedUserIds = submissions.map((s) => s.userId);
    const notSubmitted = await prisma.user.findMany({
      where: {
        ...studentFilter,
        id: { notIn: submittedUserIds },
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({
      totalStudents,
      submittedCount: submissions.length,
      notSubmitted,
      questions,
    });
  } catch (error) {
    console.error("Rankings stats error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
