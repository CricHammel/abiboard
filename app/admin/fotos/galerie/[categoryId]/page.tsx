import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AdminPhotoCategoryDetail } from "@/components/admin/photos/AdminPhotoCategoryDetail";

export default async function AdminPhotoCategoryDetailRoute({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const { categoryId } = await params;

  const category = await prisma.photoCategory.findUnique({
    where: { id: categoryId, active: true },
    select: {
      id: true,
      name: true,
      description: true,
      coverImageUrl: true,
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
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  const serializedPhotos = photos.map((photo) => ({
    id: photo.id,
    imageUrl: photo.imageUrl,
    createdAt: photo.createdAt.toISOString(),
    user: photo.user,
  }));

  return (
    <AdminPhotoCategoryDetail
      category={category}
      initialPhotos={serializedPhotos}
      backPath="/admin/fotos/galerie"
    />
  );
}
