// Shared helpers for the photo export so the ZIP file names and the per-category
// CSV path entries are always built identically (and can never drift apart).

import fs from "fs";
import path from "path";
import { sanitizeFilename } from "./csv-export";

const uploadsDir = path.join(process.cwd(), "uploads");

/** Resolve a stored "/uploads/..." path to an absolute path inside uploads/. */
export function resolveUploadPath(storedPath: string): string | null {
  const relative = storedPath.replace(/^\/+uploads\/+/, "");
  const resolved = path.resolve(uploadsDir, relative);
  if (!resolved.startsWith(uploadsDir)) return null;
  return resolved;
}

export interface PhotoFile {
  /** Absolute path of the source file on disk. */
  sourcePath: string;
  /** Name the file gets inside its category folder (with duplicate counter). */
  fileName: string;
}

/**
 * Resolve a category's photos to their on-disk source and the file name they
 * receive in the export. Photos whose file is missing are skipped and do not
 * consume a duplicate counter, so names stay stable and match the ZIP exactly.
 */
export function resolveCategoryPhotoFiles(
  photos: { imageUrl: string; user: { firstName: string; lastName: string } }[]
): PhotoFile[] {
  const usedNames = new Map<string, number>();
  const files: PhotoFile[] = [];

  for (const photo of photos) {
    const sourcePath = resolveUploadPath(photo.imageUrl);
    if (!sourcePath || !fs.existsSync(sourcePath)) continue;

    const ext = path.extname(photo.imageUrl) || ".jpg";
    const baseName = sanitizeFilename(`${photo.user.lastName}_${photo.user.firstName}`);
    const count = usedNames.get(baseName) || 0;
    usedNames.set(baseName, count + 1);
    const fileName = count > 0 ? `${baseName}_${count + 1}${ext}` : `${baseName}${ext}`;

    files.push({ sourcePath, fileName });
  }

  return files;
}
