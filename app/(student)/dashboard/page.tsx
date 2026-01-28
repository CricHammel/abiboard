import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type AreaStatus = "done" | "in_progress" | "not_started";

const statusStyles: Record<AreaStatus, { dot: string; text: string }> = {
  done: { dot: "bg-green-500", text: "text-green-600" },
  in_progress: { dot: "bg-amber-500", text: "text-amber-600" },
  not_started: { dot: "bg-gray-300", text: "text-gray-400" },
};

export default async function StudentDashboard() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const userId = session.user.id;

  const [
    profile,
    rankingSubmission,
    rankingVoteCount,
    totalSurveyQuestions,
    surveyAnswerCount,
    teacherQuoteCount,
    studentQuoteCount,
    commentCount,
  ] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.rankingSubmission.findUnique({ where: { userId } }),
    prisma.rankingVote.count({ where: { voterId: userId } }),
    prisma.surveyQuestion.count({ where: { active: true } }),
    prisma.surveyAnswer.count({ where: { userId } }),
    prisma.teacherQuote.count({ where: { userId } }),
    prisma.studentQuote.count({ where: { userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
  ]);

  // Status logic
  const steckbriefStatus: AreaStatus =
    profile?.status === "SUBMITTED" ? "done" : "in_progress";

  const rankingStatus: AreaStatus =
    rankingSubmission?.status === "SUBMITTED"
      ? "done"
      : rankingVoteCount > 0
        ? "in_progress"
        : "not_started";

  const umfragenStatus: AreaStatus =
    totalSurveyQuestions > 0 && surveyAnswerCount >= totalSurveyQuestions
      ? "done"
      : surveyAnswerCount > 0
        ? "in_progress"
        : "not_started";

  const totalQuotes = teacherQuoteCount + studentQuoteCount;
  const zitateStatus: AreaStatus = totalQuotes > 0 ? "done" : "not_started";

  const kommentareStatus: AreaStatus = commentCount > 0 ? "done" : "not_started";

  const completedAreas = [
    steckbriefStatus,
    rankingStatus,
    umfragenStatus,
    zitateStatus,
    kommentareStatus,
  ].filter((s) => s === "done").length;

  const areas = [
    {
      name: "Steckbrief",
      status: steckbriefStatus,
      href: "/steckbrief",
      linkText: "Bearbeiten",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      progress:
        profile?.status === "SUBMITTED"
          ? "Eingereicht"
          : "Entwurf",
      hint:
        profile?.status === "SUBMITTED"
          ? "Dein Steckbrief ist eingereicht."
          : "Vervollständige deinen Steckbrief und reiche ihn ein.",
    },
    {
      name: "Rankings",
      status: rankingStatus,
      href: "/rankings",
      linkText: "Abstimmen",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      ),
      progress:
        rankingSubmission?.status === "SUBMITTED"
          ? "Eingereicht"
          : rankingVoteCount > 0
            ? `${rankingVoteCount} Stimmen abgegeben`
            : "Noch nicht begonnen",
      hint:
        rankingSubmission?.status === "SUBMITTED"
          ? "Deine Stimmen sind eingereicht."
          : rankingVoteCount > 0
            ? "Stimme ab und reiche deine Antworten ein."
            : "Du hast noch nicht abgestimmt.",
    },
    {
      name: "Umfragen",
      status: umfragenStatus,
      href: "/umfragen",
      linkText: "Beantworten",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      progress:
        totalSurveyQuestions > 0
          ? `${surveyAnswerCount}/${totalSurveyQuestions} Fragen beantwortet`
          : "Keine Umfragen vorhanden",
      hint:
        totalSurveyQuestions > 0 && surveyAnswerCount >= totalSurveyQuestions
          ? "Alle Umfragen beantwortet!"
          : surveyAnswerCount > 0
            ? `Noch ${totalSurveyQuestions - surveyAnswerCount} Fragen offen.`
            : "Beantworte die Umfragen für das Abibuch.",
    },
    {
      name: "Zitate",
      status: zitateStatus,
      href: "/zitate/lehrer",
      linkText: "Zitate sammeln",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      progress:
        totalQuotes > 0
          ? `${totalQuotes} Zitate gesammelt`
          : "Noch keine Zitate",
      hint:
        totalQuotes > 0
          ? `${teacherQuoteCount} Lehrer-Zitate, ${studentQuoteCount} Schüler-Zitate.`
          : "Sammle Zitate von Mitschülern und Lehrern.",
    },
    {
      name: "Kommentare",
      status: kommentareStatus,
      href: "/kommentare",
      linkText: "Kommentare schreiben",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      progress:
        commentCount > 0
          ? `${commentCount} Kommentare geschrieben`
          : "Noch keine Kommentare",
      hint:
        commentCount > 0
          ? "Schreibe weitere Kommentare für das Abibuch."
          : "Schreibe Kommentare über Mitschüler und Lehrer.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Willkommen, {session.user.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Dein Abibuch-Fortschritt auf einen Blick.
        </p>
      </div>

      <Card>
        <ProgressBar
          value={completedAreas}
          max={5}
          label="Gesamtfortschritt"
          color={completedAreas === 5 ? "green" : "primary"}
        />
        <p className="text-sm text-gray-500 mt-2">
          {completedAreas === 5
            ? "Alles erledigt!"
            : `${5 - completedAreas} ${5 - completedAreas === 1 ? "Bereich" : "Bereiche"} noch offen`}
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map((area) => (
          <Link key={area.name} href={area.href} className="block">
            <Card className="h-full hover:border-gray-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={statusStyles[area.status].text}>
                    {area.icon}
                  </span>
                  <h3 className="font-semibold text-gray-900">{area.name}</h3>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 ${statusStyles[area.status].dot}`}
                />
              </div>

              <p className="text-sm font-medium text-gray-900 mb-1">
                {area.progress}
              </p>
              <p className="text-sm text-gray-500">{area.hint}</p>

              <div className="mt-4">
                <span className="text-sm font-medium text-primary">
                  {area.linkText} &rarr;
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
