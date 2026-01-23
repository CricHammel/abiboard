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

    // Split query into words and search each separately (union results)
    // This allows "Herr Mayer" to find "Mayer" even though "Herr" isn't a name field
    const words = query.split(/\s+/).filter((w) => w.length > 0);

    const teachers = await prisma.teacher.findMany({
      where: {
        active: true,
        ...(salutationFilter && { salutation: salutationFilter as "HERR" | "FRAU" }),
        ...(words.length > 0 && {
          OR: words.flatMap((word) => [
            { lastName: { contains: word, mode: "insensitive" as const } },
            { firstName: { contains: word, mode: "insensitive" as const } },
          ]),
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
