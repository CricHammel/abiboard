import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { SurveyResults } from "@/components/admin/survey/SurveyResults";
import { redirect } from "next/navigation";

export default async function UmfragenAuswertungPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="space-y-6">
      <Card>
        <SurveyResults />
      </Card>
    </div>
  );
}
