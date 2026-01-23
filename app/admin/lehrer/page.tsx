import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TeacherManagement } from "@/components/admin/teachers/TeacherManagement";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeachersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const teachers = await prisma.teacher.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lehrerverwaltung</h1>
          <p className="text-gray-600 mt-2">
            Verwalte alle Lehrer für die Rankings.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/lehrer/import">
            <Button variant="secondary" className="!w-auto">CSV Import</Button>
          </Link>
        </div>
      </div>

      <Card>
        <TeacherManagement initialTeachers={teachers} />
      </Card>
    </div>
  );
}
