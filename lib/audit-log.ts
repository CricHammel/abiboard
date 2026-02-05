import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

// Action types for audit logging
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "IMPORT"
  | "REORDER"
  | "SETTINGS";

// Parameters for logging an admin action
export interface LogAdminActionParams {
  alias: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string;
  entityName?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  success?: boolean;
  error?: string;
}

// Human-readable entity labels for German UI
export const ENTITY_LABELS: Record<string, string> = {
  Student: "Schüler",
  Teacher: "Lehrer",
  User: "Benutzer",
  RankingQuestion: "Ranking-Frage",
  SteckbriefField: "Steckbrief-Feld",
  SurveyQuestion: "Umfrage-Frage",
  SurveyOption: "Umfrage-Option",
  Fotos: "Fotos", // Combined filter for Photo and PhotoCategory
  Photo: "Fotos",
  PhotoCategory: "Fotos",
  TeacherQuote: "Lehrer-Zitat",
  StudentQuote: "Schüler-Zitat",
  Comment: "Kommentar",
  AppSettings: "Einstellungen",
  AdminAlias: "Admin-Kürzel",
};

// SVG paths for entity icons (matching sidebar navigation)
export const ENTITY_ICON_PATHS: Record<string, string> = {
  // Verwaltung (people icon)
  Student: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  Teacher: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  User: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  // Rankings (star icon)
  RankingQuestion: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  // Steckbrief (document icon)
  SteckbriefField: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  // Umfragen (clipboard icon)
  SurveyQuestion: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  SurveyOption: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  // Fotos (image icon)
  Photo: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  PhotoCategory: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  // Zitate (speech bubble icon)
  TeacherQuote: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
  StudentQuote: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
  // Kommentare (chat icon)
  Comment: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  // Einstellungen (cog icon)
  AppSettings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  AdminAlias: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
};

// Action labels for German UI
export const ACTION_LABELS: Record<AuditAction | "ACTIVATE" | "DEACTIVATE", string> = {
  CREATE: "erstellt",
  UPDATE: "bearbeitet",
  DELETE: "gelöscht",
  IMPORT: "importiert",
  REORDER: "neu sortiert",
  SETTINGS: "geändert",
  ACTIVATE: "aktiviert",
  DEACTIVATE: "deaktiviert",
};

// SVG paths for action icons
export const ACTION_ICON_PATHS: Record<string, string> = {
  CREATE: "M12 4v16m8-8H4", // Plus
  UPDATE: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", // Pencil
  DELETE: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", // Trash
  IMPORT: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12", // Download
  REORDER: "M4 6h16M4 10h16M4 14h16M4 18h16", // List
  SETTINGS: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", // Cog
  ACTIVATE: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", // Check circle
  DEACTIVATE: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", // X circle
};

// Colors for action icons
export const ACTION_ICON_COLORS: Record<string, string> = {
  CREATE: "text-green-500",
  UPDATE: "text-blue-500",
  DELETE: "text-red-500",
  IMPORT: "text-purple-500",
  REORDER: "text-gray-500",
  SETTINGS: "text-gray-500",
  ACTIVATE: "text-green-500",
  DEACTIVATE: "text-red-500",
};

/**
 * Determine the display action based on oldValues/newValues
 * If 'active' changed from true->false or false->true, show ACTIVATE/DEACTIVATE
 */
export function getDisplayAction(
  action: string,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null
): string {
  if (action !== "UPDATE") return action;

  // Check if 'active' field changed between boolean values
  const oldActive = oldValues?.active;
  const newActive = newValues?.active;

  // Only trigger if both are explicit booleans and different
  if (
    typeof oldActive === "boolean" &&
    typeof newActive === "boolean" &&
    oldActive !== newActive
  ) {
    return newActive ? "ACTIVATE" : "DEACTIVATE";
  }

  return action;
}

// Cookie name for admin alias
export const ADMIN_ALIAS_COOKIE = "admin_alias";
export const ADMIN_ALIAS_TIMESTAMP_COOKIE = "admin_alias_timestamp";

// Timeout for alias prompt (2 hours in milliseconds)
export const ALIAS_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction(
  params: LogAdminActionParams
): Promise<void> {
  const {
    alias,
    action,
    entity,
    entityId,
    entityName,
    oldValues,
    newValues,
    success = true,
    error,
  } = params;

  try {
    await prisma.auditLog.create({
      data: {
        alias: alias || null,
        action,
        entity,
        entityId,
        entityName,
        success,
        oldValues: oldValues
          ? (oldValues as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        newValues: newValues
          ? (newValues as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        error,
      },
    });
  } catch (e) {
    // Don't let audit logging failures break the main operation
    console.error("Failed to create audit log:", e);
  }
}

/**
 * Extract admin alias from request cookies
 */
export function getAdminAlias(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  const alias = cookies[ADMIN_ALIAS_COOKIE];
  const timestamp = cookies[ADMIN_ALIAS_TIMESTAMP_COOKIE];

  // Check if alias exists and is not expired
  if (alias && timestamp) {
    const timestampMs = parseInt(timestamp, 10);
    if (!isNaN(timestampMs) && Date.now() - timestampMs < ALIAS_TIMEOUT_MS) {
      return alias === "unknown" ? null : alias;
    }
  }

  return null;
}

/**
 * Parse cookies from cookie header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name) {
      cookies[name] = decodeURIComponent(valueParts.join("="));
    }
  });
  return cookies;
}

/**
 * Format a relative time string for display (German)
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  if (diffHour < 24) return `vor ${diffHour} Std.`;
  if (diffDay === 1) return "gestern";
  if (diffDay < 7) return `vor ${diffDay} Tagen`;

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Get the display text for an audit log entry
 */
export function getAuditLogDisplayText(log: {
  action: string;
  entity: string;
  entityName?: string | null;
  success: boolean;
  error?: string | null;
}): string {
  const entityLabel = ENTITY_LABELS[log.entity] || log.entity;
  const actionLabel = ACTION_LABELS[log.action as AuditAction] || log.action;

  if (!log.success) {
    return `Fehler: ${entityLabel} ${actionLabel}${log.error ? ` - ${log.error}` : ""}`;
  }

  if (log.entityName) {
    return `${entityLabel}: "${log.entityName}" ${actionLabel}`;
  }

  return `${entityLabel} ${actionLabel}`;
}
