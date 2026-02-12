import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TeacherQuoteAdminDetail } from "@/components/admin/teacher-quotes/TeacherQuoteAdminDetail";
import { formatTeacherName } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}): Promise<Metadata> {
  const { teacherId } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { salutation: true, firstName: true, lastName: true, subject: true },
  });
  return { title: teacher ? `Zitate von ${formatTeacherName(teacher, { includeSubject: false })}` : "Lehrerzitate" };
}

export default async function AdminTeacherQuoteDetailRoute({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const { teacherId } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId, active: true },
    select: {
      id: true,
      salutation: true,
      firstName: true,
      lastName: true,
      subject: true,
    },
  });

  if (!teacher) {
    notFound();
  }

  const quotes = await prisma.teacherQuote.findMany({
    where: { teacherId },
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
    <TeacherQuoteAdminDetail
      teacher={teacher}
      initialQuotes={serializedQuotes}
    />
  );
}
