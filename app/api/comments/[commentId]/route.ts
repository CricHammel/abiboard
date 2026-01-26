import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateCommentSchema } from "@/lib/validation";

// PATCH /api/comments/[commentId] - Update own comment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
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

    const { commentId } = await params;

    // Check ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Kommentar nicht gefunden." },
        { status: 404 }
      );
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Du kannst nur deine eigenen Kommentare bearbeiten." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = updateCommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { text: result.data.text },
    });

    return NextResponse.json({
      message: "Kommentar aktualisiert.",
      comment: {
        id: updatedComment.id,
        text: updatedComment.text,
        updatedAt: updatedComment.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Comment PATCH error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[commentId] - Delete own comment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
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

    const { commentId } = await params;

    // Check ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Kommentar nicht gefunden." },
        { status: 404 }
      );
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Du kannst nur deine eigenen Kommentare löschen." },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ message: "Kommentar gelöscht." });
  } catch (error) {
    console.error("Comment DELETE error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
