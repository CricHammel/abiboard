import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommentPage } from "@/components/comments/CommentPage";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { isDeadlinePassed } from "@/lib/deadline";
import { formatTeacherName } from "@/lib/format";

export default async function KommentarePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Get current student for received comments lookup
  const currentStudent = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  // Get authors who wrote comments about the current student (no text!)
  const receivedComments = currentStudent
    ? await prisma.comment.findMany({
        where: { targetStudentId: currentStudent.id },
        select: {
          author: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const receivedFromAuthors = receivedComments.map((c) => c.author);

  // Get all comments written by this user
  const comments = await prisma.comment.findMany({
    where: { authorId: session.user.id },
    include: {
      targetStudent: {
        select: { id: true, firstName: true, lastName: true },
      },
      targetTeacher: {
        select: { id: true, salutation: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get all active students for autocomplete
  const allStudents = await prisma.student.findMany({
    where: { active: true },
    select: { id: true, firstName: true, lastName: true, gender: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  // Get all active teachers for autocomplete
  const allTeachers = await prisma.teacher.findMany({
    where: { active: true },
    select: { id: true, salutation: true, firstName: true, lastName: true, subject: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  // Transform comments to unified format
  const transformedComments = comments.map((comment) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    targetType: (comment.targetStudentId ? "STUDENT" : "TEACHER") as "STUDENT" | "TEACHER",
    targetId: comment.targetStudentId || comment.targetTeacherId,
    target: comment.targetStudent
      ? {
          id: comment.targetStudent.id,
          name: `${comment.targetStudent.firstName} ${comment.targetStudent.lastName}`,
        }
      : comment.targetTeacher
        ? {
            id: comment.targetTeacher.id,
            name: formatTeacherName(comment.targetTeacher, { shortForm: true, includeSubject: false }),
          }
        : null,
  }));

  const deadlinePassed = await isDeadlinePassed();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kommentare"
        description="Schreibe Kommentare über Mitschüler und Lehrer für das Abibuch."
      />
      {deadlinePassed && (
        <Alert variant="info">
          Die Abgabefrist ist abgelaufen. Inhalte können nicht mehr bearbeitet werden.
        </Alert>
      )}
      <CommentPage
        initialComments={transformedComments}
        allStudents={allStudents}
        allTeachers={allTeachers}
        currentUserId={session.user.id}
        deadlinePassed={deadlinePassed}
        receivedFromAuthors={receivedFromAuthors}
      />
    </div>
  );
}
