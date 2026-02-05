import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createTeacherSchema } from "@/lib/validation";
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

    const teachers = await prisma.teacher.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({ teachers }, { status: 200 });
  } catch (error) {
    console.error("Teachers fetch error:", error);
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
    const validation = createTeacherSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      await logAdminAction({
        alias,
        action: "CREATE",
        entity: "Teacher",
        success: false,
        error: firstError?.message || "Ungültige Eingabedaten",
      });
      return NextResponse.json(
        { error: firstError?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { salutation, lastName, firstName, subject } = validation.data;

    const teacher = await prisma.teacher.create({
      data: {
        salutation,
        lastName,
        firstName: firstName ?? undefined,
        subject: subject ?? undefined,
      },
    });

    const teacherName = firstName
      ? `${salutation} ${firstName} ${lastName}`
      : `${salutation} ${lastName}`;

    await logAdminAction({
      alias,
      action: "CREATE",
      entity: "Teacher",
      entityId: teacher.id,
      entityName: teacherName,
      newValues: { salutation, lastName, firstName, subject },
    });

    return NextResponse.json(
      { message: "Lehrer erfolgreich hinzugefügt.", teacher },
      { status: 201 }
    );
  } catch (error) {
    console.error("Teacher creation error:", error);
    await logAdminAction({
      alias,
      action: "CREATE",
      entity: "Teacher",
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
