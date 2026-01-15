"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FieldRenderer } from "./FieldRenderer";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import type { FieldDefinition } from "@/lib/steckbrief-validation-dynamic";

interface SteckbriefFormProps {
  fields: FieldDefinition[];
  initialValues: Record<string, unknown>;
  status: string;
  feedback?: string | null;
}

// Helper to initialize state for a field
function initializeFieldState(
  field: FieldDefinition,
  value: unknown
): unknown {
  switch (field.type) {
    case "text":
    case "textarea":
      return (value as string) || "";
    case "single-image":
      return {
        preview: (value as string | null) || null,
        file: null as File | null,
      };
    case "multi-image":
      return {
        existing: (value as string[]) || [],
        new: [] as File[],
      };
    default:
      return value || "";
  }
}

// Helper to check if a value has changed from saved state
function hasValueChanged(
  field: FieldDefinition,
  current: unknown,
  saved: unknown
): boolean {
  switch (field.type) {
    case "text":
    case "textarea":
      return current !== saved;
    case "single-image": {
      const curr = current as { preview: string | null; file: File | null };
      return curr.file !== null;
    }
    case "multi-image": {
      const curr = current as { existing: string[]; new: File[] };
      const savedArr = (saved as string[]) || [];
      return (
        curr.new.length > 0 ||
        JSON.stringify(curr.existing) !== JSON.stringify(savedArr)
      );
    }
    default:
      return false;
  }
}

