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

    const submission = await prisma.rankingSubmission.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      update: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Rankings erfolgreich abgeschickt.",
      submission,
    });
  } catch (error) {
    console.error("Rankings submit error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
