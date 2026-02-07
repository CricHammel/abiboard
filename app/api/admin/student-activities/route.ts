import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const userId = searchParams.get("userId");
    const entity = searchParams.get("entity");

    // Build entity filter — "Zitate" combines TeacherQuote and StudentQuote
    const entityFilter = entity
      ? entity === "Zitate"
        ? { entity: { in: ["TeacherQuote", "StudentQuote"] } }
        : { entity }
      : {};

    const where = {
      ...entityFilter,
      ...(userId && { userId }),
    };

    const [activities, total] = await Promise.all([
      prisma.studentActivity.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: Math.min(limit, 100),
        skip: offset,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.studentActivity.count({ where }),
    ]);

    return NextResponse.json({ activities, total });
  } catch (error) {
    console.error("Error fetching student activities:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
