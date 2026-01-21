import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StudentManagement } from "@/components/admin/StudentManagement";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StudentsPage() {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schülerverwaltung</h1>
          <p className="text-gray-600 mt-2">
            Verwalte alle Schüler und deren Registrierungen.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/schueler/import">
            <Button variant="secondary" className="!w-auto">CSV Import</Button>
          </Link>
          <Link href="/admin/schueler/neu">
            <Button variant="primary" className="!w-auto">Neuer Schüler</Button>
          </Link>
        </div>
      </div>

      <Card>
        <StudentManagement students={students} />
      </Card>
    </div>
  );
}
