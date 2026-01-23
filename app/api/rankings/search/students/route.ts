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

    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const gender = url.searchParams.get("gender");

    // Split query into words and search each separately (union results)
    const words = query.split(/\s+/).filter((w) => w.length > 0);

    const students = await prisma.student.findMany({
      where: {
        active: true,
        ...(gender && { gender: gender as "MALE" | "FEMALE" }),
        ...(words.length > 0 && {
          OR: words.flatMap((word) => [
            { firstName: { contains: word, mode: "insensitive" as const } },
            { lastName: { contains: word, mode: "insensitive" as const } },
          ]),
        }),
      },
      select: { id: true, firstName: true, lastName: true, gender: true },
      take: 10,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Student search error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
