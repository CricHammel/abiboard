"use client";

import { useState, useMemo } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatsGrid } from "@/components/ui/StatsGrid";

type AnswerMode = "SINGLE" | "GENDER_SPECIFIC" | "DUO";

interface Question {
  id: string;
  text: string;
  type: "STUDENT" | "TEACHER";
  answerMode: AnswerMode;
  order: number;
}

interface StudentUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface ResultEntry {
  personId: string;
  personType: "student" | "teacher";
  name: string;
  genderTarget: string;
  count: number;
}

interface QuestionResults {
  question: Question;
  answerMode: AnswerMode;
  results: ResultEntry[] | { male: ResultEntry[]; female: ResultEntry[] };
  totalVoters: number;
}

interface RankingStatsProps {
  initialData: {
    totalStudents: number;
    submittedCount: number;
    submitted: StudentUser[];
    notSubmitted: StudentUser[];
    questions: Question[];
  };
}

export function RankingStats({ initialData }: RankingStatsProps) {
  const { totalStudents, submittedCount, submitted, notSubmitted, questions } = initialData;
  const [showSubmitted, setShowSubmitted] = useState(false);
  const [showNotSubmitted, setShowNotSubmitted] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [questionResults, setQuestionResults] = useState<Record<string, QuestionResults>>({});
  const [loadingQuestion, setLoadingQuestion] = useState<string | null>(null);

  // Search and filter state for questions
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "STUDENT" | "TEACHER">("ALL");

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "ALL" || q.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [questions, searchTerm, typeFilter]);

  const isFiltered = searchTerm !== "" || typeFilter !== "ALL";

  const toggleQuestion = async (questionId: string) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
      return;
    }

    setExpandedQuestion(questionId);

    if (!questionResults[questionId]) {
      setLoadingQuestion(questionId);
      try {
        const response = await fetch(`/api/admin/rankings/stats/${questionId}`);
        const data = await response.json();
        setQuestionResults((prev) => ({ ...prev, [questionId]: data }));
      } catch {
        // Silently fail, user can retry
      } finally {
        setLoadingQuestion(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <StatsGrid
        items={[
          { label: "Schüler gesamt", value: totalStudents },
          { label: "Abgeschickt", value: submittedCount, color: "green" },
          { label: "Noch offen", value: notSubmitted.length, color: "amber" },
        ]}
      />

      {/* Progress bar */}
      <ProgressBar
        value={submittedCount}
        max={totalStudents}
        label="Teilnahme"
        color="green"
        size="sm"
      />

      {/* Submitted list */}
      {submitted.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowSubmitted(!showSubmitted)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors min-h-[44px]"
          >
            <span className="text-sm font-medium text-gray-700">
              Abgeschickt ({submitted.length})
            </span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${showSubmitted ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showSubmitted && (
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {submitted.map((student) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-700"
                  >
                    {student.firstName} {student.lastName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Not submitted list */}
      {notSubmitted.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowNotSubmitted(!showNotSubmitted)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors min-h-[44px]"
          >
            <span className="text-sm font-medium text-gray-700">
              Noch nicht abgeschickt ({notSubmitted.length})
            </span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${showNotSubmitted ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showNotSubmitted && (
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {notSubmitted.map((student) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-50 text-amber-700"
                  >
                    {student.firstName} {student.lastName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question results */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Ergebnisse pro Frage</h2>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Fragen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light min-h-[44px]"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "ALL" | "STUDENT" | "TEACHER")}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light min-h-[44px]"
            >
              <option value="ALL">Alle Typen</option>
              <option value="STUDENT">Schüler</option>
              <option value="TEACHER">Lehrer</option>
            </select>
          </div>

          {isFiltered && (
            <p className="text-sm text-gray-500">
              {filteredQuestions.length} von {questions.length} Fragen
            </p>
          )}

          {filteredQuestions.length === 0 && isFiltered && (
            <div className="text-center py-8 text-gray-500">
              Keine Fragen gefunden.
            </div>
          )}

          {filteredQuestions.map((question) => (
            <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleQuestion(question.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2 text-left">
                  <span className="text-sm font-medium text-gray-900">{question.text}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    question.type === "STUDENT"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-purple-50 text-purple-600"
                  }`}>
                    {question.type === "STUDENT" ? "Schüler" : "Lehrer"}
                  </span>
                  {question.answerMode === "GENDER_SPECIFIC" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-pink-50 text-pink-600">
                      m/w
                    </span>
                  )}
                  {question.answerMode === "DUO" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-600">
                      Duo
                    </span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                    expandedQuestion === question.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedQuestion === question.id && (
                <div className="px-4 pb-4">
                  {loadingQuestion === question.id ? (
                    <p className="text-sm text-gray-500 py-2">Laden...</p>
                  ) : questionResults[question.id] ? (
                    <QuestionResultsView data={questionResults[question.id]} />
                  ) : (
                    <p className="text-sm text-gray-500 py-2">Keine Daten verfügbar.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {questions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Es sind noch keine Ranking-Fragen vorhanden.
        </div>
      )}
    </div>
  );
}

function QuestionResultsView({ data }: { data: QuestionResults }) {
  const { answerMode, results, totalVoters } = data;

  if (answerMode === "GENDER_SPECIFIC" && !Array.isArray(results)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Männlich
          </h4>
          <ResultList entries={results.male} totalVoters={totalVoters} />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Weiblich
          </h4>
          <ResultList entries={results.female} totalVoters={totalVoters} />
        </div>
      </div>
    );
  }

  const entries = Array.isArray(results) ? results : [];
  return <ResultList entries={entries} totalVoters={totalVoters} />;
}

function ResultList({ entries, totalVoters }: { entries: ResultEntry[]; totalVoters: number }) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">Noch keine Stimmen.</p>;
  }

  const maxCount = entries[0]?.count || 1;

  return (
    <div className="space-y-2">
      {entries.slice(0, 10).map((entry, index) => {
        const percentage = totalVoters > 0
          ? Math.round((entry.count / totalVoters) * 100)
          : 0;
        const barWidth = maxCount > 0
          ? Math.round((entry.count / maxCount) * 100)
          : 0;

        return (
          <div key={`${entry.personId}-${entry.genderTarget}`} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-5 text-right">{index + 1}.</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm text-gray-900 truncate">{entry.name}</span>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {entry.count} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
      {entries.length > 10 && (
        <p className="text-xs text-gray-500 mt-1">
          +{entries.length - 10} weitere
        </p>
      )}
    </div>
  );
}
