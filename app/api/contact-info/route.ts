import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isDeadlinePassed } from "@/lib/deadline";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        contactEmail: true,
        contactPhone: true,
        contactInsta: true,
      },
    });

    return NextResponse.json({
      contactEmail: profile?.contactEmail || "",
      contactPhone: profile?.contactPhone || "",
      contactInsta: profile?.contactInsta || "",
    });
  } catch (error) {
    console.error("Get contact info error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const deadlinePassed = await isDeadlinePassed();
    if (deadlinePassed) {
      return NextResponse.json(
        { error: "Die Deadline ist abgelaufen." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contactEmail, contactPhone, contactInsta } = body;

    // Basic validation
    if (contactEmail && typeof contactEmail !== "string") {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }
    if (contactPhone && typeof contactPhone !== "string") {
      return NextResponse.json(
        { error: "Ungültige Telefonnummer." },
        { status: 400 }
      );
    }
    if (contactInsta && typeof contactInsta !== "string") {
      return NextResponse.json(
        { error: "Ungültiger Instagram-Name." },
        { status: 400 }
      );
    }

    // Email format validation (if provided)
    if (contactEmail && contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail.trim())) {
        return NextResponse.json(
          { error: "Bitte gib eine gültige E-Mail-Adresse ein." },
          { status: 400 }
        );
      }
    }

    // Update or create profile with contact info
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        contactInsta: contactInsta?.trim() || null,
      },
      create: {
        userId: session.user.id,
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        contactInsta: contactInsta?.trim() || null,
      },
      select: {
        contactEmail: true,
        contactPhone: true,
        contactInsta: true,
      },
    });

    return NextResponse.json({
      message: "Kontaktdaten gespeichert.",
      ...profile,
    });
  } catch (error) {
    console.error("Update contact info error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
