import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teacherId: string }> }
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

  const { teacherId } = await params;

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId, active: true },
      select: {
        id: true,
        salutation: true,
        firstName: true,
        lastName: true,
        subject: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Lehrer nicht gefunden." },
        { status: 404 }
      );
    }

    const quotes = await prisma.teacherQuote.findMany({
      where: { teacherId },
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

    return NextResponse.json({ teacher, quotes }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
