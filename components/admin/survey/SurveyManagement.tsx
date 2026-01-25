"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SurveyList } from "./SurveyList";
import { SurveyForm } from "./SurveyForm";

interface SurveyOption {
  id: string;
  text: string;
  order: number;
}

interface SurveyQuestion {
  id: string;
  text: string;
  order: number;
  active: boolean;
  options: SurveyOption[];
}

interface SurveyManagementProps {
  initialQuestions: SurveyQuestion[];
}

export function SurveyManagement({ initialQuestions }: SurveyManagementProps) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>(initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreate = async (data: {
    text: string;
    options: { text: string }[];
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/survey-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      if (result.question) {
        setQuestions((prev) => [...prev, result.question]);
      }

      setSuccessMessage("Frage erfolgreich erstellt.");
      setIsCreating(false);
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: {
    text: string;
    options: { text: string }[];
  }) => {
    if (!editingQuestion) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/survey-questions/${editingQuestion.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      if (result.question) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === editingQuestion.id ? result.question : q))
        );
      }

      setSuccessMessage("Frage erfolgreich aktualisiert.");
      setEditingQuestion(null);
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (question: SurveyQuestion) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/survey-questions/${question.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !question.active }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === question.id ? { ...q, active: !q.active } : q
        )
      );
      setSuccessMessage(
        question.active ? "Frage deaktiviert." : "Frage aktiviert."
      );
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (reorderedQuestions: SurveyQuestion[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/survey-questions/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionOrders: reorderedQuestions.map((q, index) => ({
            id: q.id,
            order: index + 1,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      setQuestions(
        reorderedQuestions.map((q, index) => ({ ...q, order: index + 1 }))
      );
      setSuccessMessage("Reihenfolge aktualisiert.");
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {questions.length} Fragen
        </h2>
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditingQuestion(null);
            setError(null);
            setSuccessMessage(null);
          }}
          variant="primary"
          disabled={isLoading || isCreating}
          className="!w-auto"
        >
          Neue Frage
        </Button>
      </div>

      {isCreating && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Neue Frage erstellen
          </h3>
          <SurveyForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isLoading={isLoading}
          />
        </div>
      )}

      {editingQuestion && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Frage bearbeiten
          </h3>
          <SurveyForm
            question={editingQuestion}
            onSubmit={handleUpdate}
            onCancel={() => setEditingQuestion(null)}
            isLoading={isLoading}
          />
        </div>
      )}

      <SurveyList
        questions={questions}
        onEdit={(question) => {
          setEditingQuestion(question);
          setIsCreating(false);
          setError(null);
          setSuccessMessage(null);
        }}
        onToggleActive={handleToggleActive}
        onReorder={handleReorder}
        disabled={isLoading || isCreating || !!editingQuestion}
      />
    </div>
  );
}
