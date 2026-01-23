"use client";

import { useState } from "react";

interface StudentCandidate {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | null;
}

interface TeacherCandidate {
  id: string;
  salutation: "HERR" | "FRAU";
  firstName: string | null;
  lastName: string;
  subject: string | null;
}

interface CandidateListProps {
  students: StudentCandidate[];
  teachers: TeacherCandidate[];
}

export function CandidateList({ students, teachers }: CandidateListProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors min-h-[44px]"
      >
        <span className="text-sm font-medium text-gray-700">
          Kandidatenliste ({students.length} Schüler, {teachers.length} Lehrer)
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Students */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Schüler
            </h4>
            <div className="flex flex-wrap gap-2">
              {students.map((student) => (
                <span
                  key={student.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                >
                  {student.firstName}
                </span>
              ))}
            </div>
          </div>

          {/* Teachers */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Lehrer
            </h4>
            <div className="flex flex-wrap gap-2">
              {teachers.map((teacher) => (
                <span
                  key={teacher.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700"
                >
                  {teacher.salutation === "HERR" ? "Hr." : "Fr."} {teacher.lastName}
                  {teacher.subject && ` (${teacher.subject})`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
