import { z } from "zod";
import { FieldType, SteckbriefField } from "@prisma/client";

/**
 * Dynamically generates a Zod validation schema based on field definitions.
 * This allows validation rules to be defined in the database and applied at runtime.
 */
export function createDynamicValidationSchema(fields: SteckbriefField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    // Skip inactive fields
    if (!field.active) continue;

    let validator: z.ZodTypeAny;

    switch (field.type) {
      case FieldType.TEXT:
      case FieldType.TEXTAREA: {
        let textValidator = z.string();

        if (field.maxLength) {
          textValidator = textValidator.max(
            field.maxLength,
            `${field.label} darf maximal ${field.maxLength} Zeichen lang sein.`
          );
        }

        // Text fields are always optional for draft saves
        // Required check happens on submit
        validator = textValidator.optional().or(z.literal(""));
        break;
      }

      case FieldType.SINGLE_IMAGE:
        // Image validation happens separately via file upload utilities
        // Here we just validate the URL string if provided
        validator = z.string().optional().nullable();
        break;

      case FieldType.MULTI_IMAGE: {
        const maxFiles = field.maxFiles || 3;
        validator = z
          .array(z.string())
          .max(maxFiles, `Maximal ${maxFiles} Bilder erlaubt.`)
          .optional()
          .default([]);
        break;
      }

      default:
        // Unknown field type - skip validation
        continue;
    }

    shape[field.key] = validator;
  }

  return z.object(shape);
}

/**
 * Validates required fields for submission.
 * Returns an array of error messages for missing required fields.
 */
export function validateRequiredFields(
  fields: SteckbriefField[],
  values: Record<string, unknown>
): string[] {
  const errors: string[] = [];

  for (const field of fields) {
    if (!field.active || !field.required) continue;

    const value = values[field.key];

    switch (field.type) {
      case FieldType.TEXT:
      case FieldType.TEXTAREA:
        if (!value || (typeof value === "string" && value.trim() === "")) {
          errors.push(`${field.label} ist ein Pflichtfeld.`);
        }
        break;

      case FieldType.SINGLE_IMAGE:
        if (!value) {
          errors.push(`${field.label} ist ein Pflichtfeld.`);
        }
        break;

      case FieldType.MULTI_IMAGE:
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors.push(`${field.label} ist ein Pflichtfeld.`);
        }
        break;
    }
  }

  return errors;
}

/**
 * Type definition for field values used in the frontend
 */
export interface FieldDefinition {
  id: string;
  key: string;
  type: "text" | "textarea" | "single-image" | "multi-image";
  label: string;
  placeholder?: string | null;
  maxLength?: number | null;
  maxFiles?: number | null;
  rows?: number | null;
  required: boolean;
  order: number;
  active: boolean;
}

/**
 * Convert Prisma FieldType enum to frontend string type
 */
export function mapFieldType(type: FieldType): FieldDefinition["type"] {
  const mapping: Record<FieldType, FieldDefinition["type"]> = {
    TEXT: "text",
    TEXTAREA: "textarea",
    SINGLE_IMAGE: "single-image",
    MULTI_IMAGE: "multi-image",
  };
  return mapping[type];
}

/**
 * Convert a Prisma SteckbriefField to a FieldDefinition for the frontend
 */
export function toFieldDefinition(field: SteckbriefField): FieldDefinition {
  return {
    id: field.id,
    key: field.key,
    type: mapFieldType(field.type),
    label: field.label,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    maxFiles: field.maxFiles,
    rows: field.rows,
    required: field.required,
    order: field.order,
    active: field.active,
  };
}
