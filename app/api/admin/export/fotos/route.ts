import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sanitizeFilename } from "@/lib/tsv-export";
import { NextResponse } from "next/server";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { PassThrough } from "stream";

export const maxDuration = 60;

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur für Admins zugänglich." }, { status: 403 });
    }

    // Get active categories with their photos
    const categories = await prisma.photoCategory.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      include: {
        photos: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    const totalPhotos = categories.reduce(
      (sum, cat) => sum + cat.photos.length,
      0
    );

    if (totalPhotos === 0) {
      return NextResponse.json(
        { error: "Keine Fotos zum Exportieren vorhanden." },
        { status: 404 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public");

    // Create archive
    const archive = archiver("zip", { zlib: { level: 5 } });
    const passthrough = new PassThrough();
    archive.pipe(passthrough);

    for (const category of categories) {
      if (category.photos.length === 0) continue;

      const categoryFolder = sanitizeFilename(category.name);

      // Track used filenames within category for duplicates
      const usedNames = new Map<string, number>();

      for (const photo of category.photos) {
        const sourcePath = path.join(uploadsDir, photo.imageUrl);
        if (!fs.existsSync(sourcePath)) continue;

        const ext = path.extname(photo.imageUrl) || ".jpg";
        const baseName = sanitizeFilename(
          `${photo.user.lastName}_${photo.user.firstName}`
        );

        const count = usedNames.get(baseName) || 0;
        usedNames.set(baseName, count + 1);
        const fileName =
          count > 0 ? `${baseName}_${count + 1}${ext}` : `${baseName}${ext}`;

        const zipPath = `fotos/${categoryFolder}/${fileName}`;
        archive.file(sourcePath, { name: zipPath });
      }
    }

    archive.finalize();

    // Convert Node stream to Web ReadableStream
    const readable = new ReadableStream({
      start(controller) {
        passthrough.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        passthrough.on("end", () => {
          controller.close();
        });
        passthrough.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="fotos.zip"',
      },
    });
  } catch (error) {
    console.error("Export photos error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
