"use client";

import { useState } from "react";
import { SurveyQuestionCard } from "./SurveyQuestionCard";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

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
}

export function SurveyPage({
  initialQuestions,
  initialAnswers,
}: SurveyPageProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const totalCount = initialQuestions.length;
  const progressPercent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

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
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Fortschritt
          </span>
          <span className="text-sm text-gray-600">
            {answeredCount} von {totalCount} beantwortet
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>
            Deine Antworten werden automatisch und <strong>anonym</strong> gespeichert.
            Du kannst deine Antworten jederzeit ändern.
          </p>
        </div>
      </div>

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
          />
        ))}
      </div>
    </div>
  );
}
