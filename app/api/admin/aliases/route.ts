import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createAliasSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(20, "Name darf maximal 20 Zeichen haben")
    .trim(),
});

// GET: Fetch all admin aliases
export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const aliases = await prisma.adminAlias.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json(aliases);
}

// POST: Create a new admin alias
export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await request.json();
  const result = createAliasSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message || "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { name } = result.data;

  // Check if alias already exists
  const existing = await prisma.adminAlias.findUnique({
    where: { name },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Dieses Kürzel existiert bereits" },
      { status: 400 }
    );
  }

  const alias = await prisma.adminAlias.create({
    data: { name },
    select: { id: true, name: true },
  });

  return NextResponse.json(alias, { status: 201 });
}

// DELETE: Remove an admin alias
export async function DELETE(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID ist erforderlich" }, { status: 400 });
  }

  await prisma.adminAlias.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
