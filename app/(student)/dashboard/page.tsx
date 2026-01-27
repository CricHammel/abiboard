import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SteckbriefStatusActions } from "@/components/steckbrief/SteckbriefStatusActions";

export default async function StudentDashboard() {
  const session = await auth();

  if (!session) {
    return null;
  }

  // Fetch user's profile
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  const statusConfig = {
    DRAFT: { label: "Entwurf", variant: "draft" as const },
    SUBMITTED: { label: "Eingereicht", variant: "submitted" as const },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Willkommen, {session.user.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Verwalte deinen Abibuch-Steckbrief und reiche ihn ein, wenn er fertig ist.
        </p>
      </div>

      {profile && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Steckbrief-Status
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Aktueller Status:</p>
              <Badge variant={statusConfig[profile.status].variant}>
                {statusConfig[profile.status].label}
              </Badge>
            </div>
            <SteckbriefStatusActions status={profile.status} />
          </div>

          {profile.status === "DRAFT" && (
            <Alert variant="info" className="mt-4">
              Dein Steckbrief ist noch nicht eingereicht. Vervollständige ihn und
              reiche ihn ein.
            </Alert>
          )}

          {profile.status === "SUBMITTED" && (
            <Alert variant="success" className="mt-4">
              Dein Steckbrief ist eingereicht und wird ins Abibuch übernommen.
            </Alert>
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
                <li>1. Steckbrief vervollständigen</li>
                <li>2. Einreichen</li>
              </>
            )}
            {profile?.status === "SUBMITTED" && (
              <>
                <li className="line-through">Steckbrief vervollständigen</li>
                <li className="line-through">Einreichen</li>
                <li className="text-green-600 font-medium">Fertig!</li>
              </>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
