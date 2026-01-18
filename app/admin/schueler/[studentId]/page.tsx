import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { EditStudentClient } from "./EditStudentClient";

export default async function EditStudentPage({
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
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      active: true,
      userId: true,
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
          &larr; Zur&uuml;ck zur Sch&uuml;lerliste
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Sch&uuml;ler bearbeiten</h1>
        <p className="text-gray-600 mt-2">
          Bearbeite die Daten von {student.firstName} {student.lastName}.
        </p>
      </div>

      <Card>
        <EditStudentClient student={student} />
      </Card>
    </div>
  );
}
