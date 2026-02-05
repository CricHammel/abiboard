import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createPhotoCategorySchema } from "@/lib/validation";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

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

    const categories = await prisma.photoCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { photos: true },
        },
      },
    });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Photo categories fetch error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const alias = getAdminAlias(request);

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
    const validation = createPhotoCategorySchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      await logAdminAction({
        alias,
        action: "CREATE",
        entity: "PhotoCategory",
        success: false,
        error: firstError?.message || "Ungültige Eingabedaten",
      });
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { name, description, maxPerUser } = validation.data;

    // Auto-assign order (last + 1)
    const lastCategory = await prisma.photoCategory.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (lastCategory?.order ?? 0) + 1;

    const category = await prisma.photoCategory.create({
      data: {
        name,
        description: description ?? null,
        maxPerUser,
        order: nextOrder,
      },
      include: {
        _count: {
          select: { photos: true },
        },
      },
    });

    await logAdminAction({
      alias,
      action: "CREATE",
      entity: "PhotoCategory",
      entityId: category.id,
      entityName: `Rubrik "${name}"`,
      newValues: { name, description, maxPerUser },
    });

    return NextResponse.json(
      { message: "Rubrik erfolgreich erstellt.", category },
      { status: 201 }
    );
  } catch (error) {
    console.error("Photo category creation error:", error);
    await logAdminAction({
      alias,
      action: "CREATE",
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
