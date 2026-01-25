import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { SurveyStats } from "@/components/admin/survey/SurveyStats";
import { redirect } from "next/navigation";

export default async function SurveyStatsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Umfragen-Statistik</h1>
        <p className="text-gray-600 mt-2">
          Übersicht über die Umfrage-Ergebnisse.
        </p>
      </div>

      <Card>
        <SurveyStats />
      </Card>
    </div>
  );
}
