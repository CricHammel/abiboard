import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StudentManagement } from "@/components/admin/StudentManagement";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SchuelerPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const students = await prisma.student.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          active: true,
          profile: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-gray-600">
          Verwalte alle Schüler und deren Registrierungen.
        </p>
        <div className="flex gap-2">
          <Link href="/admin/verwaltung/schueler/import">
            <Button variant="secondary" className="!w-auto">CSV Import</Button>
          </Link>
          <Link href="/admin/verwaltung/schueler/neu">
            <Button variant="primary" className="!w-auto">Neuer Schüler</Button>
          </Link>
        </div>
      </div>

      <Card>
        <StudentManagement students={students} basePath="/admin/verwaltung/schueler" />
      </Card>
    </div>
  );
}
