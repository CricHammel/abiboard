"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FieldRenderer } from "./FieldRenderer";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import type { FieldDefinition } from "@/lib/steckbrief-validation-dynamic";

interface SteckbriefFormProps {
  fields: FieldDefinition[];
  initialValues: Record<string, unknown>;
  status: string;
  deadlinePassed?: boolean;
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
  status: initialStatus,
  deadlinePassed = false,
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

  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showRetractDialog, setShowRetractDialog] = useState(false);
  const [showSaveRetractDialog, setShowSaveRetractDialog] = useState(false);

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
    if (currentStatus === "SUBMITTED") {
      setShowSaveRetractDialog(true);
      return;
    }
    await submitForm("draft");
  };

  const handleConfirmSaveRetract = async () => {
    setShowSaveRetractDialog(false);
    await submitForm("draft");
  };

  const handleSubmit = async () => {
    setShowSubmitDialog(false);
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

      setCurrentStatus("DRAFT");
      setSuccessMessage("Steckbrief als nicht fertig markiert.");
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

        // Update status from server (may have been auto-retracted)
        if (data.profile?.status) {
          setCurrentStatus(data.profile.status);
        }

        setSuccessMessage("Steckbrief gespeichert.");
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

        // Now submit (mark as done)
        const submitResponse = await fetch("/api/steckbrief/submit", {
          method: "POST",
        });

        const data = await submitResponse.json();

        if (!submitResponse.ok) {
          setGeneralError(data.error || "Ein Fehler ist aufgetreten.");
          setIsLoading(false);
          return;
        }

        setCurrentStatus("SUBMITTED");
        setSuccessMessage("Steckbrief eingereicht.");
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

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {currentStatus === "SUBMITTED" && (
        <Alert variant="success">
          Dein Steckbrief ist eingereicht und wird ins Abibuch übernommen. Du kannst ihn weiterhin bearbeiten – der Status wird dann zurückgesetzt.
        </Alert>
      )}

      {fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={getFieldValue(field)}
          onChange={(value) => handleFieldChange(field.key, value)}
          error={errors[field.key]}
          disabled={isLoading || deadlinePassed}
        />
      ))}

      {!deadlinePassed && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={handleSaveDraft}
            variant="secondary"
            loading={isLoading}
            className="flex-1"
          >
            Speichern
          </Button>
          {currentStatus === "DRAFT" ? (
            <Button
              type="button"
              onClick={() => setShowSubmitDialog(true)}
              variant="primary"
              loading={isLoading}
              className="flex-1"
            >
              Einreichen
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setShowRetractDialog(true)}
              variant="secondary"
              loading={isLoading}
              className="flex-1"
            >
              Zurückziehen
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showSubmitDialog}
        title="Steckbrief einreichen"
        message="Dein Steckbrief wird als fertig markiert und kann ins Abibuch übernommen werden. Du kannst ihn weiterhin bearbeiten – der Status wird dann zurückgesetzt."
        confirmText="Einreichen"
        variant="warning"
        onConfirm={handleSubmit}
        onCancel={() => setShowSubmitDialog(false)}
        isLoading={isLoading}
      />

      <ConfirmDialog
        isOpen={showRetractDialog}
        title="Einreichung zurückziehen"
        message="Möchtest du deinen Steckbrief als noch nicht fertig markieren?"
        confirmText="Zurückziehen"
        variant="warning"
        onConfirm={handleRetract}
        onCancel={() => setShowRetractDialog(false)}
        isLoading={isLoading}
      />

      <ConfirmDialog
        isOpen={showSaveRetractDialog}
        title="Steckbrief bearbeiten"
        message="Dein Steckbrief wurde bereits eingereicht. Durch das Speichern wird der Status auf Entwurf zurückgesetzt und muss erneut eingereicht werden."
        confirmText="Speichern und zurücksetzen"
        variant="warning"
        onConfirm={handleConfirmSaveRetract}
        onCancel={() => setShowSaveRetractDialog(false)}
        isLoading={isLoading}
      />
    </form>
  );
}
