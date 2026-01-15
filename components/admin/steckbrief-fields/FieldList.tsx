"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { FieldDefinition } from "@/lib/steckbrief-validation-dynamic";

interface FieldListProps {
  fields: FieldDefinition[];
  onEdit: (field: FieldDefinition) => void;
  onToggleActive: (field: FieldDefinition) => void;
  onReorder: (fields: FieldDefinition[]) => void;
  disabled?: boolean;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  textarea: "Textfeld",
  "single-image": "Einzelbild",
  "multi-image": "Mehrere Bilder",
};

export function FieldList({
  fields,
  onEdit,
  onToggleActive,
  onReorder,
  disabled,
}: FieldListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || disabled) return;

    const newFields = [...fields];
    const [draggedItem] = newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    onReorder(newFields);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveField = (index: number, direction: "up" | "down") => {
    if (disabled) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    const [item] = newFields.splice(index, 1);
    newFields.splice(newIndex, 0, item);
    onReorder(newFields);
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Keine Felder vorhanden. Erstelle ein neues Feld.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div
          key={field.id}
          draggable={!disabled}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            flex items-center gap-4 p-4 bg-white border rounded-lg
            ${!disabled ? "cursor-move" : ""}
            ${draggedIndex === index ? "opacity-50" : ""}
            ${!field.active ? "opacity-60 bg-gray-50" : ""}
            transition-all
          `}
        >
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

          {/* Field Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{field.label}</span>
              {!field.active && (
                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                  Deaktiviert
                </span>
              )}
              {field.required && (
                <span className="px-2 py-0.5 text-xs bg-primary-light text-primary rounded">
                  Pflicht
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span>{FIELD_TYPE_LABELS[field.type] || field.type}</span>
              <span className="text-gray-300">|</span>
              <code className="text-xs bg-gray-100 px-1 rounded">
                {field.key}
              </code>
              {field.maxLength && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>Max. {field.maxLength} Zeichen</span>
                </>
              )}
              {field.maxFiles && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>Max. {field.maxFiles} Bilder</span>
                </>
              )}
            </div>
          </div>

          {/* Move Buttons (Mobile) */}
          <div className="flex flex-col gap-1 sm:hidden">
            <button
              onClick={() => moveField(index, "up")}
              disabled={disabled || index === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => moveField(index, "down")}
              disabled={disabled || index === fields.length - 1}
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
              onClick={() => onEdit(field)}
              disabled={disabled}
              className="!py-2 !px-3 !text-sm"
            >
              Bearbeiten
            </Button>
            <Button
              variant={field.active ? "secondary" : "primary"}
              onClick={() => onToggleActive(field)}
              disabled={disabled}
              className="!py-2 !px-3 !text-sm"
            >
              {field.active ? "Deaktivieren" : "Aktivieren"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
