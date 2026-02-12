"use client";

import { useState, useEffect } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { ParticipationSection } from "@/components/ui/ParticipationSection";

interface StudentUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface SurveyStatsData {
  totalStudents: number;
  participatingStudents: number;
  participated: StudentUser[];
  notParticipated: StudentUser[];
}

export function SurveyStats() {
  const [stats, setStats] = useState<SurveyStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/survey-questions/stats");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Ein Fehler ist aufgetreten.");
          return;
        }

        setStats({
          totalStudents: data.totalStudents,
          participatingStudents: data.participatingStudents,
          participated: data.participated,
          notParticipated: data.notParticipated,
        });
      } catch {
        setError("Ein Fehler ist aufgetreten.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <StatsGrid
        items={[
          { label: "Schüler gesamt", value: stats.totalStudents },
          { label: "Teilgenommen", value: stats.participatingStudents, color: "green" },
          { label: "Noch offen", value: stats.notParticipated.length, color: "amber" },
        ]}
      />

      <ProgressBar
        value={stats.participatingStudents}
        max={stats.totalStudents}
        label="Teilnahme"
        color="green"
      />

      <ParticipationSection
        groups={[
          { label: "Teilgenommen", color: "green", items: stats.participated },
          { label: "Noch nicht teilgenommen", color: "amber", items: stats.notParticipated },
        ]}
      />
    </div>
  );
}
