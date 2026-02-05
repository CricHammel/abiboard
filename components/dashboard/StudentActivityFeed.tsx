"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ActivityItem = {
  id: string;
  type: "steckbrief" | "ranking" | "zitat" | "kommentar";
  text: string;
  timestamp: string;
};

const activityIcons: Record<ActivityItem["type"], React.ReactNode> = {
  steckbrief: (
    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ranking: (
    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
  ),
  zitat: (
    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  kommentar: (
    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
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

const INITIAL_COUNT = 5;
const EXPANDED_COUNT = 15;

interface StudentActivityFeedProps {
  activities: ActivityItem[];
}

export function StudentActivityFeed({ activities }: StudentActivityFeedProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleActivities = expanded
    ? activities.slice(0, EXPANDED_COUNT)
    : activities.slice(0, INITIAL_COUNT);

  const hasMore = activities.length > INITIAL_COUNT;
  const showingAll = expanded || activities.length <= INITIAL_COUNT;

  return (
    <>
      {visibleActivities.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          Noch keine Aktivitäten vorhanden.
        </p>
      ) : (
        <div className="space-y-3">
          {visibleActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 py-2">
              <span className="mt-0.5 shrink-0">
                {activityIcons[activity.type]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900">{activity.text}</p>
                <p className="text-xs text-gray-500">
                  {relativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !showingAll && (
        <div className="pt-3 border-t border-gray-100 mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setExpanded(true)}
            className="w-full"
          >
            Mehr anzeigen ({activities.length - INITIAL_COUNT} weitere)
          </Button>
        </div>
      )}

      {expanded && activities.length > EXPANDED_COUNT && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Zeige {EXPANDED_COUNT} von {activities.length} Aktivitäten
        </p>
      )}
    </>
  );
}
