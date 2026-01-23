import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Nur für Schüler verfügbar." },
        { status: 403 }
      );
    }

    const existing = await prisma.rankingSubmission.findFirst({
      where: { userId: session.user.id },
    });

    if (!existing || existing.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Rankings sind nicht abgeschickt." },
        { status: 400 }
      );
    }

    const submission = await prisma.rankingSubmission.update({
      where: { userId: session.user.id },
      data: {
        status: "DRAFT",
        submittedAt: null,
      },
    });

    return NextResponse.json({
      message: "Rankings zurückgezogen.",
      submission,
    });
  } catch (error) {
    console.error("Rankings retract error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
