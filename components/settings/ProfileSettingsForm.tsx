"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { updateProfileSchema } from "@/lib/validation";

interface ProfileSettingsFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function ProfileSettingsForm({ initialData }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialData.firstName || "");
  const [lastName, setLastName] = useState(initialData.lastName || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    general?: string;
  }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(null);
    setIsLoading(true);

    // Check if any field was changed
    const hasChanges =
      firstName !== initialData.firstName ||
      lastName !== initialData.lastName ||
      email !== initialData.email;

    if (!hasChanges) {
      setErrors({
        general: "Keine Änderungen vorgenommen.",
      });
      setIsLoading(false);
      return;
    }

    // Build update data (only changed fields)
    const updateData: Record<string, string> = {};
    if (firstName !== initialData.firstName) updateData.firstName = firstName;
    if (lastName !== initialData.lastName) updateData.lastName = lastName;
    if (email !== initialData.email) updateData.email = email;

    // Client-side validation
    const validation = updateProfileSchema.safeParse(updateData);

    if (!validation.success) {
      const fieldErrors: {
        firstName?: string;
        lastName?: string;
        email?: string;
      } = {};
      validation.error.issues.forEach((error) => {
        const field = error.path[0];
        if (field === "firstName" || field === "lastName" || field === "email") {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/settings/profile", {
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

      // Success
      setSuccess("Profil erfolgreich aktualisiert.");
      router.refresh();
      setIsLoading(false);
    } catch (error) {
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

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
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
      />

      <Input
        label="E-Mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
        placeholder="max@beispiel.de"
        disabled={isLoading}
      />

      <Button type="submit" variant="primary" loading={isLoading}>
        Änderungen speichern
      </Button>
    </form>
  );
}
