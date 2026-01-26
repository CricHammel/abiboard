import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { StudentQuoteAdminDetail } from "@/components/admin/student-quotes/StudentQuoteAdminDetail";

export default async function AdminStudentQuoteDetailRoute({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const { studentId } = await params;

  const student = await prisma.student.findUnique({
    where: { id: studentId, active: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!student) {
    notFound();
  }

  const quotes = await prisma.studentQuote.findMany({
    where: { studentId },
    select: {
      id: true,
      text: true,
      createdAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedQuotes = quotes.map((q) => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
  }));

  return (
    <StudentQuoteAdminDetail
      student={student}
      initialQuotes={serializedQuotes}
    />
  );
}
