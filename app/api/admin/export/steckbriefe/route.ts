import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildTsv, tsvResponse, sanitizeFilename } from "@/lib/tsv-export";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur für Admins zugänglich." }, { status: 403 });
    }

    // Get active fields ordered
    const fields = await prisma.steckbriefField.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });

    // Get all students with user, profile, and steckbrief values
    const students = await prisma.student.findMany({
      where: { active: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        user: {
          include: {
            profile: {
              include: {
                values: {
                  include: { field: true },
                },
              },
            },
          },
        },
      },
    });

    // Build headers: static columns + dynamic field columns
    const headers: string[] = ["Vorname", "Nachname", "Geschlecht", "Status"];

    for (const field of fields) {
      if (field.type === "MULTI_IMAGE") {
        const maxFiles = field.maxFiles || 3;
        for (let i = 1; i <= maxFiles; i++) {
          headers.push(`@${field.label}_${i}`);
        }
      } else if (field.type === "SINGLE_IMAGE") {
        headers.push(`@${field.label}`);
      } else {
        headers.push(field.label);
      }
    }

    // Track used folder names to handle duplicates
    const usedFolderNames = new Map<string, number>();

    const rows: string[][] = [];

    for (const student of students) {
      const profile = student.user?.profile;
      const status = profile?.status || "";
      const gender = student.gender === "MALE" ? "m" : student.gender === "FEMALE" ? "w" : "";

      // Build unique folder name for this student
      const baseFolderName = sanitizeFilename(`${student.lastName}_${student.firstName}`);
      const count = usedFolderNames.get(baseFolderName) || 0;
      usedFolderNames.set(baseFolderName, count + 1);
      const folderName = count > 0 ? `${baseFolderName}_${count + 1}` : baseFolderName;

      const row: string[] = [student.firstName, student.lastName, gender, status];

      // Build value lookup
      const valueMap = new Map<string, { textValue: string | null; imageValue: string | null; imagesValue: string[] }>();
      if (profile?.values) {
        for (const val of profile.values) {
          valueMap.set(val.fieldId, val);
        }
      }

      for (const field of fields) {
        const value = valueMap.get(field.id);

        if (field.type === "TEXT" || field.type === "TEXTAREA") {
          row.push(value?.textValue || "");
        } else if (field.type === "SINGLE_IMAGE") {
          if (value?.imageValue) {
            const ext = path.extname(value.imageValue) || ".jpg";
            row.push(`steckbrief_bilder/${folderName}/${sanitizeFilename(field.key)}${ext}`);
          } else {
            row.push("");
          }
        } else if (field.type === "MULTI_IMAGE") {
          const maxFiles = field.maxFiles || 3;
          const images = value?.imagesValue || [];
          for (let i = 0; i < maxFiles; i++) {
            if (i < images.length) {
              const ext = path.extname(images[i]) || ".jpg";
              row.push(`steckbrief_bilder/${folderName}/${sanitizeFilename(field.key)}_${i + 1}${ext}`);
            } else {
              row.push("");
            }
          }
        }
      }

      rows.push(row);
    }

    const tsv = buildTsv(headers, rows);
    return tsvResponse(tsv, "steckbriefe.tsv");
  } catch (error) {
    console.error("Export steckbriefe error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
