"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { FieldList } from "./FieldList";
import { FieldForm } from "./FieldForm";
import type { FieldDefinition } from "@/lib/steckbrief-validation-dynamic";

interface FieldManagementProps {
  initialFields: FieldDefinition[];
}

export function FieldManagement({ initialFields }: FieldManagementProps) {
  const [fields, setFields] = useState<FieldDefinition[]>(initialFields);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreate = async (data: Partial<FieldDefinition>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/steckbrief-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          type: data.type?.toUpperCase().replace("-", "_"),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      // Add new field to local state
      if (result.field) {
        const newField: FieldDefinition = {
          id: result.field.id,
          key: result.field.key,
          type: result.field.type.toLowerCase().replace("_", "-") as FieldDefinition["type"],
          label: result.field.label,
          placeholder: result.field.placeholder,
          maxLength: result.field.maxLength,
          maxFiles: result.field.maxFiles,
          rows: result.field.rows,
          required: result.field.required,
          order: result.field.order,
          active: result.field.active,
        };
        setFields((prev) => [...prev, newField]);
      }

      setSuccessMessage("Feld erfolgreich erstellt.");
      setIsCreating(false);
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: Partial<FieldDefinition>) => {
    if (!editingField) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/steckbrief-fields/${editingField.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      // Update field in local state
      if (result.field) {
        setFields((prev) =>
          prev.map((f) =>
            f.id === editingField.id
              ? {
                  ...f,
                  label: result.field.label,
                  placeholder: result.field.placeholder,
                  maxLength: result.field.maxLength,
                  maxFiles: result.field.maxFiles,
                  rows: result.field.rows,
                  required: result.field.required,
                  order: result.field.order,
                  active: result.field.active,
                }
              : f
          )
        );
      }

      setSuccessMessage("Feld erfolgreich aktualisiert.");
      setEditingField(null);
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (field: FieldDefinition) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/steckbrief-fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !field.active }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      // Update local state
      setFields((prev) =>
        prev.map((f) =>
          f.id === field.id ? { ...f, active: !f.active } : f
        )
      );
      setSuccessMessage(
        field.active ? "Feld deaktiviert." : "Feld aktiviert."
      );
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (reorderedFields: FieldDefinition[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/steckbrief-fields/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldOrders: reorderedFields.map((f, index) => ({
            id: f.id,
            order: index + 1,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      setFields(reorderedFields.map((f, index) => ({ ...f, order: index + 1 })));
      setSuccessMessage("Reihenfolge aktualisiert.");
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {fields.length} Felder
        </h2>
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditingField(null);
            setError(null);
            setSuccessMessage(null);
          }}
          variant="primary"
          disabled={isLoading || isCreating}
          className="!w-auto"
        >
          Neues Feld
        </Button>
      </div>

      {isCreating && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Neues Feld erstellen
          </h3>
          <FieldForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isLoading={isLoading}
          />
        </div>
      )}

      {editingField && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Feld bearbeiten: {editingField.label}
          </h3>
          <FieldForm
            field={editingField}
            onSubmit={handleUpdate}
            onCancel={() => setEditingField(null)}
            isLoading={isLoading}
          />
        </div>
      )}

      <FieldList
        fields={fields}
        onEdit={(field) => {
          setEditingField(field);
          setIsCreating(false);
          setError(null);
          setSuccessMessage(null);
        }}
        onToggleActive={handleToggleActive}
        onReorder={handleReorder}
        disabled={isLoading || isCreating || !!editingField}
      />
    </div>
  );
}
