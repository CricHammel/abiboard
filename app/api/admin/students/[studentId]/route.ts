import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateStudentSchema } from "@/lib/validation";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

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

    const student = await prisma.student.findUnique({
      where: { id: studentId },
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

    if (!student) {
      return NextResponse.json(
        { error: "Schüler nicht gefunden." },
        { status: 404 }
      );
    }

    return NextResponse.json({ student }, { status: 200 });
  } catch (error) {
    console.error("Student fetch error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const alias = getAdminAlias(request);
  const { studentId } = await params;

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

    const validation = updateStudentSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      await logAdminAction({
        alias,
        action: "UPDATE",
        entity: "Student",
        entityId: studentId,
        success: false,
        error: firstError?.message || "Ungültige Eingabedaten",
      });
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, gender, active } = validation.data;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Schüler nicht gefunden." },
        { status: 404 }
      );
    }

    // If email is being changed, check uniqueness
    if (email) {
      const normalizedEmail = email.toLowerCase();
      const studentWithEmail = await prisma.student.findUnique({
        where: { email: normalizedEmail },
      });

      if (studentWithEmail && studentWithEmail.id !== studentId) {
        await logAdminAction({
          alias,
          action: "UPDATE",
          entity: "Student",
          entityId: studentId,
          entityName: `${existingStudent.firstName} ${existingStudent.lastName}`,
          success: false,
          error: "E-Mail bereits verwendet",
        });
        return NextResponse.json(
          { error: "Diese E-Mail-Adresse wird bereits verwendet." },
          { status: 400 }
        );
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email: email.toLowerCase() }),
        ...(gender !== undefined && { gender: gender ?? null }),
        ...(active !== undefined && { active }),
      },
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

    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "Student",
      entityId: studentId,
      entityName: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
      oldValues: {
        firstName: existingStudent.firstName,
        lastName: existingStudent.lastName,
        email: existingStudent.email,
        gender: existingStudent.gender,
        active: existingStudent.active,
      },
      newValues: { firstName, lastName, email, gender, active },
    });

    return NextResponse.json(
      {
        message: "Schüler erfolgreich aktualisiert.",
        student: updatedStudent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Student update error:", error);
    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "Student",
      entityId: studentId,
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
