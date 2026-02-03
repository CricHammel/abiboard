"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Teacher {
  id: string;
  salutation: "HERR" | "FRAU";
  firstName: string | null;
  lastName: string;
  subject: string | null;
  active: boolean;
}

interface TeacherFormProps {
  teacher?: Teacher;
  onSubmit: (data: {
    salutation: "HERR" | "FRAU";
    lastName: string;
    firstName?: string | null;
    subject?: string | null;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TeacherForm({
  teacher,
  onSubmit,
  onCancel,
  isLoading,
}: TeacherFormProps) {
  const [salutation, setSalutation] = useState<"HERR" | "FRAU">(
    teacher?.salutation || "HERR"
  );
  const [lastName, setLastName] = useState(teacher?.lastName || "");
  const [firstName, setFirstName] = useState(teacher?.firstName || "");
  const [subject, setSubject] = useState(teacher?.subject || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!lastName.trim()) {
      setErrors({ lastName: "Bitte gib einen Nachnamen ein." });
      return;
    }

    onSubmit({
      salutation,
      lastName: lastName.trim(),
      firstName: firstName.trim() || null,
      subject: subject.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="salutation"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Anrede *
          </label>
          <select
            id="salutation"
            value={salutation}
            onChange={(e) => setSalutation(e.target.value as "HERR" | "FRAU")}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light min-h-[44px] text-base"
            disabled={isLoading}
          >
            <option value="HERR">Herr</option>
            <option value="FRAU">Frau</option>
          </select>
        </div>

        <Input
          label="Nachname *"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          error={errors.lastName}
          placeholder="Müller"
          disabled={isLoading}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Vorname"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Thomas (optional)"
          disabled={isLoading}
        />

        <Input
          label="Fach"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Mathe (optional)"
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={isLoading}>
          {teacher ? "Speichern" : "Hinzufügen"}
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
