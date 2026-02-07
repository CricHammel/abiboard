"use client";

import { ENTITY_ICON_PATHS } from "@/lib/audit-log";

type ActivityItem = {
  id: string;
  entity: string;
  action: string;
  text: string;
  timestamp: string;
};

// Map student activity entities to ENTITY_ICON_PATHS keys
const ENTITY_ICON_MAP: Record<string, string> = {
  Steckbrief: "SteckbriefField",
  Rankings: "RankingQuestion",
  TeacherQuote: "TeacherQuote",
  StudentQuote: "StudentQuote",
  Comment: "Comment",
  Photo: "Photo",
  Survey: "SurveyQuestion",
};

// Action-based colors (consistent with admin activities and detail page)
const ACTION_COLORS: Record<string, string> = {
  SUBMIT: "text-green-500",
  COMPLETE: "text-green-500",
  CREATE: "text-blue-500",
  RETRACT: "text-orange-500",
};

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} ${diffMin === 1 ? "Minute" : "Minuten"}`;
  if (diffHours < 24) return `vor ${diffHours} ${diffHours === 1 ? "Stunde" : "Stunden"}`;
  if (diffDays < 30) return `vor ${diffDays} ${diffDays === 1 ? "Tag" : "Tagen"}`;
  return `vor ${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? "Monat" : "Monaten"}`;
}

interface StudentActivityFeedProps {
  activities: ActivityItem[];
}

export function StudentActivityFeed({ activities }: StudentActivityFeedProps) {
  return (
    <>
      {activities.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          Noch keine Aktivitäten vorhanden.
        </p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const iconKey = ENTITY_ICON_MAP[activity.entity];
            const iconPath = iconKey ? ENTITY_ICON_PATHS[iconKey] : null;
            const color = ACTION_COLORS[activity.action] || "text-gray-500";

            return (
              <div key={activity.id} className="flex items-start gap-3 py-2">
                <span className={`mt-0.5 shrink-0 ${color}`}>
                  {iconPath ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                    </svg>
                  ) : (
                    <span className="w-5 h-5 inline-block font-mono text-sm text-center">~</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-500">
                    {relativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
