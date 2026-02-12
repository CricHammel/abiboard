import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ParticipationSection } from "@/components/ui/ParticipationSection";
import { ZitateOverview } from "@/components/admin/zitate/ZitateOverview";

export default async function AdminZitatePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  // Get all active students with their user and quote counts
  const allStudents = await prisma.student.findMany({
    where: { active: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          _count: {
            select: { teacherQuotes: true, studentQuotes: true },
          },
        },
      },
      _count: {
        select: { quotesAbout: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const teachers = await prisma.teacher.findMany({
    where: { active: true },
    select: {
      id: true,
      salutation: true,
      firstName: true,
      lastName: true,
      subject: true,
      _count: {
        select: { teacherQuotes: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  // Calculate participation: students who have written at least 1 quote
  const registeredStudents = allStudents.filter((s) => s.user);
  const contributed = registeredStudents.filter(
    (s) => (s.user!._count.teacherQuotes + s.user!._count.studentQuotes) > 0
  );
  const notContributed = registeredStudents.filter(
    (s) => (s.user!._count.teacherQuotes + s.user!._count.studentQuotes) === 0
  );

  const contributedList = contributed.map((s) => ({
    id: s.id,
    firstName: s.user!.firstName,
    lastName: s.user!.lastName,
  }));
  const notContributedList = notContributed.map((s) => ({
    id: s.id,
    firstName: s.user!.firstName,
    lastName: s.user!.lastName,
  }));

  // Quote list data for browse section
  const studentQuoteListData = allStudents.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    _count: { quotesAbout: s._count.quotesAbout },
  }));

  return (
    <div className="space-y-6">
      <StatsGrid
        items={[
          { label: "Schüler gesamt", value: registeredStudents.length },
          { label: "Beigetragen", value: contributed.length, color: "green" },
          { label: "Noch nichts", value: notContributed.length, color: "amber" },
        ]}
      />

      <ProgressBar
        value={contributed.length}
        max={registeredStudents.length}
        label="Beteiligung"
        color="green"
      />

      <ParticipationSection
        groups={[
          { label: "Beigetragen", color: "green", items: contributedList },
          { label: "Noch keine Zitate", color: "amber", items: notContributedList },
        ]}
      />

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Zitate durchsuchen
        </h2>
        <ZitateOverview
          students={studentQuoteListData}
          teachers={teachers}
        />
      </div>
    </div>
  );
}
