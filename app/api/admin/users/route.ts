import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createUserSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
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
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, role } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse wird bereits verwendet." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with profile if STUDENT
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        active: true,
        ...(role === "STUDENT" && {
          profile: {
            create: {
              status: "DRAFT",
            },
          },
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Benutzer erfolgreich erstellt.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
