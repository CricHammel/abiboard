"use client";

import { useState, useEffect } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface OptionStat {
  id: string;
  text: string;
  count: number;
  percentage: number;
}

interface QuestionStat {
  id: string;
  text: string;
  totalAnswers: number;
  options: OptionStat[];
}

interface SurveyStatsData {
  totalStudents: number;
  participatingStudents: number;
  participationRate: number;
  questions: QuestionStat[];
}

export function SurveyStats() {
  const [stats, setStats] = useState<SurveyStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/survey-questions/stats");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Ein Fehler ist aufgetreten.");
          return;
        }

        setStats(data);
        // Expand first 3 questions by default
        const initialExpanded = new Set<string>(
          data.questions.slice(0, 3).map((q: QuestionStat) => q.id)
        );
        setExpandedQuestions(initialExpanded);
      } catch {
        setError("Ein Fehler ist aufgetreten.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Gesamt Schüler</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalStudents}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Teilgenommen</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.participatingStudents}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Teilnahmequote</p>
          <p className="text-2xl font-bold text-primary">
            {stats.participationRate}%
          </p>
        </div>
      </div>

      {/* Participation Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Teilnahme-Fortschritt
          </span>
          <span className="text-sm text-gray-600">
            {stats.participatingStudents} von {stats.totalStudents}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${stats.participationRate}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      {stats.questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Keine aktiven Fragen vorhanden.
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Ergebnisse nach Frage
          </h2>

          {stats.questions.map((question, index) => {
            const isExpanded = expandedQuestions.has(question.id);
            const maxCount = Math.max(...question.options.map((o) => o.count));

            return (
              <div
                key={question.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleQuestion(question.id)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">
                      {question.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {question.totalAnswers} Antworten
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Options Results */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-100">
                    {question.options.map((option) => (
                      <div key={option.id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-700">
                            {option.text}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {option.count} ({option.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              option.count === maxCount && maxCount > 0
                                ? "bg-primary"
                                : "bg-gray-400"
                            }`}
                            style={{
                              width: `${option.percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
