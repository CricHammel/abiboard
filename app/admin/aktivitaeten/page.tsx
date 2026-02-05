"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ENTITY_LABELS, ACTION_LABELS, AuditAction, formatRelativeTime, getDisplayAction, ENTITY_ICON_PATHS, ACTION_ICON_PATHS, ACTION_ICON_COLORS } from "@/lib/audit-log";

function EntityIcon({ entity, className }: { entity: string; className?: string }) {
  const path = ENTITY_ICON_PATHS[entity];
  if (!path) return null;
  return (
    <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}

interface AuditLog {
  id: string;
  alias: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  entityName: string | null;
  success: boolean;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
}

interface GroupedLog {
  logs: AuditLog[];
  count: number;
  firstLog: AuditLog;
  lastLog: AuditLog;
}

// Group consecutive logs with same (alias, action, entity)
function groupConsecutiveLogs(logs: AuditLog[]): GroupedLog[] {
  if (logs.length === 0) return [];

  const groups: GroupedLog[] = [];
  let currentGroup: AuditLog[] = [logs[0]];

  for (let i = 1; i < logs.length; i++) {
    const current = logs[i];
    const prev = logs[i - 1];

    // Group if same alias, action, entity, and both successful
    const shouldGroup =
      current.alias === prev.alias &&
      current.action === prev.action &&
      current.entity === prev.entity &&
      current.success === prev.success &&
      // Only group if no specific entityName (bulk operations like REORDER)
      !current.entityName &&
      !prev.entityName;

    if (shouldGroup) {
      currentGroup.push(current);
    } else {
      // Save current group and start new one
      groups.push({
        logs: currentGroup,
        count: currentGroup.length,
        firstLog: currentGroup[0],
        lastLog: currentGroup[currentGroup.length - 1],
      });
      currentGroup = [current];
    }
  }

  // Don't forget the last group
  groups.push({
    logs: currentGroup,
    count: currentGroup.length,
    firstLog: currentGroup[0],
    lastLog: currentGroup[currentGroup.length - 1],
  });

  return groups;
}

const ENTITIES = [
  "Student",
  "Teacher",
  "User",
  "SteckbriefField",
  "RankingQuestion",
  "SurveyQuestion",
  "TeacherQuote",
  "StudentQuote",
  "Comment",
  "Fotos", // Combines Photo and PhotoCategory
  "AppSettings",
];

const INITIAL_LIMIT = 20;
const LOAD_MORE_LIMIT = 30;

export default function AktivitaetenPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [errorsOnly, setErrorsOnly] = useState(false);

  const fetchLogs = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = reset ? 0 : logs.length;
      const currentLimit = reset ? INITIAL_LIMIT : LOAD_MORE_LIMIT;

      const params = new URLSearchParams({
        limit: currentLimit.toString(),
        offset: currentOffset.toString(),
      });
      if (entityFilter) params.set("entity", entityFilter);
      if (errorsOnly) params.set("errorsOnly", "true");

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setLogs(data.logs);
        } else {
          setLogs((prev) => [...prev, ...data.logs]);
        }
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [logs.length, entityFilter, errorsOnly]);

  useEffect(() => {
    fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityFilter, errorsOnly]);

  const handleLoadMore = () => {
    fetchLogs(false);
  };

  const hasMore = logs.length < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin-Aktivitäten</h1>
        <p className="text-gray-600 mt-2">
          Protokoll aller Admin-Aktionen
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-end">
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
              {ENTITIES.map((entity) => (
                <option key={entity} value={entity}>
                  {ENTITY_LABELS[entity] || entity}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="errorsOnly"
              checked={errorsOnly}
              onChange={(e) => setErrorsOnly(e.target.checked)}
              className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="errorsOnly" className="text-sm text-gray-700">
              Nur Fehler anzeigen
            </label>
          </div>

          <div className="text-sm text-gray-500 sm:ml-auto">
            {total} Einträge gefunden
          </div>
        </div>
      </Card>

      {/* Logs List */}
      <Card>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Laden...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Keine Aktivitäten gefunden.
          </div>
        ) : (
          <div className="space-y-1">
            {groupConsecutiveLogs(logs).map((group) => {
              const log = group.firstLog;
              const entityLabel = ENTITY_LABELS[log.entity] || log.entity;
              const displayAction = getDisplayAction(log.action, log.oldValues, log.newValues);
              const actionLabel = ACTION_LABELS[displayAction as AuditAction] || displayAction;
              const isError = !log.success;
              const isGrouped = group.count > 1;

              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`w-full text-left flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    isError ? "bg-red-50 hover:bg-red-100" : ""
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 w-5 flex justify-center ${isError ? "text-red-500" : ACTION_ICON_COLORS[displayAction] || "text-gray-500"}`}>
                    {isError ? (
                      <span className="font-mono text-sm">!</span>
                    ) : ACTION_ICON_PATHS[displayAction] ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ACTION_ICON_PATHS[displayAction]} />
                      </svg>
                    ) : (
                      <span className="font-mono text-sm">~</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${isError ? "text-red-700" : "text-gray-900"}`}
                    >
                      <span className="font-medium text-gray-600">
                        {log.alias || "—"}
                      </span>
                      {" | "}
                      <span className="font-medium">
                        <EntityIcon entity={log.entity} className="w-3.5 h-3.5 text-gray-400 inline -mt-0.5 mr-1" />
                        {entityLabel}
                      </span>
                      {log.entityName && (
                        <span className="text-gray-600">
                          : {log.entityName}
                        </span>
                      )}
                      {" "}
                      <span className="text-gray-500">
                        {isGrouped ? `${group.count}× ` : ""}{actionLabel}
                      </span>
                      {isError && log.error && (
                        <span className="text-red-600 ml-1">— {log.error}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatRelativeTime(new Date(log.createdAt))}
                      {isGrouped && (
                        <span>
                          {" bis "}
                          {formatRelativeTime(new Date(group.lastLog.createdAt))}
                        </span>
                      )}
                      {" · "}
                      {new Date(log.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <span className="text-gray-400 text-xs mt-1">Details</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="border-t border-gray-100 pt-4 mt-4 text-center">
            <Button
              variant="secondary"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Laden..." : `Mehr anzeigen (${logs.length} von ${total})`}
            </Button>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

function LogDetailModal({
  log,
  onClose,
}: {
  log: AuditLog;
  onClose: () => void;
}) {
  const entityLabel = ENTITY_LABELS[log.entity] || log.entity;
  const displayAction = getDisplayAction(log.action, log.oldValues, log.newValues);
  const actionLabel = ACTION_LABELS[displayAction as AuditAction] || displayAction;
  const actionIconPath = ACTION_ICON_PATHS[displayAction];
  const actionIconColor = ACTION_ICON_COLORS[displayAction] || "text-gray-500";
  const entityIconPath = ENTITY_ICON_PATHS[log.entity];

  // Compute changed fields
  const changedFields: {
    key: string;
    oldValue: unknown;
    newValue: unknown;
  }[] = [];

  const allKeys = new Set([
    ...Object.keys(log.oldValues || {}),
    ...Object.keys(log.newValues || {}),
  ]);

  for (const key of allKeys) {
    const oldVal = log.oldValues?.[key];
    const newVal = log.newValues?.[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changedFields.push({ key, oldValue: oldVal, newValue: newVal });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              {/* Entity Icon - hidden on mobile */}
              {entityIconPath && (
                <div className="hidden sm:block p-3 bg-gray-100 rounded-lg shrink-0">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={entityIconPath} />
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                  {entityLabel}
                  {log.entityName && `: ${log.entityName}`}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {actionIconPath && (
                    <svg className={`w-4 h-4 ${actionIconColor} inline -mt-0.5 mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={actionIconPath} />
                    </svg>
                  )}
                  <span className="capitalize">{actionLabel}</span> von{" "}
                  <span className="font-medium">{log.alias || "Unbekannt"}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(log.createdAt).toLocaleString("de-DE", {
              dateStyle: "full",
              timeStyle: "medium",
            })}
          </p>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {!log.success && log.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Fehlermeldung:</p>
              <p className="text-sm text-red-700 mt-1 break-words">{log.error}</p>
            </div>
          )}

          {changedFields.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Änderungen:
              </h3>
              {/* Mobile: Card layout */}
              <div className="sm:hidden space-y-3">
                {changedFields.map(({ key, oldValue, newValue }) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">{key}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Vorher</p>
                        <p className="text-gray-600 break-words">{formatValue(oldValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Nachher</p>
                        <p className="text-gray-900 break-words">{formatValue(newValue)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: Table layout */}
              <div className="hidden sm:block border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">
                        Feld
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">
                        Vorher
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">
                        Nachher
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {changedFields.map(({ key, oldValue, newValue }) => (
                      <tr key={key}>
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {key}
                        </td>
                        <td className="px-4 py-2 text-gray-500 break-words max-w-[200px]">
                          {formatValue(oldValue)}
                        </td>
                        <td className="px-4 py-2 text-gray-900 break-words max-w-[200px]">
                          {formatValue(newValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Keine Details verfügbar.
            </p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
