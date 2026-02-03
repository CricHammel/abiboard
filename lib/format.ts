/**
 * Utility functions for consistent formatting across the application
 */

type TeacherForFormat = {
  salutation: "HERR" | "FRAU";
  lastName: string;
  subject?: string | null;
};

interface FormatTeacherNameOptions {
  /** Include subject in parentheses. Default: true */
  includeSubject?: boolean;
}

/**
 * Formats a teacher's name consistently across the application.
 * Format: "Herr/Frau Nachname (Fach)"
 *
 * @param teacher - Teacher object with salutation, lastName, and optional subject
 * @param options - Formatting options
 * @returns Formatted teacher name, e.g. "Herr Müller (Mathe)"
 */
export function formatTeacherName(
  teacher: TeacherForFormat,
  options: FormatTeacherNameOptions = {}
): string {
  const { includeSubject = true } = options;
  const salutation = teacher.salutation === "HERR" ? "Herr" : "Frau";
  const name = `${salutation} ${teacher.lastName}`;

  if (includeSubject && teacher.subject) {
    return `${name} (${teacher.subject})`;
  }

  return name;
}
