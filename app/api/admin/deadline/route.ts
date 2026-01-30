import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur für Admins zugänglich." }, { status: 403 });
    }

    const settings = await prisma.appSettings.findFirst();

    return NextResponse.json({
      deadline: settings?.deadline?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Get deadline error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur für Admins zugänglich." }, { status: 403 });
    }

    const body = await request.json();
    const { deadline } = body as { deadline: string | null };

    // Validate deadline if provided
    if (deadline !== null) {
      const date = new Date(deadline);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Ungültiges Datum." },
          { status: 400 }
        );
      }
    }

    // Upsert: create if not exists, update if exists
    const existing = await prisma.appSettings.findFirst();

    if (existing) {
      await prisma.appSettings.update({
        where: { id: existing.id },
        data: { deadline: deadline ? new Date(deadline) : null },
      });
    } else {
      await prisma.appSettings.create({
        data: { deadline: deadline ? new Date(deadline) : null },
      });
    }

    return NextResponse.json({
      deadline: deadline ?? null,
      message: deadline ? "Abgabefrist gespeichert." : "Abgabefrist entfernt.",
    });
  } catch (error) {
    console.error("Update deadline error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
