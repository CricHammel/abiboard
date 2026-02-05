import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateTeacherSchema } from "@/lib/validation";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const alias = getAdminAlias(request);
  const { id } = await params;

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
    const validation = updateTeacherSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      await logAdminAction({
        alias,
        action: "UPDATE",
        entity: "Teacher",
        entityId: id,
        success: false,
        error: firstError?.message || "Ungültige Eingabedaten",
      });
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { error: "Lehrer nicht gefunden." },
        { status: 404 }
      );
    }

    const { salutation, lastName, firstName, subject, active } = validation.data;

    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: {
        ...(salutation && { salutation }),
        ...(lastName && { lastName }),
        ...(firstName !== undefined && { firstName: firstName ?? null }),
        ...(subject !== undefined && { subject: subject ?? null }),
        ...(active !== undefined && { active }),
      },
    });

    const teacherName = updatedTeacher.firstName
      ? `${updatedTeacher.salutation} ${updatedTeacher.firstName} ${updatedTeacher.lastName}`
      : `${updatedTeacher.salutation} ${updatedTeacher.lastName}`;

    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "Teacher",
      entityId: id,
      entityName: teacherName,
      oldValues: {
        salutation: existingTeacher.salutation,
        lastName: existingTeacher.lastName,
        firstName: existingTeacher.firstName,
        subject: existingTeacher.subject,
        active: existingTeacher.active,
      },
      newValues: { salutation, lastName, firstName, subject, active },
    });

    return NextResponse.json(
      { message: "Lehrer erfolgreich aktualisiert.", teacher: updatedTeacher },
      { status: 200 }
    );
  } catch (error) {
    console.error("Teacher update error:", error);
    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "Teacher",
      entityId: id,
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const alias = getAdminAlias(request);
  const { id } = await params;

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

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { error: "Lehrer nicht gefunden." },
        { status: 404 }
      );
    }

    await prisma.teacher.update({
      where: { id },
      data: { active: false },
    });

    const teacherName = existingTeacher.firstName
      ? `${existingTeacher.salutation} ${existingTeacher.firstName} ${existingTeacher.lastName}`
      : `${existingTeacher.salutation} ${existingTeacher.lastName}`;

    await logAdminAction({
      alias,
      action: "DELETE",
      entity: "Teacher",
      entityId: id,
      entityName: teacherName,
      oldValues: { active: true },
      newValues: { active: false },
    });

    return NextResponse.json(
      { message: "Lehrer erfolgreich deaktiviert." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Teacher delete error:", error);
    await logAdminAction({
      alias,
      action: "DELETE",
      entity: "Teacher",
      entityId: id,
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
