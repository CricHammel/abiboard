import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const alias = getAdminAlias(request);

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

    const category = await prisma.photoCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Rubrik nicht gefunden." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Bild-URL ist erforderlich." },
        { status: 400 }
      );
    }

    // Verify the photo exists in this category
    const photo = await prisma.photo.findFirst({
      where: {
        categoryId: id,
        imageUrl,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Foto nicht in dieser Rubrik gefunden." },
        { status: 404 }
      );
    }

    await prisma.photoCategory.update({
      where: { id },
      data: { coverImageUrl: imageUrl },
    });

    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "PhotoCategory",
      entityId: id,
      entityName: `Cover für "${category.name}"`,
    });

    return NextResponse.json(
      { message: "Cover-Bild erfolgreich gesetzt.", coverImageUrl: imageUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cover update error:", error);
    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "PhotoCategory",
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

