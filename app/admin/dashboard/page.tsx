import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Dashboard" };
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CollapsibleList } from "@/components/dashboard/CollapsibleList";
import { StudentActivityFeed } from "@/components/dashboard/StudentActivityFeed";
import { prisma } from "@/lib/prisma";
import { getStudentActivityText } from "@/lib/student-activity";
import { ENTITY_LABELS, ACTION_LABELS, AuditAction, getDisplayAction, ENTITY_ICON_PATHS, ACTION_ICON_PATHS, ACTION_ICON_COLORS } from "@/lib/audit-log";
import Link from "next/link";

function relativeTime(date: Date): string {
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

export default async function AdminDashboard() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const studentFilter = { role: "STUDENT" as const, active: true, student: { isNot: null } };

  const [
    totalRegistered,
    totalWhitelisted,
    submittedProfiles,
    rankingSubmittedCount,
    steckbriefNotSubmittedUsers,
    rankingNotSubmittedUsers,
    totalSurveyQuestions,
    surveyAnswerGroups,
    totalTeacherQuotes,
    totalStudentQuotes,
    totalComments,
    recentStudentActivities,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count({ where: studentFilter }),
    prisma.student.count({ where: { active: true } }),
    prisma.profile.count({ where: { status: "SUBMITTED" } }),
    prisma.rankingSubmission.count({ where: { status: "SUBMITTED" } }),

    prisma.user.findMany({
      where: {
        ...studentFilter,
        OR: [
          { profile: null },
          { profile: { status: "DRAFT" } },
        ],
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),

    prisma.user.findMany({
      where: {
        ...studentFilter,
        OR: [
          { rankingSubmission: null },
          { rankingSubmission: { status: "DRAFT" } },
        ],
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),

    prisma.surveyQuestion.count({ where: { active: true } }),
    prisma.surveyAnswer.groupBy({
      by: ["userId"],
      _count: { questionId: true },
    }),

    prisma.teacherQuote.count(),
    prisma.studentQuote.count(),
    prisma.comment.count(),

    prisma.studentActivity.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.auditLog.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const surveyCompleteCount = surveyAnswerGroups.filter(
    (g) => g._count.questionId >= totalSurveyQuestions && totalSurveyQuestions > 0
  ).length;

  // Build activity feed from StudentActivity table
  const recentActivities = recentStudentActivities.map((a) => ({
    id: a.id,
    entity: a.entity,
    action: a.action,
    text: `${a.user.firstName} ${a.user.lastName} ${getStudentActivityText(a.action, a.entity, a.entityName, a.count)}`,
    timestamp: a.updatedAt.toISOString(),
  }));

  const totalQuotes = totalTeacherQuotes + totalStudentQuotes;

  const stats = [
    {
      label: "Registriert",
      value: totalRegistered,
      sub: `von ${totalWhitelisted}`,
      color: "text-gray-900",
    },
    {
      label: "Steckbriefe",
      value: submittedProfiles,
      sub: `von ${totalRegistered} eingereicht`,
      color: submittedProfiles === totalRegistered && totalRegistered > 0 ? "text-green-600" : "text-gray-900",
    },
    {
      label: "Rankings",
      value: rankingSubmittedCount,
      sub: `von ${totalRegistered} eingereicht`,
      color: rankingSubmittedCount === totalRegistered && totalRegistered > 0 ? "text-green-600" : "text-gray-900",
    },
    {
      label: "Umfragen",
      value: surveyCompleteCount,
      sub: `von ${totalRegistered} komplett`,
      color: surveyCompleteCount === totalRegistered && totalRegistered > 0 ? "text-green-600" : "text-gray-900",
    },
    {
      label: "Zitate",
      value: totalQuotes,
      sub: `${totalTeacherQuotes} Lehrer, ${totalStudentQuotes} Schüler`,
      color: "text-gray-900",
    },
    {
      label: "Kommentare",
      value: totalComments,
      sub: "gesamt",
      color: "text-gray-900",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Übersicht und Verwaltung aller Abibuch-Inhalte
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {stat.label}
            </h3>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
          </Card>
        ))}
      </div>

      {/* Progress Section */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Fortschritt
        </h2>
        <div className="space-y-5">
          <div>
            <ProgressBar
              value={submittedProfiles}
              max={totalRegistered}
              label="Steckbrief-Einreichungen"
              color={submittedProfiles === totalRegistered && totalRegistered > 0 ? "green" : "primary"}
            />
            <div className="mt-2">
              <CollapsibleList
                title="Nicht eingereicht"
                count={steckbriefNotSubmittedUsers.length}
                items={steckbriefNotSubmittedUsers.map((u) => ({
                  id: u.id,
                  name: `${u.firstName} ${u.lastName}`,
                }))}
                emptyText="Alle Steckbriefe eingereicht!"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <ProgressBar
              value={rankingSubmittedCount}
              max={totalRegistered}
              label="Ranking-Einreichungen"
              color={rankingSubmittedCount === totalRegistered && totalRegistered > 0 ? "green" : "primary"}
            />
            <div className="mt-2">
              <CollapsibleList
                title="Nicht eingereicht"
                count={rankingNotSubmittedUsers.length}
                items={rankingNotSubmittedUsers.map((u) => ({
                  id: u.id,
                  name: `${u.firstName} ${u.lastName}`,
                }))}
                emptyText="Alle Rankings eingereicht!"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <ProgressBar
              value={surveyCompleteCount}
              max={totalRegistered}
              label="Umfragen-Teilnahme"
              color={surveyCompleteCount === totalRegistered && totalRegistered > 0 ? "green" : "primary"}
            />
          </div>
        </div>
      </Card>

      {/* Student Activity Feed */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Schüler-Aktivitäten
          </h2>
          <Link
            href="/admin/schueler-aktivitaeten"
            className="text-sm text-primary hover:text-primary-dark"
          >
            Alle anzeigen
          </Link>
        </div>
        <StudentActivityFeed activities={recentActivities} />
      </Card>

      {/* Admin Activity Log */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Admin-Aktivitäten
          </h2>
          <Link
            href="/admin/aktivitaeten"
            className="text-sm text-primary hover:text-primary-dark"
          >
            Alle anzeigen
          </Link>
        </div>

        {recentAuditLogs.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            Noch keine Admin-Aktivitäten vorhanden.
          </p>
        ) : (
          <div className="space-y-2">
            {recentAuditLogs.map((log) => {
              const entityLabel = ENTITY_LABELS[log.entity] || log.entity;
              const displayAction = getDisplayAction(
                log.action,
                log.oldValues as Record<string, unknown> | null,
                log.newValues as Record<string, unknown> | null
              );
              const actionLabel = ACTION_LABELS[displayAction as AuditAction] || displayAction;
              const isError = !log.success;
              const isGrouped = log.count > 1;

              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 py-2 px-2 rounded ${
                    isError ? "bg-red-50" : ""
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
                    <p className={`text-sm ${isError ? "text-red-700" : "text-gray-900"}`}>
                      <span className="font-medium">{log.alias || "—"}</span>
                      {" | "}
                      <span>
                        {ENTITY_ICON_PATHS[log.entity] && (
                          <svg className="w-3.5 h-3.5 text-gray-400 inline -mt-0.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ENTITY_ICON_PATHS[log.entity]} />
                          </svg>
                        )}
                        {entityLabel}
                      </span>
                      {log.entityName && `: ${log.entityName}`}
                      {" "}
                      {isGrouped ? `${log.count}× ` : ""}{actionLabel}
                      {isError && log.error && (
                        <span className="text-red-600"> — {log.error}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isGrouped ? (
                        <>
                          {relativeTime(log.updatedAt)}
                          {" bis "}
                          {relativeTime(log.createdAt)}
                        </>
                      ) : (
                        relativeTime(log.createdAt)
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
