"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ENTITY_ICON_PATHS } from "@/lib/audit-log";
import {
  STUDENT_ACTIVITY_ENTITY_LABELS,
  getStudentActivityText,
} from "@/lib/student-activity";

interface StudentActivity {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityName: string | null;
  count: number;
  createdAt: string;
  updatedAt: string;
  user: { firstName: string; lastName: string };
}

// Entity icon mapping (reusing paths from audit-log where possible)
const ACTIVITY_ICON_PATHS: Record<string, string> = {
  Steckbrief: ENTITY_ICON_PATHS.SteckbriefField,
  Rankings: ENTITY_ICON_PATHS.RankingQuestion,
  TeacherQuote: ENTITY_ICON_PATHS.TeacherQuote,
  StudentQuote: ENTITY_ICON_PATHS.StudentQuote,
  Comment: ENTITY_ICON_PATHS.Comment,
  Photo: ENTITY_ICON_PATHS.Photo,
  Survey: ENTITY_ICON_PATHS.SurveyQuestion,
};

const ACTION_COLORS: Record<string, string> = {
  SUBMIT: "text-green-500",
  RETRACT: "text-orange-500",
  CREATE: "text-blue-500",
  COMPLETE: "text-green-500",
};

const ENTITY_FILTER_OPTIONS = [
  { value: "Steckbrief", label: "Steckbrief" },
  { value: "Rankings", label: "Rankings" },
  { value: "Zitate", label: "Zitate" },
  { value: "Comment", label: "Kommentare" },
  { value: "Photo", label: "Fotos" },
  { value: "Survey", label: "Umfragen" },
];

const INITIAL_LIMIT = 20;
const LOAD_MORE_LIMIT = 30;

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

export default function SchuelerAktivitaetenPage() {
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [entityFilter, setEntityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [students, setStudents] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  // Fetch student list for filter dropdown
  useEffect(() => {
    fetch("/api/admin/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.students) {
          const registered = data.students
            .filter((s: { user: { id: string } | null }) => s.user)
            .map((s: { firstName: string; lastName: string; user: { id: string } }) => ({
              id: s.user.id,
              firstName: s.firstName,
              lastName: s.lastName,
            }))
            .sort((a: { lastName: string }, b: { lastName: string }) =>
              a.lastName.localeCompare(b.lastName)
            );
          setStudents(registered);
        }
      })
      .catch(console.error);
  }, []);

  const fetchActivities = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = reset ? 0 : activities.length;
      const currentLimit = reset ? INITIAL_LIMIT : LOAD_MORE_LIMIT;

      const params = new URLSearchParams({
        limit: currentLimit.toString(),
        offset: currentOffset.toString(),
      });
      if (entityFilter) params.set("entity", entityFilter);
      if (userFilter) params.set("userId", userFilter);

      const res = await fetch(`/api/admin/student-activities?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setActivities(data.activities);
        } else {
          setActivities((prev) => [...prev, ...data.activities]);
        }
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch student activities:", error);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [activities.length, entityFilter, userFilter]);

  useEffect(() => {
    fetchActivities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityFilter, userFilter]);

  const hasMore = activities.length < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schüler-Aktivitäten</h1>
        <p className="text-gray-600 mt-2">
          Protokoll aller Schüler-Aktionen
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schüler
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="block w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Alle</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.lastName}, {s.firstName}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bereich
            </label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Alle</option>
              {ENTITY_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-500 sm:ml-auto">
            {total} Einträge gefunden
          </div>
        </div>
      </Card>

      {/* Activity List */}
      <Card>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Laden...</div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Keine Aktivitäten gefunden.
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity) => {
              const iconPath = ACTIVITY_ICON_PATHS[activity.entity];
              const actionColor = ACTION_COLORS[activity.action] || "text-gray-500";
              const activityText = getStudentActivityText(
                activity.action,
                activity.entity,
                activity.entityName,
                activity.count
              );
              const entityLabel = STUDENT_ACTIVITY_ENTITY_LABELS[activity.entity] || activity.entity;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className={`mt-0.5 shrink-0 w-5 flex justify-center ${actionColor}`}>
                    {iconPath ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                      </svg>
                    ) : (
                      <span className="font-mono text-sm">~</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">
                        {activity.user.firstName} {activity.user.lastName}
                      </span>
                      {" "}
                      <span className="text-gray-600">{activityText}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="text-gray-400">{entityLabel}</span>
                      {" · "}
                      {relativeTime(activity.updatedAt)}
                      {" · "}
                      {new Date(activity.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="border-t border-gray-100 pt-4 mt-4 text-center">
            <Button
              variant="secondary"
              onClick={() => fetchActivities(false)}
              disabled={loadingMore}
            >
              {loadingMore ? "Laden..." : `Mehr anzeigen (${activities.length} von ${total})`}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
