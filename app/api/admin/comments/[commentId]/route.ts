import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateCommentSchema } from "@/lib/validation";

// PATCH /api/admin/comments/[commentId] - Edit any comment
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nur für Admins zugänglich." },
        { status: 403 }
      );
    }

    const { commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Kommentar nicht gefunden." },
        { status: 404 }
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
    console.error("Admin comment PATCH error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/comments/[commentId] - Delete any comment
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nur für Admins zugänglich." },
        { status: 403 }
      );
    }

    const { commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Kommentar nicht gefunden." },
        { status: 404 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ message: "Kommentar gelöscht." });
  } catch (error) {
    console.error("Admin comment DELETE error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
