"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

interface ContactInfoFormProps {
  initialData: {
    contactEmail: string;
    contactPhone: string;
    contactInsta: string;
  };
  deadlinePassed?: boolean;
}

export function ContactInfoForm({
  initialData,
  deadlinePassed = false,
}: ContactInfoFormProps) {
  const [contactEmail, setContactEmail] = useState(initialData.contactEmail);
  const [contactPhone, setContactPhone] = useState(initialData.contactPhone);
  const [contactInsta, setContactInsta] = useState(initialData.contactInsta);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/contact-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactEmail,
          contactPhone,
          contactInsta,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      setSuccess("Kontaktdaten gespeichert.");
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-8 mt-8">
      <div className="bg-white border border-blue-200 rounded-xl p-4 md:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Kontaktdaten für das Abibuch
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Diese Daten erscheinen nur im gedruckten Buch, nicht auf dieser
              Webseite. Alle Felder sind optional.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4">
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Private E-Mail-Adresse"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="max@beispiel.de"
            disabled={isLoading || deadlinePassed}
          />

          <Input
            label="Handynummer"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+49 123 456789"
            disabled={isLoading || deadlinePassed}
          />

          <Input
            label="Instagram"
            value={contactInsta}
            onChange={(e) => setContactInsta(e.target.value)}
            placeholder="@benutzername"
            disabled={isLoading || deadlinePassed}
          />

          {!deadlinePassed && (
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" loading={isLoading}>
                Kontaktdaten speichern
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
