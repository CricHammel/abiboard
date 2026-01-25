"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SurveyOption {
  id?: string;
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

interface SurveyFormProps {
  question?: SurveyQuestion;
  onSubmit: (data: { text: string; options: { text: string }[] }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SurveyForm({
  question,
  onSubmit,
  onCancel,
  isLoading,
}: SurveyFormProps) {
  const [text, setText] = useState(question?.text || "");
  const [options, setOptions] = useState<string[]>(
    question?.options.map((o) => o.text) || ["", ""]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const moveOption = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= options.length) return;

    const newOptions = [...options];
    const [item] = newOptions.splice(index, 1);
    newOptions.splice(newIndex, 0, item);
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!text.trim()) {
      newErrors.text = "Bitte gib einen Fragetext ein.";
    } else if (text.length > 500) {
      newErrors.text = "Maximal 500 Zeichen.";
    }

    const filledOptions = options.filter((o) => o.trim());
    if (filledOptions.length < 2) {
      newErrors.options = "Bitte gib mindestens 2 Antwortmöglichkeiten ein.";
    }

    const emptyOptionIndex = options.findIndex(
      (o, i) => !o.trim() && i < options.length
    );
    if (emptyOptionIndex !== -1 && filledOptions.length >= 2) {
      // Check if there are empty options between filled ones
      const firstEmpty = options.findIndex((o) => !o.trim());
      const lastFilled = options.length - 1 - [...options].reverse().findIndex((o) => o.trim());
      if (firstEmpty < lastFilled) {
        newErrors.options = "Bitte fülle alle Antwortmöglichkeiten aus oder entferne leere.";
      }
    }

    // Check option length
    const longOption = options.find((o) => o.length > 200);
    if (longOption) {
      newErrors.options = "Antworten dürfen maximal 200 Zeichen lang sein.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      text: text.trim(),
      options: filledOptions.map((o) => ({ text: o.trim() })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Fragetext *"
        value={text}
        onChange={(e) => setText(e.target.value)}
        error={errors.text}
        placeholder="z.B. Wie oft nutzt du die Schulbibliothek?"
        disabled={isLoading}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Antwortmöglichkeiten * (2-10)
        </label>

        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-base"
              />

              {/* Move buttons */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveOption(index, "up")}
                  disabled={isLoading || index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveOption(index, "down")}
                  disabled={isLoading || index === options.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg
                    className="w-3 h-3"
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
                </button>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                disabled={isLoading || options.length <= 2}
                className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {errors.options && (
          <p className="mt-1 text-sm text-red-600">{errors.options}</p>
        )}

        {options.length < 10 && (
          <button
            type="button"
            onClick={handleAddOption}
            disabled={isLoading}
            className="mt-2 text-sm text-primary hover:text-primary-dark flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Option hinzufügen
          </button>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="primary" loading={isLoading}>
          {question ? "Speichern" : "Hinzufügen"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
