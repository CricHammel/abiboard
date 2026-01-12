"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { createUserSchema, updateUserSchema } from "@/lib/validation";
import { Role } from "@prisma/client";

interface UserFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    active: boolean;
  };
  onSuccess: () => void;
}

export function UserForm({ mode, initialData, onSuccess }: UserFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(initialData?.firstName || "");
  const [lastName, setLastName] = useState(initialData?.lastName || "");
  const [role, setRole] = useState<Role>(initialData?.role || "STUDENT");
  const [active, setActive] = useState(initialData?.active ?? true);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (mode === "create") {
        // Client-side validation for create
        const validation = createUserSchema.safeParse({
          email,
          password,
          firstName,
          lastName,
          role,
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

        // Create user
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName,
            role,
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

        // Success
        onSuccess();
        router.refresh();
      } else {
        // Edit mode
        const updateData: Record<string, any> = {};
        if (email !== initialData?.email) updateData.email = email;
        if (firstName !== initialData?.firstName)
          updateData.firstName = firstName;
        if (lastName !== initialData?.lastName) updateData.lastName = lastName;
        if (role !== initialData?.role) updateData.role = role;
        if (active !== initialData?.active) updateData.active = active;

        // Client-side validation for update
        const validation = updateUserSchema.safeParse(updateData);

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
            general: "Keine Änderungen vorgenommen.",
          });
          setIsLoading(false);
          return;
        }

        // Update user
        const response = await fetch(`/api/admin/users/${initialData?.id}`, {
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
        onSuccess();
        router.refresh();
      }
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

      <Input
        label="E-Mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
        placeholder="max@beispiel.de"
        disabled={isLoading}
        required
      />

      {mode === "create" && (
        <Input
          label="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          placeholder="••••••••"
          disabled={isLoading}
          required
        />
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rolle
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
          disabled={isLoading}
          required
        >
          <option value="STUDENT">Student</option>
          <option value="ADMIN">Admin</option>
        </select>
        {errors.role && (
          <p className="text-red-600 text-sm mt-1">{errors.role}</p>
        )}
      </div>

      {mode === "edit" && (
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
            Benutzer ist aktiv
          </label>
        </div>
      )}

      <Button type="submit" variant="primary" loading={isLoading}>
        {mode === "create" ? "Benutzer erstellen" : "Änderungen speichern"}
      </Button>
    </form>
  );
}
