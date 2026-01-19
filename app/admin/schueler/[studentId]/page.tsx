import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { StudentDetailClient } from "./StudentDetailClient";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          active: true,
          createdAt: true,
          profile: {
            select: {
              status: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/schueler"
          className="text-primary hover:underline text-sm mb-2 inline-block"
        >
          ← Zurück zur Schülerverwaltung
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {student.firstName} {student.lastName}
        </h1>
        <p className="text-gray-600 mt-2">{student.email}</p>
      </div>

      <StudentDetailClient student={student} />
    </div>
  );
}
