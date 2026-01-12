import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { email, firstName, lastName } = validation.data;

    // If email is being changed, check uniqueness
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Diese E-Mail-Adresse wird bereits verwendet." },
          { status: 400 }
        );
      }
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(email && { email }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        message: "Profil erfolgreich aktualisiert.",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
