"use client";

import { useState } from "react";
import { formatTeacherName } from "@/lib/format";

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
  type: "student" | "teacher";
  students?: StudentCandidate[];
  teachers?: TeacherCandidate[];
}

function getStudentDisplayName(student: StudentCandidate, allStudents: StudentCandidate[]): string {
  // Check for duplicate first names - show full last name if duplicates exist
  const duplicates = allStudents.filter(
    (s) => s.firstName === student.firstName && s.id !== student.id
  );
  if (duplicates.length > 0) {
    return `${student.firstName} ${student.lastName}`;
  }
  return student.firstName;
}

export function CandidateList({ type, students = [], teachers = [] }: CandidateListProps) {
  const [isOpen, setIsOpen] = useState(false);

  const count = type === "student" ? students.length : teachers.length;
  const label = type === "student" ? "Schüler" : "Lehrer";

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors min-h-[44px]"
      >
        <span className="text-sm font-medium text-gray-700">
          Kandidatenliste ({count} {label})
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
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {type === "student" &&
              students.map((student) => (
                <span
                  key={student.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                >
                  {getStudentDisplayName(student, students)}
                </span>
              ))}
            {type === "teacher" &&
              teachers.map((teacher) => (
                <span
                  key={teacher.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700"
                >
                  {formatTeacherName(teacher)}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
