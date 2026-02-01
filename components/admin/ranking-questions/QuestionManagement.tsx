"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Alert } from "@/components/ui/Alert";
import { QuestionList } from "./QuestionList";
import { QuestionForm } from "./QuestionForm";

interface Question {
  id: string;
  text: string;
  type: "STUDENT" | "TEACHER";
  genderSpecific: boolean;
  order: number;
  active: boolean;
}

interface QuestionManagementProps {
  initialQuestions: Question[];
}

export function QuestionManagement({ initialQuestions }: QuestionManagementProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreate = async (data: {
    text: string;
    type: "STUDENT" | "TEACHER";
    genderSpecific: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/ranking-questions", {
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
    type: "STUDENT" | "TEACHER";
    genderSpecific: boolean;
  }) => {
    if (!editingQuestion) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/ranking-questions/${editingQuestion.id}`,
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

  const handleToggleActive = async (question: Question) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/ranking-questions/${question.id}`,
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

  const handleReorder = async (reorderedQuestions: Question[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/ranking-questions/reorder", {
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
        <Alert variant="success">{successMessage}</Alert>
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
        >
          Neue Frage
        </Button>
      </div>

      {isCreating && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Neue Frage erstellen
          </h3>
          <QuestionForm
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
          <QuestionForm
            question={editingQuestion}
            onSubmit={handleUpdate}
            onCancel={() => setEditingQuestion(null)}
            isLoading={isLoading}
          />
        </div>
      )}

      <QuestionList
        questions={questions}
        onEdit={(question) => {
          setEditingQuestion(question);
          setIsCreating(false);
          setError(null);
          setSuccessMessage(null);
          setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
        }}
        onToggleActive={handleToggleActive}
        onReorder={handleReorder}
        disabled={isLoading || isCreating || !!editingQuestion}
      />
    </div>
  );
}
