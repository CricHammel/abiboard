import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StudentQuoteList } from "@/components/student-quotes/StudentQuoteList";

export const metadata: Metadata = { title: "Schülerzitate" };

export default async function SchuelerzitateRoute() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Get the current user's student record to exclude self
  const currentStudent = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const students = await prisma.student.findMany({
    where: {
      active: true,
      ...(currentStudent ? { NOT: { id: currentStudent.id } } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      _count: {
        select: { quotesAbout: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return <StudentQuoteList students={students} basePath="/zitate/schueler" />;
}
