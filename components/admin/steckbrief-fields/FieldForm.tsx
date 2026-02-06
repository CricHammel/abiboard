"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { FieldDefinition } from "@/lib/steckbrief-validation-dynamic";

interface FieldFormProps {
  field?: FieldDefinition;
  onSubmit: (data: Partial<FieldDefinition>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const FIELD_TYPES = [
  { value: "text", label: "Text (einzeilig)" },
  { value: "textarea", label: "Textfeld (mehrzeilig)" },
  { value: "date", label: "Datum" },
  { value: "single-image", label: "Einzelbild" },
  { value: "multi-image", label: "Mehrere Bilder" },
];

export function FieldForm({
  field,
  onSubmit,
  onCancel,
  isLoading,
}: FieldFormProps) {
  const isEditing = !!field;

  const [formData, setFormData] = useState({
    key: field?.key || "",
    type: field?.type || "textarea",
    label: field?.label || "",
    placeholder: field?.placeholder || "",
    maxLength: field?.maxLength?.toString() || "",
    maxFiles: field?.maxFiles?.toString() || "3",
    rows: field?.rows?.toString() || "4",
    required: field?.required || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!isEditing && !formData.key) {
      newErrors.key = "Key ist erforderlich.";
    } else if (!isEditing && !/^[a-z][a-zA-Z0-9]*$/.test(formData.key)) {
      newErrors.key =
        "Key muss mit einem Kleinbuchstaben beginnen und darf nur Buchstaben und Zahlen enthalten.";
    }

    if (!formData.label) {
      newErrors.label = "Label ist erforderlich.";
    }

    if (
      (formData.type === "text" || formData.type === "textarea") &&
      formData.maxLength &&
      isNaN(parseInt(formData.maxLength))
    ) {
      newErrors.maxLength = "Bitte gib eine gültige Zahl ein.";
    }

    if (
      formData.type === "multi-image" &&
      formData.maxFiles &&
      isNaN(parseInt(formData.maxFiles))
    ) {
      newErrors.maxFiles = "Bitte gib eine gültige Zahl ein.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data: Partial<FieldDefinition> = {
      label: formData.label,
      placeholder: formData.placeholder || null,
      required: formData.required,
    };

    if (!isEditing) {
      data.key = formData.key;
      data.type = formData.type as FieldDefinition["type"];
    }

    if (formData.type === "text" || formData.type === "textarea") {
      data.maxLength = formData.maxLength ? parseInt(formData.maxLength) : null;
    }

    if (formData.type === "textarea") {
      data.rows = formData.rows ? parseInt(formData.rows) : 4;
    }

    if (formData.type === "multi-image") {
      data.maxFiles = formData.maxFiles ? parseInt(formData.maxFiles) : 3;
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Key (only for new fields) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Key (technischer Name)
            </label>
            <input
              type="text"
              name="key"
              value={formData.key}
              onChange={handleChange}
              placeholder="z.B. favoriteSubject"
              className={`
                w-full px-4 py-3 border rounded-lg text-base
                focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary
                ${errors.key ? "border-error ring-2 ring-red-100" : "border-gray-200"}
              `}
              disabled={isLoading}
            />
            {errors.key && (
              <p className="mt-1 text-sm text-error">{errors.key}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Kann nach dem Erstellen nicht mehr geändert werden.
            </p>
          </div>
        )}

        {/* Type (only for new fields) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Feldtyp
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
              disabled={isLoading}
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Kann nach dem Erstellen nicht mehr geändert werden.
            </p>
          </div>
        )}

        {/* Label */}
        <div className={isEditing ? "sm:col-span-2" : ""}>
          <Input
            label="Label (Anzeigename)"
            name="label"
            value={formData.label}
            onChange={handleChange}
            placeholder="z.B. Lieblingsfach"
            error={errors.label}
            disabled={isLoading}
          />
        </div>

        {/* Placeholder */}
        <div className={isEditing ? "sm:col-span-2" : ""}>
          <Input
            label="Platzhaltertext (optional)"
            name="placeholder"
            value={formData.placeholder}
            onChange={handleChange}
            placeholder="z.B. Was war dein Lieblingsfach?"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Type-specific options */}
      {(formData.type === "text" || formData.type === "textarea") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Maximale Zeichenzahl (optional)"
            name="maxLength"
            type="number"
            value={formData.maxLength}
            onChange={handleChange}
            placeholder="z.B. 500"
            error={errors.maxLength}
            disabled={isLoading}
          />
          {formData.type === "textarea" && (
            <Input
              label="Zeilen (Höhe)"
              name="rows"
              type="number"
              value={formData.rows}
              onChange={handleChange}
              placeholder="z.B. 4"
              disabled={isLoading}
            />
          )}
        </div>
      )}

      {formData.type === "multi-image" && (
        <Input
          label="Maximale Anzahl Bilder"
          name="maxFiles"
          type="number"
          value={formData.maxFiles}
          onChange={handleChange}
          placeholder="z.B. 3"
          error={errors.maxFiles}
          disabled={isLoading}
        />
      )}

      {/* Required checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          name="required"
          checked={formData.required}
          onChange={handleChange}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          disabled={isLoading}
        />
        <label htmlFor="required" className="text-sm text-gray-700">
          Pflichtfeld (muss ausgefüllt werden)
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" loading={isLoading}>
          {isEditing ? "Speichern" : "Erstellen"}
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
