import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { adminResetPasswordSchema } from "@/lib/validation";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";
import bcrypt from "bcryptjs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const alias = getAdminAlias(request);
  const { userId } = await params;

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

    const validation = adminResetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Ungültige Eingabedaten." },
        { status: 400 }
      );
    }

    const { newPassword } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden." },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "User",
      entityId: userId,
      entityName: `${user.firstName} ${user.lastName}`,
      newValues: { password: "(zurückgesetzt)" },
    });

    return NextResponse.json(
      { message: "Passwort erfolgreich zurückgesetzt." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    await logAdminAction({
      alias,
      action: "UPDATE",
      entity: "User",
      entityId: userId,
      success: false,
      error: "Passwort-Reset fehlgeschlagen",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
