"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface QuoteInputProps {
  onSubmit: (quotes: string[]) => Promise<void>;
  isLoading: boolean;
}

export function QuoteInput({ onSubmit, isLoading }: QuoteInputProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const tooLongLines = lines.filter((l) => l.length > 500);

  const handleSubmit = async () => {
    setError(null);

    if (lines.length === 0) {
      setError("Bitte gib mindestens ein Zitat ein.");
      return;
    }

    if (lines.length > 10) {
      setError("Du kannst maximal 10 Zitate auf einmal hinzufügen.");
      return;
    }

    if (tooLongLines.length > 0) {
      setError("Ein oder mehrere Zitate überschreiten die maximale Länge von 500 Zeichen.");
      return;
    }

    await onSubmit(lines);
    setText("");
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        placeholder="Ein Zitat pro Zeile eingeben..."
        rows={4}
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary resize-y min-h-[88px]"
        disabled={isLoading}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-gray-500">
          {lines.length > 0
            ? `${lines.length} Zitat${lines.length !== 1 ? "e" : ""}`
            : "Max. 10 Zitate, jeweils max. 500 Zeichen"}
        </p>
        <Button
          onClick={handleSubmit}
          disabled={lines.length === 0 || isLoading}
          loading={isLoading}
          className="sm:w-auto"
        >
          Hinzufügen
        </Button>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      {tooLongLines.length > 0 && !error && (
        <p className="text-sm text-warning">
          {tooLongLines.length} Zitat{tooLongLines.length !== 1 ? "e" : ""} zu lang (max. 500 Zeichen)
        </p>
      )}
    </div>
  );
}
