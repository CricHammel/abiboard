import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { StudentQuoteDetail } from "@/components/student-quotes/StudentQuoteDetail";
import { Alert } from "@/components/ui/Alert";
import { isDeadlinePassed } from "@/lib/deadline";

export default async function StudentQuoteDetailRoute({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { studentId } = await params;

  // Check if trying to view own quotes
  const currentStudent = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (currentStudent?.id === studentId) {
    redirect("/zitate/schueler");
  }

  const student = await prisma.student.findFirst({
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
      <StudentQuoteDetail
        student={student}
        initialQuotes={quotesWithOwnership}
        deadlinePassed={deadlinePassed}
      />
    </>
  );
}
