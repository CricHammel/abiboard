import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteImageFile } from "@/lib/file-upload";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, coverImageUrl: true },
        },
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Foto nicht gefunden." },
        { status: 404 }
      );
    }

    const wasCover = photo.category.coverImageUrl === photo.imageUrl;

    // Delete the file from disk
    await deleteImageFile(photo.imageUrl);

    // Delete from database
    await prisma.photo.delete({
      where: { id },
    });

    // If deleted photo was cover, set new cover to first remaining photo
    if (wasCover) {
      const firstRemainingPhoto = await prisma.photo.findFirst({
        where: { categoryId: photo.categoryId },
        orderBy: { createdAt: "asc" },
        select: { imageUrl: true },
      });

      await prisma.photoCategory.update({
        where: { id: photo.categoryId },
        data: { coverImageUrl: firstRemainingPhoto?.imageUrl ?? null },
      });
    }

    return NextResponse.json(
      { message: "Foto erfolgreich gelöscht." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Photo deletion error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
