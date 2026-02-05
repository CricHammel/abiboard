import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { logAdminAction, getAdminAlias } from "@/lib/audit-log";

// Validation schema for creating a new field
const createFieldSchema = z.object({
  key: z
    .string()
    .min(1, "Key ist erforderlich.")
    .max(50, "Key darf maximal 50 Zeichen lang sein.")
    .regex(
      /^[a-z][a-zA-Z0-9]*$/,
      "Key muss mit einem Kleinbuchstaben beginnen und darf nur Buchstaben und Zahlen enthalten."
    ),
  type: z.enum(["TEXT", "TEXTAREA", "SINGLE_IMAGE", "MULTI_IMAGE"], {
    message: "Ungültiger Feldtyp.",
  }),
  label: z
    .string()
    .min(1, "Label ist erforderlich.")
    .max(100, "Label darf maximal 100 Zeichen lang sein."),
  placeholder: z.string().max(200).optional().nullable(),
  maxLength: z.number().int().positive().optional().nullable(),
  maxFiles: z.number().int().min(1).max(10).optional().nullable(),
  rows: z.number().int().min(1).max(20).optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
});

// GET: List all fields (including inactive ones for admin view)
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

    const fields = await prisma.steckbriefField.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ fields });
  } catch (error) {
    console.error("Error fetching steckbrief fields:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

// POST: Create a new field
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
    const validation = createFieldSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Ungültige Eingabedaten.";
      await logAdminAction({
        alias,
        action: "CREATE",
        entity: "SteckbriefField",
        success: false,
        error: errorMessage,
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const data = validation.data;

    // Check if key already exists
    const existingField = await prisma.steckbriefField.findUnique({
      where: { key: data.key },
    });

    if (existingField) {
      await logAdminAction({
        alias,
        action: "CREATE",
        entity: "SteckbriefField",
        success: false,
        error: "Key existiert bereits",
      });
      return NextResponse.json(
        { error: "Ein Feld mit diesem Key existiert bereits." },
        { status: 400 }
      );
    }

    // If no order specified, put it at the end
    let order = data.order;
    if (order === undefined) {
      const lastField = await prisma.steckbriefField.findFirst({
        orderBy: { order: "desc" },
      });
      order = (lastField?.order ?? 0) + 1;
    }

    const field = await prisma.steckbriefField.create({
      data: {
        key: data.key,
        type: data.type,
        label: data.label,
        placeholder: data.placeholder,
        maxLength: data.maxLength,
        maxFiles: data.maxFiles,
        rows: data.rows,
        required: data.required ?? false,
        order,
      },
    });

    await logAdminAction({
      alias,
      action: "CREATE",
      entity: "SteckbriefField",
      entityId: field.id,
      entityName: field.label,
      newValues: { key: data.key, type: data.type, label: data.label, required: data.required },
    });

    return NextResponse.json(
      { message: "Feld erfolgreich erstellt.", field },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating steckbrief field:", error);
    await logAdminAction({
      alias,
      action: "CREATE",
      entity: "SteckbriefField",
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
