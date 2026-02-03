import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updatePhotoCategorySchema } from "@/lib/validation";

export async function PATCH(
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

    const body = await request.json();
    const validation = updatePhotoCategorySchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const existing = await prisma.photoCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Rubrik nicht gefunden." },
        { status: 404 }
      );
    }

    const { name, description, maxPerUser, active } = validation.data;

    const updated = await prisma.photoCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(maxPerUser !== undefined && { maxPerUser }),
        ...(active !== undefined && { active }),
      },
      include: {
        _count: {
          select: { photos: true },
        },
      },
    });

    return NextResponse.json(
      { message: "Rubrik erfolgreich aktualisiert.", category: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Photo category update error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
