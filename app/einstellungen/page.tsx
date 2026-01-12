import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard"
          className="text-primary hover:underline text-sm mb-2 inline-block"
        >
          ← Zurück zum Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
        <p className="text-gray-600 mt-2">
          Verwalte deine persönlichen Daten und Sicherheitseinstellungen.
        </p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Persönliche Daten
        </h2>
        <ProfileSettingsForm
          initialData={{
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
          }}
        />
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
