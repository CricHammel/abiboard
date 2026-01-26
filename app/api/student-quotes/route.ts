import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Nicht authentifiziert." },
      { status: 401 }
    );
  }

  if (session.user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Zugriff verweigert." },
      { status: 403 }
    );
  }

  try {
    // Get the current user's student record to exclude self
    const currentStudent = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const students = await prisma.student.findMany({
      where: {
        active: true,
        NOT: [
          { userId: null }, // Only students who have registered
          ...(currentStudent ? [{ id: currentStudent.id }] : []), // Exclude self
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: { quotesAbout: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({ students }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
