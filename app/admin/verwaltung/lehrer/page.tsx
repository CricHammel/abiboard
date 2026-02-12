import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TeacherManagement } from "@/components/admin/teachers/TeacherManagement";

export const metadata: Metadata = { title: "Lehrerverwaltung" };
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
        <p className="text-gray-600">
          Verwalte alle Lehrer für die Rankings.
        </p>
        <div className="flex gap-2">
          <Link href="/admin/verwaltung/lehrer/import">
            <Button variant="secondary">CSV Import</Button>
          </Link>
        </div>
      </div>

      <Card>
        <TeacherManagement initialTeachers={teachers} />
      </Card>
    </div>
  );
}
