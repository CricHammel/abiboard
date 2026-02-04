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
  /** Use short form "Hr./Fr." instead of "Herr/Frau". Default: false */
  shortForm?: boolean;
}

/**
 * Formats a teacher's name consistently across the application.
 * Format: "Herr/Frau Nachname (Fach)" or "Hr./Fr. Nachname (Fach)"
 *
 * @param teacher - Teacher object with salutation, lastName, and optional subject
 * @param options - Formatting options
 * @returns Formatted teacher name, e.g. "Herr Müller (Mathe)" or "Hr. Müller"
 */
export function formatTeacherName(
  teacher: TeacherForFormat,
  options: FormatTeacherNameOptions = {}
): string {
  const { includeSubject = true, shortForm = false } = options;
  const salutation = shortForm
    ? (teacher.salutation === "HERR" ? "Hr." : "Fr.")
    : (teacher.salutation === "HERR" ? "Herr" : "Frau");
  const name = `${salutation} ${teacher.lastName}`;

  if (includeSubject && teacher.subject) {
    return `${name} (${teacher.subject})`;
  }

  return name;
}
