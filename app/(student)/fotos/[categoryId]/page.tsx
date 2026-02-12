import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PhotoCategoryDetail } from "@/components/photos/PhotoCategoryDetail";
import { Alert } from "@/components/ui/Alert";
import { isDeadlinePassed } from "@/lib/deadline";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const category = await prisma.photoCategory.findUnique({
    where: { id: categoryId },
    select: { name: true },
  });
  return { title: category?.name ?? "Fotos" };
}

export default async function PhotoCategoryDetailRoute({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { categoryId } = await params;

  const category = await prisma.photoCategory.findUnique({
    where: { id: categoryId, active: true },
    select: {
      id: true,
      name: true,
      description: true,
      maxPerUser: true,
    },
  });

  if (!category) {
    notFound();
  }

  const photos = await prisma.photo.findMany({
    where: { categoryId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      imageUrl: true,
      createdAt: true,
      userId: true,
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  const photosWithOwnership = photos.map((photo) => {
    const isOwn = photo.userId === session.user.id;
    return {
      id: photo.id,
      imageUrl: photo.imageUrl,
      createdAt: photo.createdAt.toISOString(),
      isOwn,
      user: isOwn ? photo.user : undefined,
    };
  });

  const userPhotoCount = photos.filter(
    (p) => p.userId === session.user.id
  ).length;

  const deadlinePassed = await isDeadlinePassed();

  return (
    <>
      {deadlinePassed && (
        <div className="mb-6">
          <Alert variant="info">
            Die Abgabefrist ist abgelaufen. Inhalte können nicht mehr bearbeitet
            werden.
          </Alert>
        </div>
      )}
      <PhotoCategoryDetail
        category={category}
        initialPhotos={photosWithOwnership}
        userPhotoCount={userPhotoCount}
        deadlinePassed={deadlinePassed}
      />
    </>
  );
}
