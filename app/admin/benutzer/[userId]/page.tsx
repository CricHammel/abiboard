import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { EditUserClient } from "./EditUserClient";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      active: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/benutzer"
          className="text-primary hover:underline text-sm mb-2 inline-block"
        >
          ← Zurück zur Benutzerverwaltung
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Benutzer bearbeiten</h1>
        <p className="text-gray-600 mt-2">
          Bearbeite die Daten von {user.firstName} {user.lastName}.
        </p>
      </div>

      <Card>
        <EditUserClient user={user} />
      </Card>
    </div>
  );
}
