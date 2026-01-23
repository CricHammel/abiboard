import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { SteckbriefeOverview } from "@/components/admin/steckbriefe/SteckbriefeOverview";

export default async function SteckbriefeOverviewPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const students = await prisma.student.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profile: {
            select: { status: true, updatedAt: true },
          },
        },
      },
    },
  });

  const totalRegistered = students.filter((s) => s.user).length;
  const submittedCount = students.filter(
    (s) => s.user?.profile?.status === "SUBMITTED"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Steckbriefe</h1>
        <p className="text-gray-600 mt-2">
          Übersicht aller Steckbrief-Einreichungen.
        </p>
      </div>

      <Card>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Eingereicht</span>
          <span className="font-medium">
            {submittedCount}/{totalRegistered}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all"
            style={{
              width: `${
                totalRegistered > 0
                  ? (submittedCount / totalRegistered) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </Card>

      <Card>
        <SteckbriefeOverview students={students} />
      </Card>
    </div>
  );
}
