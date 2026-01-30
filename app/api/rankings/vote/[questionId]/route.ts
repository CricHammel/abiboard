import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isDeadlinePassed } from "@/lib/deadline";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
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

    if (await isDeadlinePassed()) {
      return NextResponse.json(
        { error: "Die Abgabefrist ist abgelaufen." },
        { status: 403 }
      );
    }

    // Get genderTarget from query params
    const url = new URL(request.url);
    const genderTarget = url.searchParams.get("genderTarget") || "ALL";

    if (!["MALE", "FEMALE", "ALL"].includes(genderTarget)) {
      return NextResponse.json(
        { error: "Ungültiger genderTarget-Parameter." },
        { status: 400 }
      );
    }

    // Delete the vote
    await prisma.rankingVote.deleteMany({
      where: {
        voterId: session.user.id,
        questionId,
        genderTarget: genderTarget as "MALE" | "FEMALE" | "ALL",
      },
    });

    // Auto-retract: if submitted, reset to DRAFT on vote delete
    const submission = await prisma.rankingSubmission.findFirst({
      where: { userId: session.user.id },
    });

    if (submission?.status === "SUBMITTED") {
      await prisma.rankingSubmission.update({
        where: { userId: session.user.id },
        data: { status: "DRAFT", submittedAt: null },
      });
    }

    return NextResponse.json({ message: "Stimme gelöscht.", status: "DRAFT" });
  } catch (error) {
    console.error("Vote delete error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
