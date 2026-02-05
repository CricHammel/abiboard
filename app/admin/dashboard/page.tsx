import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CollapsibleList } from "@/components/dashboard/CollapsibleList";
import { StudentActivityFeed } from "@/components/dashboard/StudentActivityFeed";
import { prisma } from "@/lib/prisma";
import { formatTeacherName } from "@/lib/format";
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

type ActivityItem = {
  id: string;
  type: "steckbrief" | "ranking" | "zitat" | "kommentar";
  text: string;
  timestamp: Date;
};

type AuditLogType = {
  id: string;
  alias: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  entityName: string | null;
  success: boolean;
  oldValues: unknown;
  newValues: unknown;
  error: string | null;
  createdAt: Date;
};

type GroupedAuditLog = {
  logs: AuditLogType[];
  count: number;
  firstLog: AuditLogType;
  lastLog: AuditLogType;
};

function groupConsecutiveAuditLogs(logs: AuditLogType[]): GroupedAuditLog[] {
  if (logs.length === 0) return [];

  const groups: GroupedAuditLog[] = [];
  let currentGroup: AuditLogType[] = [logs[0]];

  for (let i = 1; i < logs.length; i++) {
    const current = logs[i];
    const prev = logs[i - 1];

    const shouldGroup =
      current.alias === prev.alias &&
      current.action === prev.action &&
      current.entity === prev.entity &&
      current.success === prev.success &&
      !current.entityName &&
      !prev.entityName;

    if (shouldGroup) {
      currentGroup.push(current);
    } else {
      groups.push({
        logs: currentGroup,
        count: currentGroup.length,
        firstLog: currentGroup[0],
        lastLog: currentGroup[currentGroup.length - 1],
      });
      currentGroup = [current];
    }
  }

  groups.push({
    logs: currentGroup,
    count: currentGroup.length,
    firstLog: currentGroup[0],
    lastLog: currentGroup[currentGroup.length - 1],
  });

  return groups;
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
    recentProfiles,
    recentRankingSubs,
    recentTeacherQuotes,
    recentStudentQuotes,
    recentComments,
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

    prisma.profile.findMany({
      where: { status: "SUBMITTED" },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.rankingSubmission.findMany({
      where: { status: "SUBMITTED" },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    prisma.teacherQuote.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        teacher: { select: { lastName: true, salutation: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.studentQuote.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.comment.findMany({
      include: {
        author: { select: { firstName: true, lastName: true } },
        targetStudent: { select: { firstName: true, lastName: true } },
        targetTeacher: { select: { lastName: true, salutation: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const surveyCompleteCount = surveyAnswerGroups.filter(
    (g) => g._count.questionId >= totalSurveyQuestions && totalSurveyQuestions > 0
  ).length;

  // Build activity feed
  const activities: ActivityItem[] = [];

  for (const p of recentProfiles) {
    activities.push({
      id: `steckbrief-${p.id}`,
      type: "steckbrief",
      text: `${p.user.firstName} ${p.user.lastName} hat den Steckbrief eingereicht`,
      timestamp: p.updatedAt,
    });
  }

  for (const r of recentRankingSubs) {
    if (r.submittedAt) {
      activities.push({
        id: `ranking-${r.id}`,
        type: "ranking",
        text: `${r.user.firstName} ${r.user.lastName} hat die Rankings eingereicht`,
        timestamp: r.submittedAt,
      });
    }
  }

  for (const q of recentTeacherQuotes) {
    const teacherName = formatTeacherName(q.teacher, { includeSubject: false });
    activities.push({
      id: `tquote-${q.id}`,
      type: "zitat",
      text: `${q.user.firstName} ${q.user.lastName} hat ein Zitat über ${teacherName} hinzugefügt`,
      timestamp: q.createdAt,
    });
  }

  for (const q of recentStudentQuotes) {
    activities.push({
      id: `squote-${q.id}`,
      type: "zitat",
      text: `${q.user.firstName} ${q.user.lastName} hat ein Zitat über ${q.student.firstName} ${q.student.lastName} hinzugefügt`,
      timestamp: q.createdAt,
    });
  }

  for (const c of recentComments) {
    const targetName = c.targetStudent
      ? `${c.targetStudent.firstName} ${c.targetStudent.lastName}`
      : c.targetTeacher
        ? formatTeacherName(c.targetTeacher, { includeSubject: false })
        : "unbekannt";
    activities.push({
      id: `comment-${c.id}`,
      type: "kommentar",
      text: `${c.author.firstName} ${c.author.lastName} hat einen Kommentar über ${targetName} geschrieben`,
      timestamp: c.createdAt,
    });
  }

  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const recentActivities = activities.slice(0, 15);

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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Schüler-Aktivitäten
        </h2>
        <StudentActivityFeed
          activities={recentActivities.map((a) => ({
            ...a,
            timestamp: a.timestamp.toISOString(),
          }))}
        />
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
            {groupConsecutiveAuditLogs(recentAuditLogs).map((group) => {
              const log = group.firstLog;
              const entityLabel = ENTITY_LABELS[log.entity] || log.entity;
              const displayAction = getDisplayAction(
                log.action,
                log.oldValues as Record<string, unknown> | null,
                log.newValues as Record<string, unknown> | null
              );
              const actionLabel = ACTION_LABELS[displayAction as AuditAction] || displayAction;
              const isError = !log.success;
              const isGrouped = group.count > 1;

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
                      {isGrouped ? `${group.count}× ` : ""}{actionLabel}
                      {isError && log.error && (
                        <span className="text-red-600"> — {log.error}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {relativeTime(log.createdAt)}
                      {isGrouped && ` bis ${relativeTime(group.lastLog.createdAt)}`}
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
