import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const UPLOAD_DIR = 'public/uploads/profiles';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Die Datei ist zu groß. Maximal 5 MB erlaubt.',
    };
  }

  // Validate type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Ungültiger Dateityp. Nur JPG, PNG und WebP sind erlaubt.',
    };
  }

  return { valid: true };
}

export function generateUniqueFilename(originalName: string, fieldName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(6).toString('hex');
  return `${fieldName}-${timestamp}-${random}${ext}`;
}

export async function saveImageFile(
  file: File,
  userId: string,
  fieldName: string
): Promise<string> {
  const userDir = path.join(process.cwd(), UPLOAD_DIR, userId);
  
  // Create directory if it doesn't exist
  await fs.mkdir(userDir, { recursive: true });

  const filename = generateUniqueFilename(file.name, fieldName);
  const filepath = path.join(userDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filepath, buffer);

  // Return relative path from public/
  return `/uploads/profiles/${userId}/${filename}`;
}

export async function deleteImageFile(imagePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    await fs.unlink(fullPath);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw - file might already be deleted
  }
}
