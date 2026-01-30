"use client";

import { useState } from "react";

interface SurveyOption {
  id: string;
  text: string;
  order: number;
}

interface SurveyQuestionCardProps {
  questionId: string;
  questionText: string;
  questionNumber: number;
  options: SurveyOption[];
  selectedOptionId: string | null;
  onAnswer: (questionId: string, optionId: string) => Promise<boolean>;
  disabled?: boolean;
}

export function SurveyQuestionCard({
  questionId,
  questionText,
  questionNumber,
  options,
  selectedOptionId,
  onAnswer,
  disabled: externalDisabled = false,
}: SurveyQuestionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(
    selectedOptionId
  );

  const handleOptionClick = async (optionId: string) => {
    if (isLoading || localSelectedId === optionId || externalDisabled) return;

    setIsLoading(true);
    setLocalSelectedId(optionId); // Optimistic update

    const success = await onAnswer(questionId, optionId);

    if (!success) {
      // Revert on failure
      setLocalSelectedId(selectedOptionId);
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
          {questionNumber}
        </span>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 pt-0.5">
          {questionText}
        </h3>
      </div>

      <div className="space-y-2 ml-10">
        {options.map((option) => {
          const isSelected = localSelectedId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={isLoading || externalDisabled}
              className={`
                w-full text-left px-4 py-3 rounded-lg border transition-all
                min-h-[44px] flex items-center gap-3
                ${
                  isSelected
                    ? "border-primary bg-primary-light text-primary"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
                ${isLoading ? "opacity-50 cursor-wait" : "cursor-pointer"}
              `}
            >
              {/* Radio circle */}
              <span
                className={`
                  flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${isSelected ? "border-primary" : "border-gray-300"}
                `}
              >
                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </span>

              <span className="text-sm sm:text-base">{option.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
