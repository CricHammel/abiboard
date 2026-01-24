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
    const teachers = await prisma.teacher.findMany({
      where: { active: true },
      select: {
        id: true,
        salutation: true,
        firstName: true,
        lastName: true,
        subject: true,
        _count: {
          select: { teacherQuotes: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({ teachers }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
