import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for reordering fields
const reorderSchema = z.object({
  fieldOrders: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
});

// PATCH: Bulk update field order
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

    const { fieldOrders } = validation.data;

    // Update all fields in a transaction
    await prisma.$transaction(
      fieldOrders.map(({ id, order }) =>
        prisma.steckbriefField.update({
          where: { id },
          data: { order },
        })
      )
    );

    // Fetch updated fields
    const fields = await prisma.steckbriefField.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      message: "Reihenfolge erfolgreich aktualisiert.",
      fields,
    });
  } catch (error) {
    console.error("Error reordering steckbrief fields:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
