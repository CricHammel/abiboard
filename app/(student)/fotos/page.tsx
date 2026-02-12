import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Fotos" };
import { PhotoCategoryList } from "@/components/photos/PhotoCategoryList";
import { Alert } from "@/components/ui/Alert";
import { isDeadlinePassed } from "@/lib/deadline";

export default async function FotosStudentPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const categories = await prisma.photoCategory.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { photos: true },
      },
      photos: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { imageUrl: true, userId: true },
      },
    },
  });

  const userPhotoCounts = await prisma.photo.groupBy({
    by: ["categoryId"],
    where: {
      userId: session.user.id,
      category: { active: true },
    },
    _count: { id: true },
  });

  const userCountMap = new Map(
    userPhotoCounts.map((c) => [c.categoryId, c._count.id])
  );

  const serializedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    coverImageUrl: cat.coverImageUrl,
    photoCount: cat._count.photos,
    userPhotoCount: userCountMap.get(cat.id) ?? 0,
    firstPhotoUrl: cat.photos[0]?.imageUrl ?? null,
  }));

  const deadlinePassed = await isDeadlinePassed();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fotos</h1>
      {deadlinePassed && (
        <Alert variant="info">
          Die Abgabefrist ist abgelaufen. Inhalte können nicht mehr bearbeitet
          werden.
        </Alert>
      )}
      <PhotoCategoryList categories={serializedCategories} />
    </div>
  );
}
