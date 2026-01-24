import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TeacherQuoteList } from "@/components/teacher-quotes/TeacherQuoteList";

export default async function AdminLehrerzitateRoute() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const teachers = await prisma.teacher.findMany({
    where: { active: true },
    select: {
      id: true,
      salutation: true,
      firstName: true,
      lastName: true,
      subject: true,
      _count: {
        select: { teacherQuotes: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Lehrerzitate</h1>
      <TeacherQuoteList teachers={teachers} basePath="/admin/lehrerzitate" />
    </div>
  );
}
