import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
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

  const { studentId } = await params;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId, active: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Schüler nicht gefunden." },
        { status: 404 }
      );
    }

    const quotes = await prisma.studentQuote.findMany({
      where: { studentId },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ student, quotes }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
