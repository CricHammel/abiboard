import { prisma } from "./prisma";

// Action types for student activity logging
export type StudentAction = "SUBMIT" | "RETRACT" | "CREATE" | "COMPLETE";

// Parameters for logging a student activity
export interface LogStudentActivityParams {
  userId: string;
  action: StudentAction;
  entity: string;
  entityName?: string;
  count?: number;
}

// Time window for grouping similar actions (5 minutes)
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

/**
 * Log a student activity. Groups consecutive similar actions
 * (same user, action, entity, entityName) within 5 minutes.
 */
export async function logStudentActivity(
  params: LogStudentActivityParams
): Promise<void> {
  const { userId, action, entity, entityName, count = 1 } = params;

  try {
    // Only group CREATE actions (e.g. multiple quotes, multiple photos).
    // SUBMIT, RETRACT, COMPLETE are always individual entries.
    if (action === "CREATE") {
      const cutoffTime = new Date(Date.now() - GROUPING_WINDOW_MS);

      const recentEntry = await prisma.studentActivity.findFirst({
        where: {
          userId,
          action,
          entity,
          entityName: entityName ?? null,
          updatedAt: { gte: cutoffTime },
        },
        orderBy: { updatedAt: "desc" },
      });

      if (recentEntry) {
        await prisma.studentActivity.update({
          where: { id: recentEntry.id },
          data: {
            count: recentEntry.count + count,
          },
        });
        return;
      }
    }

    await prisma.studentActivity.create({
      data: {
        userId,
        action,
        entity,
        entityName,
        count,
      },
    });
  } catch (e) {
    // Never let logging break the main operation
    console.error("Failed to log student activity:", e);
  }
}

// Entity labels for German UI (reuses some from audit-log.ts but student-facing)
export const STUDENT_ACTIVITY_ENTITY_LABELS: Record<string, string> = {
  Steckbrief: "Steckbrief",
  Rankings: "Rankings",
  TeacherQuote: "Lehrer-Zitat",
  StudentQuote: "Schüler-Zitat",
  Comment: "Kommentar",
  Photo: "Foto",
  Survey: "Umfrage",
};

// Entity filter options for the detail page
export const STUDENT_ACTIVITY_ENTITIES = [
  "Steckbrief",
  "Rankings",
  "TeacherQuote",
  "StudentQuote",
  "Comment",
  "Photo",
  "Survey",
] as const;

/**
 * Build the German display text for a student activity entry.
 * Returns just the action part (without student name).
 */
export function getStudentActivityText(
  action: string,
  entity: string,
  entityName: string | null,
  count: number
): string {
  const countPrefix = count > 1 ? `${count}× ` : "";

  switch (`${entity}:${action}`) {
    case "Steckbrief:SUBMIT":
      return "hat den Steckbrief eingereicht";
    case "Steckbrief:RETRACT":
      return "hat den Steckbrief zurückgezogen";
    case "Rankings:SUBMIT":
      return "hat die Rankings eingereicht";
    case "Rankings:RETRACT":
      return "hat die Rankings zurückgezogen";
    case "TeacherQuote:CREATE":
      return `hat ${countPrefix}${count > 1 ? "Zitate" : "ein Zitat"} über ${entityName} hinzugefügt`;
    case "StudentQuote:CREATE":
      return `hat ${countPrefix}${count > 1 ? "Zitate" : "ein Zitat"} über ${entityName} hinzugefügt`;
    case "Comment:CREATE":
      return `hat einen Kommentar über ${entityName} geschrieben`;
    case "Photo:CREATE":
      return count > 1
        ? `hat ${count} Fotos in ${entityName} hochgeladen`
        : `hat ein Foto in ${entityName} hochgeladen`;
    case "Survey:COMPLETE":
      return "hat die Umfrage abgeschlossen";
    default:
      return `${action} ${entity}`;
  }
}
