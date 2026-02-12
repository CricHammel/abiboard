import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";

export const metadata: Metadata = { title: "Einstellungen" };
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { AdminAliasSettings } from "@/components/admin/AdminAliasSettings";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
        <p className="text-gray-600 mt-2">
          Verwalte deine persönlichen Daten und Sicherheitseinstellungen.
        </p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Admin-Kürzel
        </h2>
        <AdminAliasSettings />
      </Card>

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
