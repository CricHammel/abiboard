import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for updating a field
// Note: key and type cannot be changed after creation
const updateFieldSchema = z.object({
  label: z
    .string()
    .min(1, "Label ist erforderlich.")
    .max(100, "Label darf maximal 100 Zeichen lang sein.")
    .optional(),
  placeholder: z.string().max(200).optional().nullable(),
  maxLength: z.number().int().positive().optional().nullable(),
  maxFiles: z.number().int().min(1).max(10).optional().nullable(),
  rows: z.number().int().min(1).max(20).optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

// GET: Get a single field
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
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

    const { fieldId } = await params;

    const field = await prisma.steckbriefField.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      return NextResponse.json(
        { error: "Feld nicht gefunden." },
        { status: 404 }
      );
    }

    return NextResponse.json({ field });
  } catch (error) {
    console.error("Error fetching steckbrief field:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

// PATCH: Update a field
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
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

    const { fieldId } = await params;

    // Check if field exists
    const existingField = await prisma.steckbriefField.findUnique({
      where: { id: fieldId },
    });

    if (!existingField) {
      return NextResponse.json(
        { error: "Feld nicht gefunden." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateFieldSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Ungültige Eingabedaten.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const data = validation.data;

    // Build update data, converting null to undefined for Prisma
    const updateData: Record<string, unknown> = {};

    if (data.label !== undefined) updateData.label = data.label;
    if (data.placeholder !== undefined) updateData.placeholder = data.placeholder;
    if (data.maxLength !== undefined) updateData.maxLength = data.maxLength;
    if (data.maxFiles !== undefined) updateData.maxFiles = data.maxFiles;
    if (data.rows !== undefined) updateData.rows = data.rows;
    if (data.required !== undefined) updateData.required = data.required;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.active !== undefined) updateData.active = data.active;

    const field = await prisma.steckbriefField.update({
      where: { id: fieldId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Feld erfolgreich aktualisiert.",
      field,
    });
  } catch (error) {
    console.error("Error updating steckbrief field:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

// DELETE: Not implemented - use soft delete via PATCH { active: false }
export async function DELETE() {
  return NextResponse.json(
    {
      error:
        "Felder können nicht gelöscht werden. Verwende stattdessen die Deaktivierung.",
    },
    { status: 405 }
  );
}
