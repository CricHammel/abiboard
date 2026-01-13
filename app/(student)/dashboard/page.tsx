import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function StudentDashboard() {
  const session = await auth();

  if (!session) {
    return null;
  }

  // Fetch user's profile
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  const statusLabels = {
    DRAFT: "Entwurf",
    SUBMITTED: "Eingereicht",
    APPROVED: "Genehmigt",
  };

  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Willkommen, {session.user.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Verwalte deinen Abibuch-Steckbrief und reiche ihn zur Prüfung ein.
        </p>
      </div>

      {profile && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Steckbrief-Status
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Aktueller Status:</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[profile.status]
                }`}
              >
                {statusLabels[profile.status]}
              </span>
            </div>
            <Link href="/steckbrief">
              <Button variant="primary">Steckbrief bearbeiten</Button>
            </Link>
          </div>

          {profile.status === "DRAFT" && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Dein Steckbrief ist noch im Entwurf. Vervollständige es und reiche
                es zur Prüfung ein.
              </p>
            </div>
          )}

          {profile.status === "SUBMITTED" && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Dein Steckbrief wurde eingereicht und wird gerade geprüft. Du wirst
                benachrichtigt, sobald es genehmigt wurde.
              </p>
            </div>
          )}

          {profile.status === "APPROVED" && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Dein Steckbrief wurde genehmigt! Es wird im Abibuch erscheinen.
              </p>
            </div>
          )}

          {profile.feedback && profile.status === "DRAFT" && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-1">
                Feedback vom Abi-Komitee:
              </p>
              <p className="text-sm text-red-700">{profile.feedback}</p>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Schnellaktionen
          </h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/steckbrief"
                className="text-primary hover:underline"
              >
                → Steckbrief bearbeiten
              </Link>
            </li>
            <li>
              <Link
                href="/einstellungen"
                className="text-primary hover:underline"
              >
                → Einstellungen anpassen
              </Link>
            </li>
          </ul>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nächste Schritte
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {profile?.status === "DRAFT" && (
              <>
                <li>✓ Steckbrief vervollständigen</li>
                <li>✓ Zur Prüfung einreichen</li>
                <li>⏳ Auf Genehmigung warten</li>
              </>
            )}
            {profile?.status === "SUBMITTED" && (
              <>
                <li className="line-through">Steckbrief vervollständigen</li>
                <li className="line-through">Zur Prüfung einreichen</li>
                <li>⏳ Auf Genehmigung warten</li>
              </>
            )}
            {profile?.status === "APPROVED" && (
              <>
                <li className="line-through">Steckbrief vervollständigen</li>
                <li className="line-through">Zur Prüfung einreichen</li>
                <li className="line-through">Auf Genehmigung warten</li>
                <li className="text-green-600">✓ Fertig!</li>
              </>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
