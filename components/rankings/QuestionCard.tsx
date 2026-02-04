"use client";

import { useState } from "react";
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

type AnswerMode = "SINGLE" | "GENDER_SPECIFIC" | "DUO";

interface Vote {
  questionId: string;
  genderTarget: "MALE" | "FEMALE" | "ALL";
  student?: StudentOption | null;
  teacher?: TeacherOption | null;
  student2?: StudentOption | null;
  teacher2?: TeacherOption | null;
}

interface Question {
  id: string;
  text: string;
  type: "STUDENT" | "TEACHER";
  answerMode: AnswerMode;
}

interface QuestionCardProps {
  question: Question;
  votes: Vote[];
  allStudents: StudentOption[];
  allTeachers: TeacherOption[];
  onVote: (
    questionId: string,
    person: PersonOption | null,
    genderTarget: "MALE" | "FEMALE" | "ALL",
    person2?: PersonOption | null
  ) => void;
  onDeleteVote: (questionId: string, genderTarget: "MALE" | "FEMALE" | "ALL") => void;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  votes,
  allStudents,
  allTeachers,
  onVote,
  onDeleteVote,
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

  const getSelectedPerson2 = (genderTarget: "MALE" | "FEMALE" | "ALL"): PersonOption | null => {
    const vote = votes.find(
      (v) => v.questionId === question.id && v.genderTarget === genderTarget
    );
    if (!vote) return null;

    if (vote.student2) {
      return { type: "student", data: vote.student2 };
    }
    if (vote.teacher2) {
      return { type: "teacher", data: vote.teacher2 };
    }
    return null;
  };

  // Gender-Specific mode
  if (question.answerMode === "GENDER_SPECIFIC") {
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

  // Duo mode - uses DuoQuestionCard subcomponent with local state
  // Key based on saved vote ensures component remounts when vote changes
  if (question.answerMode === "DUO") {
    const savedPerson1 = getSelectedPerson("ALL");
    const savedPerson2 = getSelectedPerson2("ALL");
    const voteKey = `${savedPerson1?.data?.id || "none"}-${savedPerson2?.data?.id || "none"}`;

    return (
      <DuoQuestionCard
        key={voteKey}
        question={question}
        votes={votes}
        allStudents={allStudents}
        allTeachers={allTeachers}
        onVote={onVote}
        onDeleteVote={onDeleteVote}
        disabled={disabled}
        personType={personType}
        getSelectedPerson={getSelectedPerson}
        getSelectedPerson2={getSelectedPerson2}
      />
    );
  }

  // Single mode (default)
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

// Separate component for Duo mode to manage local state for partial selections
function DuoQuestionCard({
  question,
  votes,
  allStudents,
  allTeachers,
  onVote,
  onDeleteVote,
  disabled,
  personType,
  getSelectedPerson,
  getSelectedPerson2,
}: {
  question: Question;
  votes: Vote[];
  allStudents: StudentOption[];
  allTeachers: TeacherOption[];
  onVote: (
    questionId: string,
    person: PersonOption | null,
    genderTarget: "MALE" | "FEMALE" | "ALL",
    person2?: PersonOption | null
  ) => void;
  onDeleteVote: (questionId: string, genderTarget: "MALE" | "FEMALE" | "ALL") => void;
  disabled?: boolean;
  personType: "student" | "teacher";
  getSelectedPerson: (genderTarget: "MALE" | "FEMALE" | "ALL") => PersonOption | null;
  getSelectedPerson2: (genderTarget: "MALE" | "FEMALE" | "ALL") => PersonOption | null;
}) {
  // Get saved selections from votes
  const savedPerson1 = getSelectedPerson("ALL");
  const savedPerson2 = getSelectedPerson2("ALL");
  const hasSavedVote = !!(savedPerson1 && savedPerson2);

  // Local state for partial selections (before both are chosen)
  // Component is keyed by saved vote, so initial state is correct on mount/remount
  const [localPerson1, setLocalPerson1] = useState<PersonOption | null>(savedPerson1);
  const [localPerson2, setLocalPerson2] = useState<PersonOption | null>(savedPerson2);

  const handleSelectPerson1 = (person: PersonOption | null) => {
    setLocalPerson1(person);
    if (person && localPerson2) {
      // Both selected -> save to server
      onVote(question.id, person, "ALL", localPerson2);
    } else if (!person && hasSavedVote) {
      // Cleared and there was a saved vote -> delete from server
      setLocalPerson2(null);
      onDeleteVote(question.id, "ALL");
    }
  };

  const handleSelectPerson2 = (person: PersonOption | null) => {
    setLocalPerson2(person);
    if (localPerson1 && person) {
      // Both selected -> save to server
      onVote(question.id, localPerson1, "ALL", person);
    } else if (!person && hasSavedVote) {
      // Cleared and there was a saved vote -> delete from server
      setLocalPerson1(null);
      onDeleteVote(question.id, "ALL");
    }
  };

  // Get the ID of the selected person to exclude from the other autocomplete
  const excludeId1 = localPerson2?.data?.id;
  const excludeId2 = localPerson1?.data?.id;

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{question.text}</p>
        <p className="text-xs text-gray-500 mt-1">Wähle zwei verschiedene Personen aus</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Person 1</label>
          <PersonAutocomplete
            personType={personType}
            selectedPerson={localPerson1}
            allStudents={allStudents}
            allTeachers={allTeachers}
            onSelect={handleSelectPerson1}
            disabled={disabled}
            placeholder="Erste Person auswählen..."
            excludePersonId={excludeId1}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Person 2</label>
          <PersonAutocomplete
            personType={personType}
            selectedPerson={localPerson2}
            allStudents={allStudents}
            allTeachers={allTeachers}
            onSelect={handleSelectPerson2}
            disabled={disabled}
            placeholder="Zweite Person auswählen..."
            excludePersonId={excludeId2}
          />
        </div>
      </div>
    </div>
  );
}
