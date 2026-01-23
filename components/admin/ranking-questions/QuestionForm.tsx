"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Question {
  id: string;
  text: string;
  type: "STUDENT" | "TEACHER";
  genderSpecific: boolean;
  order: number;
  active: boolean;
}

interface QuestionFormProps {
  question?: Question;
  onSubmit: (data: {
    text: string;
    type: "STUDENT" | "TEACHER";
    genderSpecific: boolean;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QuestionForm({
  question,
  onSubmit,
  onCancel,
  isLoading,
}: QuestionFormProps) {
  const [text, setText] = useState(question?.text || "");
  const [type, setType] = useState<"STUDENT" | "TEACHER">(
    question?.type || "STUDENT"
  );
  const [genderSpecific, setGenderSpecific] = useState(
    question?.genderSpecific ?? false
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
      genderSpecific,
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

        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            id="genderSpecific"
            checked={genderSpecific}
            onChange={(e) => setGenderSpecific(e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary-light"
            disabled={isLoading}
          />
          <label
            htmlFor="genderSpecific"
            className="ml-2 text-sm text-gray-700 cursor-pointer"
          >
            Geschlechtsspezifisch (je eine Antwort für m/w)
          </label>
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
