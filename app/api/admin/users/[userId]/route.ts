import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;
    const body = await request.json();

    // Validate request body
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, role, active } = validation.data;

    // If email is being changed, check uniqueness
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
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

    return NextResponse.json(
      {
        message: "Benutzer erfolgreich aktualisiert.",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
