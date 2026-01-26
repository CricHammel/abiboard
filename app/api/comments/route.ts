import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createCommentSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";

// GET /api/comments - List own written comments
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
        { error: "Nur für Schüler zugänglich." },
        { status: 403 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { authorId: session.user.id },
      include: {
        targetStudent: {
          select: { id: true, firstName: true, lastName: true },
        },
        targetTeacher: {
          select: { id: true, salutation: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to unified format
    const transformedComments = comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      targetType: comment.targetStudentId ? "STUDENT" : "TEACHER",
      targetId: comment.targetStudentId || comment.targetTeacherId,
      target: comment.targetStudent
        ? {
            id: comment.targetStudent.id,
            name: `${comment.targetStudent.firstName} ${comment.targetStudent.lastName}`,
          }
        : comment.targetTeacher
          ? {
              id: comment.targetTeacher.id,
              name: `${comment.targetTeacher.salutation === "HERR" ? "Hr." : "Fr."} ${comment.targetTeacher.lastName}`,
            }
          : null,
    }));

    return NextResponse.json({ comments: transformedComments });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: Request) {
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
        { error: "Nur für Schüler zugänglich." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { text, targetType, targetId } = result.data;

    // Validate target exists and is active
    if (targetType === "STUDENT") {
      const targetStudent = await prisma.student.findUnique({
        where: { id: targetId },
        select: { id: true, active: true, userId: true },
      });

      if (!targetStudent || !targetStudent.active) {
        return NextResponse.json(
          { error: "Schüler nicht gefunden." },
          { status: 404 }
        );
      }

      // Prevent self-comment
      if (targetStudent.userId === session.user.id) {
        return NextResponse.json(
          { error: "Du kannst keinen Kommentar über dich selbst schreiben." },
          { status: 400 }
        );
      }
    } else {
      const targetTeacher = await prisma.teacher.findUnique({
        where: { id: targetId },
        select: { id: true, active: true },
      });

      if (!targetTeacher || !targetTeacher.active) {
        return NextResponse.json(
          { error: "Lehrer nicht gefunden." },
          { status: 404 }
        );
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        text,
        authorId: session.user.id,
        targetStudentId: targetType === "STUDENT" ? targetId : null,
        targetTeacherId: targetType === "TEACHER" ? targetId : null,
      },
    });

    return NextResponse.json({
      message: "Kommentar gespeichert.",
      comment: {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Comments POST error:", error);

    // Handle unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Du hast bereits einen Kommentar über diese Person geschrieben." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
