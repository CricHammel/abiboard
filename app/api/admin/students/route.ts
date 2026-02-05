import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createStudentSchema } from "@/lib/validation";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

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
        { error: "Zugriff verweigert. Admin-Rechte erforderlich." },
        { status: 403 }
      );
    }

    const students = await prisma.student.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            active: true,
          },
        },
      },
    });

    return NextResponse.json({ students }, { status: 200 });
  } catch (error) {
    console.error("Students fetch error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const alias = getAdminAlias(request);

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
        { error: "Zugriff verweigert. Admin-Rechte erforderlich." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const validation = createStudentSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      await logAdminAction({
        alias,
        action: "CREATE",
        entity: "Student",
        success: false,
        error: firstError?.message || "Ungültige Eingabedaten",
      });
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, gender } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // Check if student with this email already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingStudent) {
      await logAdminAction({
        alias,
        action: "CREATE",
        entity: "Student",
        success: false,
        error: "E-Mail bereits vorhanden",
      });
      return NextResponse.json(
        { error: "Ein Schüler mit dieser E-Mail-Adresse existiert bereits." },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        gender: gender ?? undefined,
        active: true,
      },
    });

    await logAdminAction({
      alias,
      action: "CREATE",
      entity: "Student",
      entityId: student.id,
      entityName: `${firstName} ${lastName}`,
      newValues: { firstName, lastName, email: normalizedEmail, gender },
    });

    return NextResponse.json(
      {
        message: "Schüler erfolgreich hinzugefügt.",
        student,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Student creation error:", error);
    await logAdminAction({
      alias,
      action: "CREATE",
      entity: "Student",
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
