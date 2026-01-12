"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { changePasswordSchema } from "@/lib/validation";

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(null);
    setIsLoading(true);

    // Client-side validation
    const validation = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const fieldErrors: {
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
      } = {};
      validation.error.issues.forEach((error) => {
        const field = error.path[0];
        if (
          field === "currentPassword" ||
          field === "newPassword" ||
          field === "confirmPassword"
        ) {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
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

      // Success - clear form
      setSuccess("Passwort erfolgreich geändert.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
        label="Aktuelles Passwort"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        error={errors.currentPassword}
        autoComplete="current-password"
        placeholder="••••••••"
        disabled={isLoading}
      />

      <Input
        label="Neues Passwort"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={errors.newPassword}
        autoComplete="new-password"
        placeholder="••••••••"
        disabled={isLoading}
      />

      <Input
        label="Neues Passwort bestätigen"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        autoComplete="new-password"
        placeholder="••••••••"
        disabled={isLoading}
      />

      <Button type="submit" variant="primary" loading={isLoading}>
        Passwort ändern
      </Button>
    </form>
  );
}
