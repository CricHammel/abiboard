import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPhotoOverview } from "@/components/admin/photos/AdminPhotoOverview";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Fotogalerie" };

export default async function FotosGaleriePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
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
        select: { imageUrl: true },
      },
    },
  });

  const serializedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    coverImageUrl: cat.coverImageUrl,
    photoCount: cat._count.photos,
    firstPhotoUrl: cat.photos[0]?.imageUrl ?? null,
  }));

  return (
    <div className="space-y-6">
      <AdminPhotoOverview categories={serializedCategories} />
    </div>
  );
}
