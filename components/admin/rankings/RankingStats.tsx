import { StatsGrid } from "@/components/ui/StatsGrid";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ParticipationSection } from "@/components/ui/ParticipationSection";

interface StudentUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface RankingStatsProps {
  totalStudents: number;
  submittedCount: number;
  submitted: StudentUser[];
  notSubmitted: StudentUser[];
}

export function RankingStats({
  totalStudents,
  submittedCount,
  submitted,
  notSubmitted,
}: RankingStatsProps) {
  return (
    <div className="space-y-6">
      <StatsGrid
        items={[
          { label: "Schüler gesamt", value: totalStudents },
          { label: "Abgeschickt", value: submittedCount, color: "green" },
          { label: "Noch offen", value: notSubmitted.length, color: "amber" },
        ]}
      />

      <ProgressBar
        value={submittedCount}
        max={totalStudents}
        label="Teilnahme"
        color="green"
      />

      <ParticipationSection
        groups={[
          { label: "Abgeschickt", color: "green", items: submitted },
          { label: "Noch nicht abgeschickt", color: "amber", items: notSubmitted },
        ]}
      />
    </div>
  );
}
