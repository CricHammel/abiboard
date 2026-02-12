import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Einstellungen" };
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
        <p className="text-gray-600 mt-2">
          Verwalte deine Sicherheitseinstellungen.
        </p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Persönliche Daten
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-gray-900">{session.user.firstName} {session.user.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">E-Mail</p>
            <p className="text-gray-900">{session.user.email}</p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Name und E-Mail werden aus der Schülerliste übernommen und können nicht geändert werden.
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Passwort ändern
        </h2>
        <PasswordChangeForm />
      </Card>
    </div>
  );
}
