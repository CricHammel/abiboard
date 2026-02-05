import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validation";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const alias = getAdminAlias(request);
  const { userId } = await params;

  try {

    // Check authentication and admin role
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
    const body = await request.json();

    // Validate request body
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      await logAdminAction({
        alias,
        action: "UPDATE",
        entity: "User",
        entityId: userId,
        success: false,
        error: "Ungültige Eingabedaten",
      });
      return NextResponse.json(
        { error: "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, role, active } = validation.data;

    // Get current user for logging old values
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true, role: true, active: true },
    });

    // If email is being changed, check uniqueness
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        await logAdminAction({
          alias,
          action: "UPDATE",
          entity: "User",
          entityId: userId,
          success: false,
          error: "E-Mail bereits verwendet",
        });
        return NextResponse.json(
          { error: "Diese E-Mail-Adresse wird bereits verwendet." },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(email && { email }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && { role }),
        ...(active !== undefined && { active }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "User",
      entityId: userId,
      entityName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      oldValues: currentUser || undefined,
      newValues: { email, firstName, lastName, role, active },
    });

    return NextResponse.json(
      {
        message: "Benutzer erfolgreich aktualisiert.",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("User update error:", error);
    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "User",
      entityId: userId,
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
