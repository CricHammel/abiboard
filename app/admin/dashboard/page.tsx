import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CollapsibleList } from "@/components/dashboard/CollapsibleList";
import { prisma } from "@/lib/prisma";

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
    const teacherName = `${q.teacher.salutation === "HERR" ? "Herr" : "Frau"} ${q.teacher.lastName}`;
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
        ? `${c.targetTeacher.salutation === "HERR" ? "Herr" : "Frau"} ${c.targetTeacher.lastName}`
        : "unbekannt";
    activities.push({
      id: `comment-${c.id}`,
      type: "kommentar",
      text: `${c.author.firstName} ${c.author.lastName} hat einen Kommentar über ${targetName} geschrieben`,
      timestamp: c.createdAt,
    });
  }

  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const recentActivities = activities.slice(0, 10);

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

      {/* Activity Feed */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Letzte Aktivitäten
        </h2>

        {recentActivities.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            Noch keine Aktivitäten vorhanden.
          </p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 py-2"
              >
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
      </Card>
    </div>
  );
}
