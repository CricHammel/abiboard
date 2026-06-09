import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sanitizeFilename, buildCsv, csvBuffer } from "@/lib/csv-export";
import { resolveCategoryPhotoFiles } from "@/lib/photo-export";
import { NextResponse } from "next/server";
import archiver from "archiver";
import { PassThrough } from "stream";

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur für Admins zugänglich." }, { status: 403 });
    }

    // Image path options, mirroring the Steckbriefe CSV export.
    const { searchParams } = new URL(request.url);
    const pathStyle = searchParams.get("pathStyle") === "windows" ? "windows" : "unix";
    const sep = pathStyle === "windows" ? "\\" : "/";
    const rawPrefix = searchParams.get("imagePrefix") ?? "";
    const normalizedPrefix = rawPrefix.replace(/[\\/]/g, sep);
    const imagePrefix = normalizedPrefix
      ? normalizedPrefix.endsWith(sep)
        ? normalizedPrefix
        : `${normalizedPrefix}${sep}`
      : "";

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

    // Create archive
    const archive = archiver("zip", { zlib: { level: 5 } });
    const passthrough = new PassThrough();
    archive.pipe(passthrough);

    for (const category of categories) {
      if (category.photos.length === 0) continue;

      const categoryFolder = sanitizeFilename(category.name);
      const files = resolveCategoryPhotoFiles(category.photos);
      if (files.length === 0) continue;

      // Paths in the CSV always start from the root with the prefix, even
      // though the CSV itself sits inside the category folder.
      const csvRows: string[][] = [];
      for (const { sourcePath, fileName } of files) {
        archive.file(sourcePath, { name: `fotos/${categoryFolder}/${fileName}` });
        csvRows.push([`${imagePrefix}fotos${sep}${categoryFolder}${sep}${fileName}`]);
      }

      // One single-column "@Bild" CSV per category for InDesign Data Merge.
      const csv = buildCsv(["@Bild"], csvRows);
      archive.append(csvBuffer(csv), {
        name: `fotos/${categoryFolder}/${categoryFolder}.csv`,
      });
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
