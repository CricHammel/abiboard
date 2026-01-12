import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserManagement } from "@/components/admin/UserManagement";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  // Fetch all users with their profiles
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      profile: {
        select: {
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
          <p className="text-gray-600 mt-2">
            Verwalte alle Benutzer und erstelle neue Accounts.
          </p>
        </div>
        <Link href="/admin/benutzer/neu">
          <Button variant="primary">Neuer Benutzer</Button>
        </Link>
      </div>

      <Card>
        <UserManagement users={users} />
      </Card>
    </div>
  );
}
