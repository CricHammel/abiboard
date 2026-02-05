"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

type AnswerMode = "SINGLE" | "GENDER_SPECIFIC" | "DUO";

interface Question {
  id: string;
  text: string;
  type: "STUDENT" | "TEACHER";
  answerMode: AnswerMode;
  order: number;
  active: boolean;
}

interface QuestionListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onToggleActive: (question: Question) => void;
  onReorder: (questions: Question[]) => void;
  disabled?: boolean;
  reorderDisabled?: boolean;
}

export function QuestionList({
  questions,
  onEdit,
  onToggleActive,
  onReorder,
  disabled,
  reorderDisabled,
}: QuestionListProps) {
  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);

  const canReorder = !disabled && !reorderDisabled;

  // Sync local state when questions prop changes
  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  const handleDragStart = (index: number) => {
    if (!canReorder) return;
    setDraggedIndex(index);
    setOrderChanged(false);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || !canReorder) return;

    const newQuestions = [...localQuestions];
    const [draggedItem] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setLocalQuestions(newQuestions);
    setOrderChanged(true);
  };

  const handleDragEnd = () => {
    if (orderChanged && draggedIndex !== null) {
      onReorder(localQuestions);
    }
    setDraggedIndex(null);
    setOrderChanged(false);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (!canReorder) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localQuestions.length) return;

    const newQuestions = [...localQuestions];
    const [item] = newQuestions.splice(index, 1);
    newQuestions.splice(newIndex, 0, item);

    setLocalQuestions(newQuestions);
    onReorder(newQuestions);
  };

  if (localQuestions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Keine Fragen gefunden.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reorderDisabled && (
        <p className="text-xs text-amber-600 mb-2">
          Reihenfolge ändern nur ohne Filter/Suche möglich.
        </p>
      )}
      {localQuestions.map((question, index) => (
        <div
          key={question.id}
          draggable={canReorder}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            p-4 bg-white border rounded-lg
            ${canReorder ? "cursor-move" : ""}
            ${draggedIndex === index ? "opacity-50" : ""}
            ${!question.active ? "opacity-60 bg-gray-50" : ""}
            transition-all
          `}
        >
          {/* Desktop Layout (md+) */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {/* Drag Handle */}
            <div className="text-gray-400 flex-shrink-0">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </div>

            {/* Question Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {question.text}
              </p>
              <div className="flex gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  question.type === "STUDENT"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}>
                  {question.type === "STUDENT" ? "Schüler" : "Lehrer"}
                </span>
                {question.answerMode === "GENDER_SPECIFIC" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-700">
                    m/w
                  </span>
                )}
                {question.answerMode === "DUO" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                    Duo
                  </span>
                )}
                {!question.active && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                    Deaktiviert
                  </span>
                )}
              </div>
            </div>

            {/* Move Buttons */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => moveQuestion(index, "up")}
                disabled={!canReorder || index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveQuestion(index, "down")}
                disabled={!canReorder || index === localQuestions.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => onEdit(question)}
                disabled={disabled}
                className="!py-2 !px-3 !text-sm"
              >
                Bearbeiten
              </Button>
              <Button
                variant={question.active ? "secondary" : "primary"}
                onClick={() => onToggleActive(question)}
                disabled={disabled}
                className="!py-2 !px-3 !text-sm"
              >
                {question.active ? "Deaktivieren" : "Aktivieren"}
              </Button>
            </div>
          </div>

          {/* Mobile Layout (< md) */}
          <div className="md:hidden space-y-3">
            {/* Header with move buttons */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 flex-1 min-w-0">{question.text}</p>

              {/* Move Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveQuestion(index, "up")}
                  disabled={!canReorder || index === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveQuestion(index, "down")}
                  disabled={!canReorder || index === localQuestions.length - 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                question.type === "STUDENT"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}>
                {question.type === "STUDENT" ? "Schüler" : "Lehrer"}
              </span>
              {question.answerMode === "GENDER_SPECIFIC" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-700">
                  m/w
                </span>
              )}
              {question.answerMode === "DUO" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                  Duo
                </span>
              )}
              {!question.active && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                  Deaktiviert
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => onEdit(question)}
                disabled={disabled}
                className="flex-1 !py-2 !text-sm"
              >
                Bearbeiten
              </Button>
              <Button
                variant={question.active ? "secondary" : "primary"}
                onClick={() => onToggleActive(question)}
                disabled={disabled}
                className="flex-1 !py-2 !text-sm"
              >
                {question.active ? "Deaktivieren" : "Aktivieren"}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
