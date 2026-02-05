import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

const reorderSchema = z.object({
  questionOrders: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
});

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

    const { questionOrders } = validation.data;

    await prisma.$transaction(
      questionOrders.map(({ id, order }) =>
        prisma.rankingQuestion.update({
          where: { id },
          data: { order },
        })
      )
    );

    const questions = await prisma.rankingQuestion.findMany({
      orderBy: { order: "asc" },
    });

    await logAdminAction({
      alias,
      action: "REORDER",
      entity: "RankingQuestion",
    });

    return NextResponse.json({
      message: "Reihenfolge erfolgreich aktualisiert.",
      questions,
    });
  } catch (error) {
    console.error("Error reordering questions:", error);
    await logAdminAction({
      alias,
      action: "REORDER",
      entity: "RankingQuestion",
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
