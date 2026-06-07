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

type StudentForFormat = {
  firstName: string;
  lastName: string;
};

/**
 * Builds the set of first names that are shared by more than one student.
 * Pass it to {@link formatStudentName} to decide when a last name must be
 * appended for disambiguation. Computing it once for a whole list keeps the
 * naming stable and avoids O(n²) lookups during bulk formatting.
 */
export function getDuplicateFirstNames(
  students: { firstName: string }[]
): Set<string> {
  const counts = new Map<string, number>();
  for (const student of students) {
    counts.set(student.firstName, (counts.get(student.firstName) ?? 0) + 1);
  }
  const duplicates = new Set<string>();
  for (const [firstName, count] of counts) {
    if (count > 1) duplicates.add(firstName);
  }
  return duplicates;
}

/**
 * Formats a student's name as the first name only, falling back to
 * "Vorname Nachname" when another student shares the same first name.
 *
 * @param student - Student with firstName and lastName
 * @param duplicateFirstNames - Set from {@link getDuplicateFirstNames}
 */
export function formatStudentName(
  student: StudentForFormat,
  duplicateFirstNames: Set<string>
): string {
  return duplicateFirstNames.has(student.firstName)
    ? `${student.firstName} ${student.lastName}`
    : student.firstName;
}
