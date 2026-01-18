import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Ung\u00fcltige Eingabedaten." },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // Look up student in whitelist
    const student = await prisma.student.findUnique({
      where: { email: normalizedEmail },
    });

    if (!student) {
      return NextResponse.json(
        {
          error:
            "Diese E-Mail-Adresse ist nicht in der Sch\u00fclerliste hinterlegt. Bitte wende dich an das Abi-Komitee.",
        },
        { status: 400 }
      );
    }

    if (!student.active) {
      return NextResponse.json(
        {
          error:
            "Dein Account wurde deaktiviert. Bitte wende dich an das Abi-Komitee.",
        },
        { status: 400 }
      );
    }

    if (student.userId) {
      return NextResponse.json(
        { error: "Mit dieser E-Mail-Adresse wurde bereits ein Account erstellt." },
        { status: 400 }
      );
    }

    // Check if user with this email already exists (shouldn't happen if whitelist is correct)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse wird bereits verwendet." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with profile and link to student
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: student.firstName,
        lastName: student.lastName,
        role: "STUDENT",
        profile: {
          create: {
            status: "DRAFT",
          },
        },
      },
    });

    // Link student to user
    await prisma.student.update({
      where: { id: student.id },
      data: { userId: user.id },
    });

    return NextResponse.json(
      {
        message: "Registrierung erfolgreich.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
