import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateTeacherSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    return NextResponse.json(
      { message: "Lehrer erfolgreich aktualisiert.", teacher: updatedTeacher },
      { status: 200 }
    );
  } catch (error) {
    console.error("Teacher update error:", error);
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
  try {
    const { id } = await params;
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

    return NextResponse.json(
      { message: "Lehrer erfolgreich deaktiviert." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Teacher delete error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
