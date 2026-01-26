"use client";

import { useState, useEffect } from "react";
import { PersonAutocomplete } from "@/components/rankings/PersonAutocomplete";
import { Button } from "@/components/ui/Button";

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | null;
}

interface TeacherOption {
  id: string;
  salutation: "HERR" | "FRAU";
  firstName: string | null;
  lastName: string;
  subject: string | null;
}

type PersonOption =
  | { type: "student"; data: StudentOption }
  | { type: "teacher"; data: TeacherOption };

interface CommentFormProps {
  // For create mode
  allStudents?: StudentOption[];
  allTeachers?: TeacherOption[];
  excludeUserId?: string;
  onSubmit: (data: { text: string; targetType: "STUDENT" | "TEACHER"; targetId: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  // For edit mode
  editMode?: boolean;
  initialText?: string;
  initialTargetType?: "STUDENT" | "TEACHER";
  initialTargetName?: string;
}

const MAX_LENGTH = 500;

export function CommentForm({
  allStudents,
  allTeachers,
  excludeUserId,
  onSubmit,
  onCancel,
  isLoading,
  editMode,
  initialText = "",
  initialTargetType,
  initialTargetName,
}: CommentFormProps) {
  const [targetType, setTargetType] = useState<"STUDENT" | "TEACHER">(
    initialTargetType || "STUDENT"
  );
  const [selectedPerson, setSelectedPerson] = useState<PersonOption | null>(null);
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);

  // Reset selection when target type changes (only in create mode)
  useEffect(() => {
    if (!editMode) {
      setSelectedPerson(null);
    }
  }, [targetType, editMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editMode && !selectedPerson) {
      setError("Bitte wähle eine Person aus.");
      return;
    }

    if (!text.trim()) {
      setError("Bitte gib einen Kommentar ein.");
      return;
    }

    if (text.length > MAX_LENGTH) {
      setError(`Der Kommentar darf maximal ${MAX_LENGTH} Zeichen lang sein.`);
      return;
    }

    try {
      await onSubmit({
        text: text.trim(),
        targetType: editMode ? initialTargetType! : targetType,
        targetId: editMode ? "" : selectedPerson!.data.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Target Type Selection (only in create mode) */}
      {!editMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kommentar für
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="targetType"
                value="STUDENT"
                checked={targetType === "STUDENT"}
                onChange={() => setTargetType("STUDENT")}
                className="w-4 h-4 text-primary-dark focus:ring-primary-light"
              />
              <span className="text-sm text-gray-700">Mitschüler/in</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="targetType"
                value="TEACHER"
                checked={targetType === "TEACHER"}
                onChange={() => setTargetType("TEACHER")}
                className="w-4 h-4 text-primary-dark focus:ring-primary-light"
              />
              <span className="text-sm text-gray-700">Lehrer/in</span>
            </label>
          </div>
        </div>
      )}

      {/* Person Selection (only in create mode) */}
      {!editMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Person auswählen
          </label>
          <PersonAutocomplete
            personType={targetType === "STUDENT" ? "student" : "teacher"}
            excludeUserId={targetType === "STUDENT" ? excludeUserId : undefined}
            selectedPerson={selectedPerson}
            allStudents={allStudents}
            allTeachers={allTeachers}
            onSelect={setSelectedPerson}
            placeholder={targetType === "STUDENT" ? "Name eingeben..." : "Lehrer suchen..."}
          />
        </div>
      )}

      {/* Show target in edit mode */}
      {editMode && initialTargetName && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kommentar für
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
            {initialTargetName}
          </div>
        </div>
      )}

      {/* Comment Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dein Kommentar
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Schreibe einen netten Kommentar..."
          rows={4}
          maxLength={MAX_LENGTH}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light resize-y text-base"
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${text.length > MAX_LENGTH ? "text-red-500" : "text-gray-400"}`}>
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Abbrechen
        </Button>
        <Button type="submit" loading={isLoading}>
          {editMode ? "Speichern" : "Kommentar hinzufügen"}
        </Button>
      </div>
    </form>
  );
}
