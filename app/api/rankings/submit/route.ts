import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isDeadlinePassed } from "@/lib/deadline";
import { logStudentActivity } from "@/lib/student-activity";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    if (await isDeadlinePassed()) {
      return NextResponse.json(
        { error: "Die Abgabefrist ist abgelaufen." },
        { status: 403 }
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

    await logStudentActivity({
      userId: session.user.id,
      action: "SUBMIT",
      entity: "Rankings",
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
