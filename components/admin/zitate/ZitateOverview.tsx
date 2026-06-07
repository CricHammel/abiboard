"use client";

import { TabNav } from "@/components/ui/TabNav";
import { StudentQuoteList } from "@/components/student-quotes/StudentQuoteList";
import { TeacherQuoteList } from "@/components/teacher-quotes/TeacherQuoteList";
import { usePersistentState } from "@/hooks/usePersistentState";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  _count: { quotesAbout: number };
}

interface Teacher {
  id: string;
  salutation: "HERR" | "FRAU";
  lastName: string;
  subject: string | null;
  _count: { teacherQuotes: number };
}

interface ZitateOverviewProps {
  students: Student[];
  teachers: Teacher[];
}

export function ZitateOverview({ students, teachers }: ZitateOverviewProps) {
  const [activeTab, setActiveTab] = usePersistentState("zitate:tab", "schueler");

  return (
    <div className="space-y-4">
      <TabNav
        tabs={[
          { id: "schueler", label: "Schüler" },
          { id: "lehrer", label: "Lehrer" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "schueler" ? (
        <StudentQuoteList
          students={students}
          basePath="/admin/zitate/schueler"
        />
      ) : (
        <TeacherQuoteList
          teachers={teachers}
          basePath="/admin/zitate/lehrer"
        />
      )}
    </div>
  );
}
