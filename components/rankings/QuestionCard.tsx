"use client";

import { PersonAutocomplete } from "./PersonAutocomplete";

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | null;
}

interface TeacherOption {
  id: string;
  salutation: "HERR" | "FRAU";
  firstName: string | null;
  lastName: string;
  subject: string | null;
}

type PersonOption =
  | { type: "student"; data: StudentOption }
  | { type: "teacher"; data: TeacherOption };

interface Vote {
  questionId: string;
  genderTarget: "MALE" | "FEMALE" | "ALL";
  student?: StudentOption | null;
  teacher?: TeacherOption | null;
}

interface Question {
  id: string;
  text: string;
  type: "STUDENT" | "TEACHER";
  genderSpecific: boolean;
}

interface QuestionCardProps {
  question: Question;
  votes: Vote[];
  allStudents: StudentOption[];
  allTeachers: TeacherOption[];
  onVote: (questionId: string, person: PersonOption | null, genderTarget: "MALE" | "FEMALE" | "ALL") => void;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  votes,
  allStudents,
  allTeachers,
  onVote,
  disabled,
}: QuestionCardProps) {
  const personType = question.type === "STUDENT" ? "student" : "teacher";

  const getSelectedPerson = (genderTarget: "MALE" | "FEMALE" | "ALL"): PersonOption | null => {
    const vote = votes.find(
      (v) => v.questionId === question.id && v.genderTarget === genderTarget
    );
    if (!vote) return null;

    if (vote.student) {
      return { type: "student", data: vote.student };
    }
    if (vote.teacher) {
      return { type: "teacher", data: vote.teacher };
    }
    return null;
  };

  if (question.genderSpecific) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium text-gray-900">{question.text}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Männlich</label>
            <PersonAutocomplete
              personType={personType}
              gender="MALE"
              selectedPerson={getSelectedPerson("MALE")}
              allStudents={allStudents}
              allTeachers={allTeachers}
              onSelect={(person) => onVote(question.id, person, "MALE")}
              disabled={disabled}
              placeholder="Name eingeben und auswählen..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Weiblich</label>
            <PersonAutocomplete
              personType={personType}
              gender="FEMALE"
              selectedPerson={getSelectedPerson("FEMALE")}
              allStudents={allStudents}
              allTeachers={allTeachers}
              onSelect={(person) => onVote(question.id, person, "FEMALE")}
              disabled={disabled}
              placeholder="Name eingeben und auswählen..."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-2">
      <p className="text-sm font-medium text-gray-900">{question.text}</p>
      <PersonAutocomplete
        personType={personType}
        selectedPerson={getSelectedPerson("ALL")}
        allStudents={allStudents}
        allTeachers={allTeachers}
        onSelect={(person) => onVote(question.id, person, "ALL")}
        disabled={disabled}
        placeholder={personType === "student" ? "Schüler suchen und auswählen..." : "Lehrer suchen und auswählen..."}
      />
    </div>
  );
}
