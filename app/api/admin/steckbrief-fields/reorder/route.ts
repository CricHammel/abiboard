import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

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

    await logAdminAction({
      alias,
      action: "REORDER",
      entity: "SteckbriefField",
    });

    return NextResponse.json({
      message: "Reihenfolge erfolgreich aktualisiert.",
      fields,
    });
  } catch (error) {
    console.error("Error reordering steckbrief fields:", error);
    await logAdminAction({
      alias,
      action: "REORDER",
      entity: "SteckbriefField",
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
