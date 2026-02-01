"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { parseCSV } from "@/lib/csv-parse";
import { CsvImportPreview, type ColumnDef } from "./CsvImportPreview";

type Phase = "FILE_SELECT" | "PREVIEW" | "RESULT";

interface ImportResult {
  success: number;
  skipped: number;
  errors: string[];
}

interface CsvImportPageProps {
  title: string;
  backLink: string;
  backLabel: string;
  apiEndpoint: string;
  columns: ColumnDef[];
  formatInfo: React.ReactNode;
  entityName: string;
}

export { type ColumnDef } from "./CsvImportPreview";

export function CsvImportPage({
  title,
  backLink,
  backLabel,
  apiEndpoint,
  columns,
  formatInfo,
  entityName,
}: CsvImportPageProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("FILE_SELECT");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [unmatchedHeaders, setUnmatchedHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Bitte wähle eine CSV-Datei aus.");
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text?.trim()) {
        setError("Die Datei ist leer.");
        return;
      }

      const { headers, rows: rawRows } = parseCSV(text);

      if (headers.length === 0) {
        setError("Keine Spalten erkannt.");
        return;
      }

      if (rawRows.length === 0) {
        setError("Keine Datenzeilen gefunden (nur Header).");
        return;
      }

      // Map CSV headers to column definitions
      const headerMapping: (ColumnDef | null)[] = headers.map((h) => {
        const normalized = h.toLowerCase().trim();
        return (
          columns.find((col) =>
            col.csvHeaders.some((alias) => alias.toLowerCase() === normalized)
          ) || null
        );
      });

      // Collect unmatched headers
      const unmatched = headers.filter((_, i) => headerMapping[i] === null);
      setUnmatchedHeaders(unmatched);

      // Check that at least one column was matched
      if (headerMapping.every((m) => m === null)) {
        setError(
          "Keine bekannten Spalten erkannt. Überprüfe die Header-Zeile der CSV-Datei."
        );
        return;
      }

      // Convert raw rows to mapped objects
      const mappedRows = rawRows
        .filter((row) => row.some((cell) => cell.trim().length > 0))
        .map((row) => {
          const obj: Record<string, string> = {};
          // Initialize all columns with empty strings
          for (const col of columns) {
            obj[col.key] = "";
          }
          // Fill in values from CSV
          for (let i = 0; i < row.length; i++) {
            const col = headerMapping[i];
            if (col) {
              obj[col.key] = row[i];
            }
          }
          return obj;
        });

      setRows(mappedRows);
      setPhase("PREVIEW");
    };

    reader.onerror = () => {
      setError("Fehler beim Lesen der Datei.");
    };

    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (rows.length === 0) {
      setError("Keine Zeilen zum Importieren.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      setResult(data.result);
      setPhase("RESULT");
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPhase("FILE_SELECT");
    setRows([]);
    setUnmatchedHeaders([]);
    setError(null);
    setResult(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href={backLink}
          className="text-primary hover:underline text-sm mb-2 inline-block"
        >
          {backLabel}
        </Link>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      {/* Phase 1: File Selection */}
      {phase === "FILE_SELECT" && (
        <Card>
          <div className="space-y-6">
            {formatInfo}

            {error && <ErrorMessage message={error} />}

            <div>
              <label
                htmlFor="csv-file"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                CSV-Datei auswählen
              </label>
              <input
                type="file"
                id="csv-file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer cursor-pointer"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(backLink)}
            >
              Abbrechen
            </Button>
          </div>
        </Card>
      )}

      {/* Phase 2: Preview */}
      {phase === "PREVIEW" && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Vorschau</h3>
            <p className="text-sm text-gray-600">
              Überprüfe die Daten und bearbeite sie bei Bedarf, bevor du den Import startest.
            </p>

            {unmatchedHeaders.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                Nicht erkannte Spalten (werden ignoriert):{" "}
                <strong>{unmatchedHeaders.join(", ")}</strong>
              </div>
            )}

            {error && <ErrorMessage message={error} />}

            <CsvImportPreview
              columns={columns}
              rows={rows}
              onRowsChange={setRows}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={handleImport}
                loading={isLoading}
                disabled={rows.length === 0}
              >
                {rows.length} {entityName} importieren
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={isLoading}
              >
                Zurück
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Phase 3: Result */}
      {phase === "RESULT" && result && (
        <Card>
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg ${
                result.errors.length > 0
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <h3
                className={`font-medium mb-2 ${
                  result.errors.length > 0 ? "text-yellow-800" : "text-green-800"
                }`}
              >
                Import abgeschlossen
              </h3>
              <ul className="text-sm space-y-1">
                <li className="text-green-700">
                  {result.success} {entityName} hinzugefügt
                </li>
                {result.skipped > 0 && (
                  <li className="text-gray-600">
                    {result.skipped} übersprungen (bereits vorhanden)
                  </li>
                )}
              </ul>
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-yellow-800">Fehler:</p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside mt-1">
                    {result.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>
                        ... und {result.errors.length - 5} weitere Fehler
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
              >
                Weitere importieren
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => router.push(backLink)}
              >
                Fertig
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
