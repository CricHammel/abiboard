import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommentAdminPage } from "@/components/admin/comments/CommentAdminPage";

export default async function AdminKommentarePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  // Get all comments with author and target info
  const comments = await prisma.comment.findMany({
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      targetStudent: {
        select: { id: true, firstName: true, lastName: true },
      },
      targetTeacher: {
        select: { id: true, salutation: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform to unified format
  const transformedComments = comments.map((comment) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      id: comment.author.id,
      firstName: comment.author.firstName,
      lastName: comment.author.lastName,
    },
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
            name: `${comment.targetTeacher.salutation === "HERR" ? "Hr." : "Fr."} ${comment.targetTeacher.lastName}`,
          }
        : null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Kommentare</h1>
      <CommentAdminPage initialComments={transformedComments} />
    </div>
  );
}
