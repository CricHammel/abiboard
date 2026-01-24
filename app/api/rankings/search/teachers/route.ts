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

    // Map gender to salutation for filtering
    const salutationFilter = gender === "MALE" ? "HERR" : gender === "FEMALE" ? "FRAU" : undefined;

    // Split query into words - every word must match at least one field (AND logic)
    // Searches against firstName, lastName, and salutation (Herr/Frau)
    const words = query.split(/\s+/).filter((w) => w.length > 0);

    const teachers = await prisma.teacher.findMany({
      where: {
        active: true,
        ...(salutationFilter && { salutation: salutationFilter as "HERR" | "FRAU" }),
        ...(words.length > 0 && {
          AND: words.map((word) => ({
            OR: [
              { lastName: { contains: word, mode: "insensitive" as const } },
              { firstName: { contains: word, mode: "insensitive" as const } },
              ...(word.toLowerCase() === "herr" ? [{ salutation: "HERR" as const }] : []),
              ...(word.toLowerCase() === "frau" ? [{ salutation: "FRAU" as const }] : []),
            ],
          })),
        }),
      },
      select: { id: true, salutation: true, firstName: true, lastName: true, subject: true },
      take: 10,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Teacher search error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