export function SteckbriefForm({
  fields,
  initialValues,
  status,
  feedback,
}: SteckbriefFormProps) {
  const router = useRouter();

  // Initialize form state dynamically from fields
  const [formState, setFormState] = useState<Record<string, unknown>>(() => {
    const state: Record<string, unknown> = {};
    for (const field of fields) {
      state[field.key] = initializeFieldState(field, initialValues[field.key]);
    }
    return state;
  });

  // Track last saved state for comparison
  const [lastSavedState, setLastSavedState] = useState<Record<string, unknown>>(
    () => {
      const state: Record<string, unknown> = {};
      for (const field of fields) {
        switch (field.type) {
          case "text":
          case "textarea":
            state[field.key] = (initialValues[field.key] as string) || "";
            break;
          case "single-image":
            state[field.key] = (initialValues[field.key] as string | null) || null;
            break;
          case "multi-image":
            state[field.key] = (initialValues[field.key] as string[]) || [];
            break;
        }
      }
      return state;
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRetractDialog, setShowRetractDialog] = useState(false);

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    for (const field of fields) {
      if (hasValueChanged(field, formState[field.key], lastSavedState[field.key])) {
        return true;
      }
    }
    return false;
  }, [fields, formState, lastSavedState]);

  // Hook for unsaved changes warning on navigation
  useUnsavedChangesWarning(hasUnsavedChanges && !isLoading);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isLoading) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isLoading]);

  const handleFieldChange = (key: string, value: unknown) => {
    const field = fields.find((f) => f.key === key);
    if (!field) return;

    setFormState((prev) => {
      const newState = { ...prev };

      switch (field.type) {
        case "text":
        case "textarea":
          newState[key] = value;
          break;
        case "single-image":
          // value is the new File or null
          newState[key] = {
            ...(prev[key] as { preview: string | null; file: File | null }),
            file: value as File | null,
          };
          break;
        case "multi-image":
          // value is { existing: string[], new: File[] }
          newState[key] = value;
          break;
      }

      return newState;
    });
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm("draft");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm("submit");
  };

  const handleRetract = async () => {
    setIsLoading(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/steckbrief/retract", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setGeneralError(data.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        setShowRetractDialog(false);
        return;
      }

      setSuccessMessage(
        "Einreichung erfolgreich zurückgezogen. Du kannst den Steckbrief jetzt bearbeiten."
      );
      setShowRetractDialog(false);
      router.refresh();
      setIsLoading(false);
    } catch {
      setGeneralError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      setIsLoading(false);
      setShowRetractDialog(false);
    }
  };

  const submitForm = async (action: "draft" | "submit") => {
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      // Build FormData for multipart upload
      const formDataToSend = new FormData();

      for (const field of fields) {
        const value = formState[field.key];

        switch (field.type) {
          case "text":
          case "textarea":
            formDataToSend.append(field.key, (value as string) || "");
            break;

          case "single-image": {
            const imgState = value as {
              preview: string | null;
              file: File | null;
            };
            if (imgState.file) {
              formDataToSend.append(`image_${field.key}`, imgState.file);
            }
            break;
          }

          case "multi-image": {
            const multiState = value as { existing: string[]; new: File[] };
            // Send existing images as JSON
            formDataToSend.append(
              `existing_${field.key}`,
              JSON.stringify(multiState.existing)
            );
            // Send new files
            for (const file of multiState.new) {
              formDataToSend.append(`new_${field.key}`, file);
            }
            break;
          }
        }
      }

      // Save or submit
      if (action === "draft") {
        const response = await fetch("/api/steckbrief", {
          method: "PATCH",
          body: formDataToSend,
        });

        const data = await response.json();

        if (!response.ok) {
          setGeneralError(data.error || "Ein Fehler ist aufgetreten.");
          setIsLoading(false);
          return;
        }

        // Update state from server response
        updateStateFromResponse(data.values);

        setSuccessMessage("Steckbrief als Entwurf gespeichert.");
        router.refresh();
      } else {
        // First save, then submit
        const saveResponse = await fetch("/api/steckbrief", {
          method: "PATCH",
          body: formDataToSend,
        });

        if (!saveResponse.ok) {
          const data = await saveResponse.json();
          setGeneralError(data.error || "Ein Fehler ist aufgetreten.");
          setIsLoading(false);
          return;
        }

        const saveData = await saveResponse.json();

        // Update state from server response
        updateStateFromResponse(saveData.values);

        // Now submit for review
        const submitResponse = await fetch("/api/steckbrief/submit", {
          method: "POST",
        });

        const data = await submitResponse.json();

        if (!submitResponse.ok) {
          setGeneralError(data.error || "Ein Fehler ist aufgetreten.");
          setIsLoading(false);
          return;
        }

        setSuccessMessage("Steckbrief erfolgreich eingereicht!");
        router.refresh();
      }

      setIsLoading(false);
    } catch {
      setGeneralError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      setIsLoading(false);
    }
  };

  const updateStateFromResponse = (values: Record<string, unknown>) => {
    const newFormState: Record<string, unknown> = {};
    const newSavedState: Record<string, unknown> = {};

    for (const field of fields) {
      const serverValue = values[field.key];

      switch (field.type) {
        case "text":
        case "textarea":
          newFormState[field.key] = (serverValue as string) || "";
          newSavedState[field.key] = (serverValue as string) || "";
          break;
        case "single-image":
          newFormState[field.key] = {
            preview: (serverValue as string | null) || null,
            file: null,
          };
          newSavedState[field.key] = (serverValue as string | null) || null;
          break;
        case "multi-image":
          newFormState[field.key] = {
            existing: (serverValue as string[]) || [],
            new: [],
          };
          newSavedState[field.key] = (serverValue as string[]) || [];
          break;
      }
    }

    setFormState(newFormState);
    setLastSavedState(newSavedState);
  };

  const isSubmitted = status !== "DRAFT";

  // Get the value to pass to FieldRenderer
  const getFieldValue = (field: FieldDefinition): unknown => {
    const value = formState[field.key];

    switch (field.type) {
      case "text":
      case "textarea":
        return value;
      case "single-image": {
        const imgState = value as {
          preview: string | null;
          file: File | null;
        };
        return imgState.preview;
      }
      case "multi-image": {
        const multiState = value as { existing: string[]; new: File[] };
        return { existing: multiState.existing, new: multiState.new };
      }
      default:
        return value;
    }
  };

  return (
    <form className="space-y-6">
      {generalError && <ErrorMessage message={generalError} />}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {isSubmitted && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
          Dein Steckbrief wurde eingereicht und wird geprüft. Du kannst ihn
          nicht mehr bearbeiten.
        </div>
      )}

      {feedback && status === "DRAFT" && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <strong>Feedback vom Abi-Komitee:</strong>
          <p className="mt-1">{feedback}</p>
        </div>
      )}

      {fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={getFieldValue(field)}
          onChange={(value) => handleFieldChange(field.key, value)}
          error={errors[field.key]}
          disabled={isLoading || isSubmitted}
        />
      ))}

      {!isSubmitted && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={handleSaveDraft}
            variant="secondary"
            loading={isLoading}
            className="flex-1"
          >
            Als Entwurf speichern
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            variant="primary"
            loading={isLoading}
            className="flex-1"
          >
            Zur Prüfung einreichen
          </Button>
        </div>
      )}

      {status === "SUBMITTED" && (
        <div className="pt-4">
          <Button
            type="button"
            onClick={() => setShowRetractDialog(true)}
            variant="secondary"
            loading={isLoading}
          >
            Einreichung zurückziehen
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={showRetractDialog}
        title="Einreichung zurückziehen"
        message="Möchtest du deine Einreichung wirklich zurückziehen? Du kannst den Steckbrief danach wieder bearbeiten."
        confirmText="Zurückziehen"
        variant="warning"
        onConfirm={handleRetract}
        onCancel={() => setShowRetractDialog(false)}
        isLoading={isLoading}
      />
    </form>
  );
}
