"use client";

import { useState } from "react";
import { SurveyQuestionCard } from "./SurveyQuestionCard";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Alert } from "@/components/ui/Alert";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface SurveyOption {
  id: string;
  text: string;
  order: number;
}

interface SurveyQuestion {
  id: string;
  text: string;
  order: number;
  options: SurveyOption[];
}

interface SurveyPageProps {
  initialQuestions: SurveyQuestion[];
  initialAnswers: Record<string, string>;
  deadlinePassed?: boolean;
}

export function SurveyPage({
  initialQuestions,
  initialAnswers,
  deadlinePassed = false,
}: SurveyPageProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const totalCount = initialQuestions.length;

  const handleAnswer = async (
    questionId: string,
    optionId: string
  ): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/survey/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Ein Fehler ist aufgetreten.");
        return false;
      }

      // Update local state
      setAnswers((prev) => ({
        ...prev,
        [questionId]: optionId,
      }));

      return true;
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      return false;
    }
  };

  if (initialQuestions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Zurzeit sind keine Umfrage-Fragen verfügbar.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <ProgressBar value={answeredCount} max={totalCount} label="Fortschritt" />
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Info Box */}
      <Alert variant="info">
        Deine Antworten werden automatisch und <strong>anonym</strong> gespeichert.
        Du kannst deine Antworten jederzeit ändern.
      </Alert>

      {/* Questions */}
      <div className="space-y-4">
        {initialQuestions.map((question, index) => (
          <SurveyQuestionCard
            key={question.id}
            questionId={question.id}
            questionText={question.text}
            questionNumber={index + 1}
            options={question.options}
            selectedOptionId={answers[question.id] || null}
            onAnswer={handleAnswer}
            disabled={deadlinePassed}
          />
        ))}
      </div>
    </div>
  );
}
