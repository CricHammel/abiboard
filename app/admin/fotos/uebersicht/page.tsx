import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ParticipationSection } from "@/components/ui/ParticipationSection";
import { PhotoCategoryManagement } from "@/components/admin/photos/PhotoCategoryManagement";
import { redirect } from "next/navigation";

export default async function FotosUebersichtPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const studentFilter = { role: "STUDENT" as const, active: true, student: { isNot: null } };

  const [categories, allStudents, uploaderIds] = await Promise.all([
    prisma.photoCategory.findMany({
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
    }),
    prisma.user.findMany({
      where: studentFilter,
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.photo.groupBy({
      by: ["userId"],
    }),
  ]);

  const uploaderIdSet = new Set(uploaderIds.map((p) => p.userId));
  const uploaded = allStudents.filter((s) => uploaderIdSet.has(s.id));
  const notUploaded = allStudents.filter((s) => !uploaderIdSet.has(s.id));

  return (
    <div className="space-y-6">
      <StatsGrid
        items={[
          { label: "Schüler gesamt", value: allStudents.length },
          { label: "Hat hochgeladen", value: uploaded.length, color: "green" },
          { label: "Noch nichts", value: notUploaded.length, color: "amber" },
        ]}
      />

      <ProgressBar
        value={uploaded.length}
        max={allStudents.length}
        label="Beteiligung"
        color="green"
      />

      <ParticipationSection
        groups={[
          { label: "Hat hochgeladen", color: "green", items: uploaded },
          { label: "Noch keine Fotos", color: "amber", items: notUploaded },
        ]}
      />

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Rubriken verwalten
        </h2>
        <Card>
          <PhotoCategoryManagement initialCategories={categories} />
        </Card>
      </div>
    </div>
  );
}
