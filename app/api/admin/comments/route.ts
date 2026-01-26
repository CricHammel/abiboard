import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/admin/comments - List all comments with author info
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
        { error: "Nur für Admins zugänglich." },
        { status: 403 }
      );
    }

    const comments = await prisma.comment.findMany({
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        targetStudent: {
          select: { id: true, firstName: true, lastName: true },
        },
        targetTeacher: {
          select: { id: true, salutation: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to unified format with author info
    const transformedComments = comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: {
        id: comment.author.id,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
      },
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
    console.error("Admin comments GET error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
