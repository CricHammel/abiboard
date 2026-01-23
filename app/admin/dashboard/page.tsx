import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session) {
    return null;
  }

  // Fetch statistics
  const [totalStudents, totalProfiles, pendingProfiles, approvedProfiles] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", student: { isNot: null } } }),
      prisma.profile.count(),
      prisma.profile.count({ where: { status: "SUBMITTED" } }),
      prisma.profile.count({ where: { status: "APPROVED" } }),
    ]);

  // Fetch recent submissions
  const recentSubmissions = await prisma.profile.findMany({
    where: { status: "SUBMITTED" },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Übersicht und Verwaltung aller Abibuch-Inhalte
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Schüler gesamt
          </h3>
          <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Profile erstellt
          </h3>
          <p className="text-3xl font-bold text-gray-900">{totalProfiles}</p>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Zur Prüfung
          </h3>
          <p className="text-3xl font-bold text-blue-600">{pendingProfiles}</p>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Genehmigt
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {approvedProfiles}
          </p>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Aktuelle Einreichungen
          </h2>
          <Link href="/admin/steckbriefe">
            <Button variant="secondary">Alle anzeigen</Button>
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>Keine eingereichten Profile zur Prüfung</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSubmissions.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {profile.user.firstName} {profile.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{profile.user.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                    Eingereicht
                  </span>
                  <Link href={`/admin/steckbriefe/${profile.id}`}>
                    <Button variant="primary" className="!py-2 !px-4">
                      Prüfen
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Schnellaktionen
          </h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin/steckbriefe"
                className="text-primary hover:underline"
              >
                → Steckbriefe prüfen
              </Link>
            </li>
            <li>
              <Link
                href="/admin/benutzer"
                className="text-primary hover:underline"
              >
                → Benutzer verwalten
              </Link>
            </li>
            <li>
              <Link
                href="/admin/einstellungen"
                className="text-primary hover:underline"
              >
                → Einstellungen anpassen
              </Link>
            </li>
          </ul>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fortschritt
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Profile erstellt</span>
                <span className="font-medium">
                  {totalProfiles}/{totalStudents}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      totalStudents > 0
                        ? (totalProfiles / totalStudents) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Profile genehmigt</span>
                <span className="font-medium">
                  {approvedProfiles}/{totalProfiles}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      totalProfiles > 0
                        ? (approvedProfiles / totalProfiles) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
