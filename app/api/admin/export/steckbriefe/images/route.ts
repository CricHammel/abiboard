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

    // Get active fields (image types only)
    const fields = await prisma.steckbriefField.findMany({
      where: {
        active: true,
        type: { in: ["SINGLE_IMAGE", "MULTI_IMAGE"] },
      },
      orderBy: { order: "asc" },
    });

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "Keine Bildfelder konfiguriert." },
        { status: 404 }
      );
    }

    // Get all students with profiles that have image values
    const students = await prisma.student.findMany({
      where: {
        active: true,
        user: {
          profile: {
            values: {
              some: {
                field: { type: { in: ["SINGLE_IMAGE", "MULTI_IMAGE"] } },
                OR: [
                  { imageValue: { not: null } },
                  { imagesValue: { isEmpty: false } },
                ],
              },
            },
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        user: {
          include: {
            profile: {
              include: {
                values: {
                  where: {
                    field: { type: { in: ["SINGLE_IMAGE", "MULTI_IMAGE"] } },
                  },
                  include: { field: true },
                },
              },
            },
          },
        },
      },
    });

    const uploadsDir = path.join(process.cwd(), "public");

    // Track used folder names for duplicates
    const usedFolderNames = new Map<string, number>();

    // Create archive
    const archive = archiver("zip", { zlib: { level: 5 } });
    const passthrough = new PassThrough();
    archive.pipe(passthrough);

    for (const student of students) {
      const profile = student.user?.profile;
      if (!profile?.values?.length) continue;

      // Build unique folder name
      const baseFolderName = sanitizeFilename(`${student.lastName}_${student.firstName}`);
      const count = usedFolderNames.get(baseFolderName) || 0;
      usedFolderNames.set(baseFolderName, count + 1);
      const folderName = count > 0 ? `${baseFolderName}_${count + 1}` : baseFolderName;

      for (const value of profile.values) {
        const field = value.field;

        if (field.type === "SINGLE_IMAGE" && value.imageValue) {
          const sourcePath = path.join(uploadsDir, value.imageValue);
          const ext = path.extname(value.imageValue) || ".jpg";
          const zipPath = `steckbrief_bilder/${folderName}/${sanitizeFilename(field.key)}${ext}`;

          if (fs.existsSync(sourcePath)) {
            archive.file(sourcePath, { name: zipPath });
          }
        } else if (field.type === "MULTI_IMAGE" && value.imagesValue.length > 0) {
          for (let i = 0; i < value.imagesValue.length; i++) {
            const imgPath = value.imagesValue[i];
            const sourcePath = path.join(uploadsDir, imgPath);
            const ext = path.extname(imgPath) || ".jpg";
            const zipPath = `steckbrief_bilder/${folderName}/${sanitizeFilename(field.key)}_${i + 1}${ext}`;

            if (fs.existsSync(sourcePath)) {
              archive.file(sourcePath, { name: zipPath });
            }
          }
        }
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
        "Content-Disposition": 'attachment; filename="steckbrief_bilder.zip"',
      },
    });
  } catch (error) {
    console.error("Export steckbrief images error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
