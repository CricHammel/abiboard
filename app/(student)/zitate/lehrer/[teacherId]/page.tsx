import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TeacherQuoteDetail } from "@/components/teacher-quotes/TeacherQuoteDetail";
import { Alert } from "@/components/ui/Alert";
import { isDeadlinePassed } from "@/lib/deadline";

export default async function TeacherQuoteDetailRoute({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/dashboard");
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
      userId: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const quotesWithOwnership = quotes.map((quote) => ({
    id: quote.id,
    text: quote.text,
    createdAt: quote.createdAt.toISOString(),
    isOwn: quote.userId === session.user.id,
  }));

  const deadlinePassed = await isDeadlinePassed();

  return (
    <>
      {deadlinePassed && (
        <div className="mb-6">
          <Alert variant="info">
            Die Abgabefrist ist abgelaufen. Inhalte können nicht mehr bearbeitet werden.
          </Alert>
        </div>
      )}
      <TeacherQuoteDetail
        teacher={teacher}
        initialQuotes={quotesWithOwnership}
        deadlinePassed={deadlinePassed}
      />
    </>
  );
}
