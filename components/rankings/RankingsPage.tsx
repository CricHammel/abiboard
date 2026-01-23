"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CandidateList } from "./CandidateList";
import { QuestionCard } from "./QuestionCard";

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

interface Question {
  id: string;
  text: string;
  type: "STUDENT" | "TEACHER";
  genderSpecific: boolean;
  order: number;
}

interface Vote {
  id: string;
  questionId: string;
  genderTarget: "MALE" | "FEMALE" | "ALL";
  student?: StudentOption | null;
  teacher?: TeacherOption | null;
}

interface RankingsPageProps {
  initialData: {
    questions: Question[];
    votes: Vote[];
    submission: { status: "DRAFT" | "SUBMITTED" };
    students: StudentOption[];
    teachers: TeacherOption[];
  };
}

export function RankingsPage({ initialData }: RankingsPageProps) {
  const [votes, setVotes] = useState<Vote[]>(initialData.votes);
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">(
    initialData.submission.status
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: "submit" | "retract";
  }>({ isOpen: false, action: "submit" });

  const { questions, students, teachers } = initialData;
  const studentQuestions = questions.filter((q) => q.type === "STUDENT");
  const teacherQuestions = questions.filter((q) => q.type === "TEACHER");

  const isSubmitted = status === "SUBMITTED";

  // Count answered questions
  const answeredCount = new Set(votes.map((v) => `${v.questionId}-${v.genderTarget}`)).size;
  const totalSlots = questions.reduce((acc, q) => acc + (q.genderSpecific ? 2 : 1), 0);

  const handleVote = async (
    questionId: string,
    person: PersonOption | null,
    genderTarget: "MALE" | "FEMALE" | "ALL"
  ) => {
    setError(null);

    if (!person) {
      // Delete vote
      try {
        await fetch(
          `/api/rankings/vote/${questionId}?genderTarget=${genderTarget}`,
          { method: "DELETE" }
        );
        setVotes((prev) =>
          prev.filter(
            (v) => !(v.questionId === questionId && v.genderTarget === genderTarget)
          )
        );
      } catch {
        setError("Fehler beim Löschen der Stimme.");
      }
      return;
    }

    // Save vote
    try {
      const body: Record<string, string> = {
        questionId,
        genderTarget,
      };
      if (person.type === "student") {
        body.studentId = person.data.id;
      } else {
        body.teacherId = person.data.id;
      }

      const response = await fetch("/api/rankings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Fehler beim Speichern.");
        return;
      }

      // Update local state
      setVotes((prev) => {
        const filtered = prev.filter(
          (v) => !(v.questionId === questionId && v.genderTarget === genderTarget)
        );
        return [...filtered, data.vote];
      });
    } catch {
      setError("Fehler beim Speichern der Stimme.");
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rankings/submit", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Fehler beim Abschicken.");
        setIsLoading(false);
        return;
      }

      setStatus("SUBMITTED");
      setConfirmDialog({ isOpen: false, action: "submit" });
    } catch {
      setError("Fehler beim Abschicken.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetract = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rankings/retract", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Fehler beim Zurückziehen.");
        setIsLoading(false);
        return;
      }

      setStatus("DRAFT");
      setConfirmDialog({ isOpen: false, action: "retract" });
    } catch {
      setError("Fehler beim Zurückziehen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rankings</h1>
          <p className="text-sm text-gray-600 mt-1">
            {answeredCount} von {totalSlots} beantwortet
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSubmitted ? (
            <>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                Abgeschickt
              </span>
              <Button
                variant="secondary"
                onClick={() => setConfirmDialog({ isOpen: true, action: "retract" })}
                disabled={isLoading}
                className="!w-auto"
              >
                Zurückziehen
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => setConfirmDialog({ isOpen: true, action: "submit" })}
              disabled={isLoading}
              className="!w-auto"
            >
              Rankings abschicken
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${totalSlots > 0 ? (answeredCount / totalSlots) * 100 : 0}%` }}
        />
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Candidate list for inspiration */}
      <CandidateList students={students} teachers={teachers} />

      {/* Student questions */}
      {studentQuestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Schüler-Rankings</h2>
          {studentQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              votes={votes}
              allStudents={students}
              allTeachers={teachers}
              onVote={handleVote}
              disabled={isSubmitted}
            />
          ))}
        </div>
      )}

      {/* Teacher questions */}
      {teacherQuestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Lehrer-Rankings</h2>
          {teacherQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              votes={votes}
              allStudents={students}
              allTeachers={teachers}
              onVote={handleVote}
              disabled={isSubmitted}
            />
          ))}
        </div>
      )}

      {questions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Es sind noch keine Ranking-Fragen vorhanden.
        </div>
      )}

      {/* Submit / Retract buttons at bottom */}
      {questions.length > 0 && (
        <div className="flex justify-end pt-4">
          {isSubmitted ? (
            <Button
              variant="secondary"
              onClick={() => setConfirmDialog({ isOpen: true, action: "retract" })}
              disabled={isLoading}
              className="!w-auto"
            >
              Rankings zurückziehen
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setConfirmDialog({ isOpen: true, action: "submit" })}
              disabled={isLoading}
              className="!w-auto"
            >
              Rankings abschicken
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.action === "submit"
            ? "Rankings abschicken"
            : "Rankings zurückziehen"
        }
        message={
          confirmDialog.action === "submit"
            ? "Möchtest du deine Rankings abschicken? Du kannst sie danach nicht mehr bearbeiten."
            : "Möchtest du deine Rankings zurückziehen? Du kannst sie danach wieder bearbeiten und erneut abschicken."
        }
        confirmText={
          confirmDialog.action === "submit" ? "Abschicken" : "Zurückziehen"
        }
        variant="warning"
        onConfirm={
          confirmDialog.action === "submit" ? handleSubmit : handleRetract
        }
        onCancel={() => setConfirmDialog({ isOpen: false, action: "submit" })}
        isLoading={isLoading}
      />
    </div>
  );
}
