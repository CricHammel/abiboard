import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { PhotoCategoryManagement } from "@/components/admin/photos/PhotoCategoryManagement";
import { redirect } from "next/navigation";

export default async function FotosRubrikenPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const categories = await prisma.photoCategory.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      coverImageUrl: true,
      maxPerUser: true,
      order: true,
      active: true,
      _count: {
        select: { photos: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Verwalte die Foto-Rubriken. Schüler können in jede aktive Rubrik Fotos hochladen.
      </p>

      <Card>
        <PhotoCategoryManagement initialCategories={categories} />
      </Card>
    </div>
  );
}
