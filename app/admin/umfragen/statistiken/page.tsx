import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { SurveyStats } from "@/components/admin/survey/SurveyStats";
import { redirect } from "next/navigation";

export default async function UmfragenStatistikenPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Übersicht über die Umfrage-Ergebnisse.
      </p>

      <Card>
        <SurveyStats />
      </Card>
    </div>
  );
}
