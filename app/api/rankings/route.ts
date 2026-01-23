import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Nur für Schüler verfügbar." },
        { status: 403 }
      );
    }

    const [questions, votes, submission, students, teachers] = await Promise.all([
      prisma.rankingQuestion.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
      }),
      prisma.rankingVote.findMany({
        where: { voterId: session.user.id },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, gender: true } },
          teacher: { select: { id: true, salutation: true, firstName: true, lastName: true, subject: true } },
        },
      }),
      prisma.rankingSubmission.findFirst({
        where: { userId: session.user.id },
      }),
      prisma.student.findMany({
        where: { active: true },
        select: { id: true, firstName: true, lastName: true, gender: true },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
      prisma.teacher.findMany({
        where: { active: true },
        select: { id: true, salutation: true, firstName: true, lastName: true, subject: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);

    return NextResponse.json({
      questions,
      votes,
      submission: submission || { status: "DRAFT" },
      students,
      teachers,
    });
  } catch (error) {
    console.error("Rankings fetch error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

const voteSchema = z.object({
  questionId: z.string(),
  studentId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  genderTarget: z.enum(["MALE", "FEMALE", "ALL"]),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Nur für Schüler verfügbar." },
        { status: 403 }
      );
    }

    // Check submission status
    const submission = await prisma.rankingSubmission.findFirst({
      where: { userId: session.user.id },
    });

    if (submission?.status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Rankings bereits abgeschickt. Bitte zuerst zurückziehen." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = voteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { questionId, studentId, teacherId, genderTarget } = validation.data;

    // Validate question exists and is active
    const question = await prisma.rankingQuestion.findFirst({
      where: { id: questionId, active: true },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Frage nicht gefunden." },
        { status: 404 }
      );
    }

    // Validate genderTarget matches question
    if (question.genderSpecific && genderTarget === "ALL") {
      return NextResponse.json(
        { error: "Diese Frage erfordert eine geschlechtsspezifische Antwort." },
        { status: 400 }
      );
    }
    if (!question.genderSpecific && genderTarget !== "ALL") {
      return NextResponse.json(
        { error: "Diese Frage ist nicht geschlechtsspezifisch." },
        { status: 400 }
      );
    }

    // Validate person exists and matches type
    if (question.type === "STUDENT") {
      if (!studentId) {
        return NextResponse.json(
          { error: "Bitte wähle einen Schüler aus." },
          { status: 400 }
        );
      }
      const student = await prisma.student.findFirst({
        where: { id: studentId, active: true },
      });
      if (!student) {
        return NextResponse.json(
          { error: "Schüler nicht gefunden." },
          { status: 404 }
        );
      }
      // Validate gender for gender-specific questions
      if (question.genderSpecific && student.gender) {
        const expectedGender = genderTarget === "MALE" ? "MALE" : "FEMALE";
        if (student.gender !== expectedGender) {
          return NextResponse.json(
            { error: "Das Geschlecht des Schülers passt nicht zur Frage." },
            { status: 400 }
          );
        }
      }
    } else {
      if (!teacherId) {
        return NextResponse.json(
          { error: "Bitte wähle einen Lehrer aus." },
          { status: 400 }
        );
      }
      const teacher = await prisma.teacher.findFirst({
        where: { id: teacherId, active: true },
      });
      if (!teacher) {
        return NextResponse.json(
          { error: "Lehrer nicht gefunden." },
          { status: 404 }
        );
      }
      // Validate gender for gender-specific questions
      if (question.genderSpecific) {
        const expectedSalutation = genderTarget === "MALE" ? "HERR" : "FRAU";
        if (teacher.salutation !== expectedSalutation) {
          return NextResponse.json(
            { error: "Das Geschlecht des Lehrers passt nicht zur Frage." },
            { status: 400 }
          );
        }
      }
    }

    // Upsert vote
    const vote = await prisma.rankingVote.upsert({
      where: {
        voterId_questionId_genderTarget: {
          voterId: session.user.id,
          questionId,
          genderTarget,
        },
      },
      create: {
        voterId: session.user.id,
        questionId,
        genderTarget,
        studentId: question.type === "STUDENT" ? studentId : null,
        teacherId: question.type === "TEACHER" ? teacherId : null,
      },
      update: {
        studentId: question.type === "STUDENT" ? studentId : null,
        teacherId: question.type === "TEACHER" ? teacherId : null,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, gender: true } },
        teacher: { select: { id: true, salutation: true, firstName: true, lastName: true, subject: true } },
      },
    });

    // Ensure submission record exists
    await prisma.rankingSubmission.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, status: "DRAFT" },
      update: {},
    });

    return NextResponse.json({ vote });
  } catch (error) {
    console.error("Vote save error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
