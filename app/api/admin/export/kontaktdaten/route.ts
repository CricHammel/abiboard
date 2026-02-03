import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildTsv, tsvResponse } from "@/lib/tsv-export";
import { NextResponse } from "next/server";

export async function GET() {
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
        { error: "Nur für Admins zugänglich." },
        { status: 403 }
      );
    }

    // Get all users with their contact info
    const users = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        active: true,
        profile: {
          OR: [
            { contactEmail: { not: null } },
            { contactPhone: { not: null } },
            { contactInsta: { not: null } },
          ],
        },
      },
      select: {
        firstName: true,
        lastName: true,
        profile: {
          select: {
            contactEmail: true,
            contactPhone: true,
            contactInsta: true,
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const headers = ["Vorname", "Nachname", "E-Mail", "Handynummer", "Instagram"];
    const rows = users.map((user) => [
      user.firstName,
      user.lastName,
      user.profile?.contactEmail || "",
      user.profile?.contactPhone || "",
      user.profile?.contactInsta || "",
    ]);

    const tsv = buildTsv(headers, rows);
    return tsvResponse(tsv, "kontaktdaten.tsv");
  } catch (error) {
    console.error("Export contact info error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
