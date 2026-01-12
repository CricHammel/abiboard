"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { registerSchema } from "@/lib/validation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Client-side validation
    const validation = registerSchema.safeParse(formData);

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

    try {
      // Call server action to create user
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || "Registrierung fehlgeschlagen." });
        setIsLoading(false);
        return;
      }

      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({
          general:
            "Registrierung erfolgreich, aber Anmeldung fehlgeschlagen. Bitte melde dich manuell an.",
        });
        setIsLoading(false);
        return;
      }

      // Successful registration and login
      router.push("/");
      router.refresh();
    } catch (error) {
      setErrors({
        general: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
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
        value={formData.firstName}
        onChange={(e) => handleChange("firstName", e.target.value)}
        error={errors.firstName}
        autoComplete="given-name"
        placeholder="Max"
        disabled={isLoading}
      />

      <Input
        label="Nachname"
        type="text"
        value={formData.lastName}
        onChange={(e) => handleChange("lastName", e.target.value)}
        error={errors.lastName}
        autoComplete="family-name"
        placeholder="Mustermann"
        disabled={isLoading}
      />

      <Input
        label="E-Mail"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange("email", e.target.value)}
        error={errors.email}
        autoComplete="email"
        placeholder="max@beispiel.de"
        disabled={isLoading}
      />

      <Input
        label="Passwort"
        type="password"
        value={formData.password}
        onChange={(e) => handleChange("password", e.target.value)}
        error={errors.password}
        autoComplete="new-password"
        placeholder="Mindestens 8 Zeichen"
        disabled={isLoading}
      />

      <Button type="submit" variant="primary" loading={isLoading}>
        Registrieren
      </Button>

      <p className="text-center text-sm text-gray-600 mt-4">
        Schon ein Konto?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
