import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updatePhotoCategorySchema } from "@/lib/validation";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const alias = getAdminAlias(request);
  const { id } = await params;

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

    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "PhotoCategory",
      entityId: id,
      entityName: `Rubrik "${updated.name}"`,
      oldValues: {
        name: existing.name,
        description: existing.description,
        maxPerUser: existing.maxPerUser,
        active: existing.active,
      },
      newValues: { name, description, maxPerUser, active },
    });

    return NextResponse.json(
      { message: "Rubrik erfolgreich aktualisiert.", category: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Photo category update error:", error);
    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "PhotoCategory",
      entityId: id,
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
