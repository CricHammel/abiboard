"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TabNav } from "@/components/ui/TabNav";
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

type AnswerMode = "SINGLE" | "GENDER_SPECIFIC" | "DUO";

interface Question {
  id: string;
  text: string;
  type: "STUDENT" | "TEACHER";
  answerMode: AnswerMode;
  order: number;
}

interface Vote {
  id: string;
  questionId: string;
  genderTarget: "MALE" | "FEMALE" | "ALL";
  student?: StudentOption | null;
  teacher?: TeacherOption | null;
  student2?: StudentOption | null;
  teacher2?: TeacherOption | null;
}

interface RankingsPageProps {
  initialData: {
    questions: Question[];
    votes: Vote[];
    submission: { status: "DRAFT" | "SUBMITTED" };
    students: StudentOption[];
    teachers: TeacherOption[];
  };
  deadlinePassed?: boolean;
}

export function RankingsPage({ initialData, deadlinePassed = false }: RankingsPageProps) {
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
  const [activeTab, setActiveTab] = useState<"student" | "teacher">("student");

  const { questions, students, teachers } = initialData;
  const studentQuestions = questions.filter((q) => q.type === "STUDENT");
  const teacherQuestions = questions.filter((q) => q.type === "TEACHER");

  const isSubmitted = status === "SUBMITTED";

  // Count answered questions
  const answeredCount = new Set(votes.map((v) => `${v.questionId}-${v.genderTarget}`)).size;
  const totalSlots = questions.reduce((acc, q) => acc + (q.answerMode === "GENDER_SPECIFIC" ? 2 : 1), 0);

  const handleVote = async (
    questionId: string,
    person: PersonOption | null,
    genderTarget: "MALE" | "FEMALE" | "ALL",
    person2?: PersonOption | null
  ) => {
    setError(null);

    // Find the question to check if it's Duo mode
    const question = questions.find((q) => q.id === questionId);
    const isDuo = question?.answerMode === "DUO";

    // For non-Duo: delete if person is null
    if (!person && !isDuo) {
      await handleDeleteVote(questionId, genderTarget);
      return;
    }

    // For Duo mode, require both persons (partial selections are handled in DuoQuestionCard)
    if (isDuo && (!person || !person2)) {
      return;
    }

    // Save vote
    try {
      const body: Record<string, string | null> = {
        questionId,
        genderTarget,
      };
      if (person?.type === "student") {
        body.studentId = person.data.id;
      } else if (person?.type === "teacher") {
        body.teacherId = person.data.id;
      }
      // Add second person for Duo mode
      if (isDuo && person2) {
        if (person2.type === "student") {
          body.studentId2 = person2.data.id;
        } else if (person2.type === "teacher") {
          body.teacherId2 = person2.data.id;
        }
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
      // Auto-retract: update status if server changed it
      if (data.status) {
        setStatus(data.status);
      }
    } catch {
      setError("Fehler beim Speichern der Stimme.");
    }
  };

  const handleDeleteVote = async (
    questionId: string,
    genderTarget: "MALE" | "FEMALE" | "ALL"
  ) => {
    setError(null);
    try {
      const response = await fetch(
        `/api/rankings/vote/${questionId}?genderTarget=${genderTarget}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Fehler beim Löschen der Stimme.");
        return;
      }

      setVotes((prev) =>
        prev.filter(
          (v) => !(v.questionId === questionId && v.genderTarget === genderTarget)
        )
      );
      // Auto-retract: update status if server changed it
      if (data.status) {
        setStatus(data.status);
      }
    } catch {
      setError("Fehler beim Löschen der Stimme.");
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
        {!deadlinePassed && (
          <div className="flex items-center gap-2">
            {isSubmitted ? (
              <>
                <Badge variant="submitted">Abgeschickt</Badge>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmDialog({ isOpen: true, action: "retract" })}
                  disabled={isLoading}
                >
                  Zurückziehen
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={() => setConfirmDialog({ isOpen: true, action: "submit" })}
                disabled={isLoading}
              >
                Rankings abschicken
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${totalSlots > 0 ? (answeredCount / totalSlots) * 100 : 0}%` }}
        />
      </div>

      <Alert variant="info">
        Tippe einen Namen ein und wähle die Person aus der Vorschlagsliste aus. Nur ausgewählte Einträge werden als Stimme gezählt.
      </Alert>

      {isSubmitted && !deadlinePassed && (
        <Alert variant="info">
          Deine Rankings sind eingereicht. Wenn du eine Stimme änderst, wird der Status automatisch auf &bdquo;Entwurf&ldquo; zurückgesetzt und muss erneut abgeschickt werden.
        </Alert>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Tabs for student/teacher rankings */}
      {questions.length > 0 && (
        <>
          <TabNav
            tabs={[
              { id: "student", label: `Schüler (${studentQuestions.length})` },
              { id: "teacher", label: `Lehrer (${teacherQuestions.length})` },
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as "student" | "teacher")}
          />

          {/* Candidate list for current tab */}
          {activeTab === "student" && (
            <CandidateList type="student" students={students} />
          )}
          {activeTab === "teacher" && (
            <CandidateList type="teacher" teachers={teachers} />
          )}

          {/* Questions for current tab */}
          {activeTab === "student" && studentQuestions.length > 0 && (
            <div className="space-y-4">
              {studentQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  votes={votes}
                  allStudents={students}
                  allTeachers={teachers}
                  onVote={handleVote}
                  onDeleteVote={handleDeleteVote}
                  disabled={deadlinePassed}
                />
              ))}
            </div>
          )}

          {activeTab === "teacher" && teacherQuestions.length > 0 && (
            <div className="space-y-4">
              {teacherQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  votes={votes}
                  allStudents={students}
                  allTeachers={teachers}
                  onVote={handleVote}
                  onDeleteVote={handleDeleteVote}
                  disabled={deadlinePassed}
                />
              ))}
            </div>
          )}

          {activeTab === "student" && studentQuestions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Es sind noch keine Schüler-Ranking-Fragen vorhanden.
            </div>
          )}

          {activeTab === "teacher" && teacherQuestions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Es sind noch keine Lehrer-Ranking-Fragen vorhanden.
            </div>
          )}
        </>
      )}

      {questions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Es sind noch keine Ranking-Fragen vorhanden.
        </div>
      )}

      {/* Submit / Retract buttons at bottom */}
      {questions.length > 0 && !deadlinePassed && (
        <div className="flex justify-end pt-4">
          {isSubmitted ? (
            <Button
              variant="secondary"
              onClick={() => setConfirmDialog({ isOpen: true, action: "retract" })}
              disabled={isLoading}
            >
              Rankings zurückziehen
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setConfirmDialog({ isOpen: true, action: "submit" })}
              disabled={isLoading}
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
            ? "Deine Rankings werden als fertig markiert. Du kannst sie weiterhin bearbeiten – der Status wird dann zurückgesetzt."
            : "Möchtest du deine Rankings als noch nicht fertig markieren?"
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
