"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { createStudentSchema, updateStudentSchema } from "@/lib/validation";

interface StudentFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    active: boolean;
    userId: string | null;
  };
  onSuccess: () => void;
}

export function StudentForm({ mode, initialData, onSuccess }: StudentFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialData?.firstName || "");
  const [lastName, setLastName] = useState(initialData?.lastName || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [active, setActive] = useState(initialData?.active ?? true);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (mode === "create") {
        const validation = createStudentSchema.safeParse({
          firstName,
          lastName,
          email,
        });

        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.issues.forEach((error) => {
            const field = error.path[0] as string;
            fieldErrors[field] = error.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/admin/students", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({
            general: data.error || "Ein Fehler ist aufgetreten.",
          });
          setIsLoading(false);
          return;
        }

        onSuccess();
        router.refresh();
      } else {
        const updateData: Record<string, unknown> = {};
        if (firstName !== initialData?.firstName) updateData.firstName = firstName;
        if (lastName !== initialData?.lastName) updateData.lastName = lastName;
        if (email !== initialData?.email) updateData.email = email;
        if (active !== initialData?.active) updateData.active = active;

        const validation = updateStudentSchema.safeParse(updateData);

        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.issues.forEach((error) => {
            const field = error.path[0] as string;
            if (field !== "_errors") {
              fieldErrors[field] = error.message;
            } else {
              fieldErrors.general = error.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        if (Object.keys(updateData).length === 0) {
          setErrors({
            general: "Keine \u00c4nderungen vorgenommen.",
          });
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/admin/students/${initialData?.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({
            general: data.error || "Ein Fehler ist aufgetreten.",
          });
          setIsLoading(false);
          return;
        }

        onSuccess();
        router.refresh();
      }
    } catch {
      setErrors({
        general: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <ErrorMessage message={errors.general} className="mb-4" />
      )}

      <Input
        label="Vorname"
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        error={errors.firstName}
        autoComplete="given-name"
        placeholder="Max"
        disabled={isLoading}
        required
      />

      <Input
        label="Nachname"
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        error={errors.lastName}
        autoComplete="family-name"
        placeholder="Mustermann"
        disabled={isLoading}
        required
      />

      <Input
        label="E-Mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
        placeholder="max.mustermann@lessing-ffm.net"
        disabled={isLoading}
        required
      />

      {mode === "edit" && (
        <>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary-light"
              disabled={isLoading}
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-700">
              Eintrag ist aktiv
            </label>
          </div>

          {initialData?.userId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Dieser Sch&uuml;ler hat sich bereits registriert.
              </p>
            </div>
          )}
        </>
      )}

      <Button type="submit" variant="primary" loading={isLoading}>
        {mode === "create" ? "Sch\u00fcler hinzuf\u00fcgen" : "\u00c4nderungen speichern"}
      </Button>
    </form>
  );
}
