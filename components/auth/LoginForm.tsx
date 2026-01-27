"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { loginSchema } from "@/lib/validation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Client-side validation
    const validation = loginSchema.safeParse({ email, password });

    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.issues.forEach((error) => {
        if (error.path[0] === "email") {
          fieldErrors.email = error.message;
        } else if (error.path[0] === "password") {
          fieldErrors.password = error.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({
          general: "E-Mail oder Passwort falsch.",
        });
        setIsLoading(false);
        return;
      }

      // Successful login - redirect will be handled by middleware
      router.push("/");
      router.refresh();
    } catch {
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
        label="E-Mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
        placeholder="vorname.nachname@lessing-ffm.net"
        disabled={isLoading}
      />

      <PasswordInput
        label="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        autoComplete="current-password"
        placeholder="••••••••"
        disabled={isLoading}
      />

      <Button type="submit" variant="primary" fullWidth loading={isLoading}>
        Anmelden
      </Button>

      <p className="text-center text-sm text-gray-600 mt-4">
        Noch kein Konto?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Registrieren
        </Link>
      </p>
    </form>
  );
}
