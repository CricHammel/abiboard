import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StudentQuoteList } from "@/components/student-quotes/StudentQuoteList";

export default async function AdminSchuelerzitateRoute() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const students = await prisma.student.findMany({
    where: {
      active: true,
      NOT: { userId: null }, // Only registered students
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

  return <StudentQuoteList students={students} basePath="/admin/zitate/schueler" />;
}
