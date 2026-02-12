"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AnswerMode = "SINGLE" | "GENDER_SPECIFIC" | "DUO";

interface Question {
  id: string;
  text: string;
  type: "STUDENT" | "TEACHER";
  answerMode: AnswerMode;
  order: number;
  active: boolean;
}

interface QuestionFormProps {
  question?: Question;
  defaultType?: "STUDENT" | "TEACHER";
  onSubmit: (data: {
    text: string;
    type: "STUDENT" | "TEACHER";
    answerMode: AnswerMode;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QuestionForm({
  question,
  defaultType,
  onSubmit,
  onCancel,
  isLoading,
}: QuestionFormProps) {
  const [text, setText] = useState(question?.text || "");
  const [type, setType] = useState<"STUDENT" | "TEACHER">(
    question?.type || defaultType || "STUDENT"
  );
  const [answerMode, setAnswerMode] = useState<AnswerMode>(
    question?.answerMode ?? "SINGLE"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!text.trim()) {
      setErrors({ text: "Bitte gib einen Fragetext ein." });
      return;
    }

    onSubmit({
      text: text.trim(),
      type,
      answerMode,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Fragetext *"
        value={text}
        onChange={(e) => setText(e.target.value)}
        error={errors.text}
        placeholder="z.B. Wer kommt immer zu spät?"
        disabled={isLoading}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="questionType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Typ *
          </label>
          <select
            id="questionType"
            value={type}
            onChange={(e) => setType(e.target.value as "STUDENT" | "TEACHER")}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light min-h-[44px] text-base"
            disabled={isLoading}
          >
            <option value="STUDENT">Schüler</option>
            <option value="TEACHER">Lehrer</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="answerMode"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Antwort-Modus *
          </label>
          <select
            id="answerMode"
            value={answerMode}
            onChange={(e) => setAnswerMode(e.target.value as AnswerMode)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light min-h-[44px] text-base"
            disabled={isLoading}
          >
            <option value="SINGLE">Einzeln (eine Person)</option>
            <option value="GENDER_SPECIFIC">Geschlechtsspezifisch (je m/w)</option>
            <option value="DUO">Duo (zwei Personen)</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
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
