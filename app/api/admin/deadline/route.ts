import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

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
  const alias = getAdminAlias(request);

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
        await logAdminAction({
          alias,
          action: "SETTINGS",
          entity: "AppSettings",
          entityName: "Abgabefrist",
          success: false,
          error: "Ungültiges Datum",
        });
        return NextResponse.json(
          { error: "Ungültiges Datum." },
          { status: 400 }
        );
      }
    }

    // Get current deadline for logging
    const existing = await prisma.appSettings.findFirst();
    const oldDeadline = existing?.deadline?.toISOString() ?? null;

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

    await logAdminAction({
      alias,
      action: "SETTINGS",
      entity: "AppSettings",
      entityName: "Abgabefrist",
      oldValues: { deadline: oldDeadline },
      newValues: { deadline: deadline ?? null },
    });

    return NextResponse.json({
      deadline: deadline ?? null,
      message: deadline ? "Abgabefrist gespeichert." : "Abgabefrist entfernt.",
    });
  } catch (error) {
    console.error("Update deadline error:", error);
    await logAdminAction({
      alias,
      action: "SETTINGS",
      entity: "AppSettings",
      entityName: "Abgabefrist",
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
