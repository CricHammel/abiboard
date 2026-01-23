import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RankingsPage } from "@/components/rankings/RankingsPage";

export default async function RankingsRoute() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const [questions, votes, submission, students, teachers] = await Promise.all([
    prisma.rankingQuestion.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.rankingVote.findMany({
      where: { voterId: session.user.id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, gender: true } },
        teacher: { select: { id: true, salutation: true, firstName: true, lastName: true, subject: true } },
      },
    }),
    prisma.rankingSubmission.findFirst({
      where: { userId: session.user.id },
    }),
    prisma.student.findMany({
      where: { active: true },
      select: { id: true, firstName: true, lastName: true, gender: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.teacher.findMany({
      where: { active: true },
      select: { id: true, salutation: true, firstName: true, lastName: true, subject: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  return (
    <RankingsPage
      initialData={{
        questions,
        votes,
        submission: submission || { status: "DRAFT" },
        students,
        teachers,
      }}
    />
  );
}
