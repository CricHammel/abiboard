import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const reorderSchema = z.object({
  categoryOrders: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Zugriff verweigert. Admin-Rechte erforderlich." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = reorderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { categoryOrders } = validation.data;

    await prisma.$transaction(
      categoryOrders.map(({ id, order }) =>
        prisma.photoCategory.update({
          where: { id },
          data: { order },
        })
      )
    );

    const categories = await prisma.photoCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { photos: true },
        },
      },
    });

    return NextResponse.json({
      message: "Reihenfolge erfolgreich aktualisiert.",
      categories,
    });
  } catch (error) {
    console.error("Error reordering photo categories:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
