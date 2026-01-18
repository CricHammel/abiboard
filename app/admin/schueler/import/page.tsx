"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import Link from "next/link";

interface ImportResult {
  success: number;
  skipped: number;
  errors: string[];
}

export default function ImportStudentsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Bitte w\u00e4hle eine CSV-Datei aus.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Bitte w\u00e4hle eine Datei aus.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/students/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      setResult(data.result);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById(
        "csv-file"
      ) as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/schueler"
          className="text-primary hover:underline text-sm mb-2 inline-block"
        >
          &larr; Zur&uuml;ck zur Sch&uuml;lerliste
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">CSV Import</h1>
        <p className="text-gray-600 mt-2">
          Importiere mehrere Sch&uuml;ler aus einer CSV-Datei.
        </p>
      </div>

      <Card>
        <div className="space-y-6">
          {/* Format instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">CSV-Format</h3>
            <p className="text-sm text-gray-600 mb-2">
              Die CSV-Datei muss folgende Spalten enthalten:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>
                <strong>Vorname</strong> (Pflicht)
              </li>
              <li>
                <strong>Nachname</strong> (Pflicht)
              </li>
              <li>
                <strong>Email</strong> (Optional - wird automatisch generiert)
              </li>
            </ul>
            <p className="text-sm text-gray-500 mt-3">
              Beispiel: <code>Vorname;Nachname</code> oder{" "}
              <code>Vorname,Nachname,Email</code>
            </p>
          </div>

          {error && <ErrorMessage message={error} />}

          {result && (
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
                  {result.success} Sch&uuml;ler hinzugef&uuml;gt
                </li>
                {result.skipped > 0 && (
                  <li className="text-gray-600">
                    {result.skipped} &uuml;bersprungen (bereits vorhanden)
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
                      <li>... und {result.errors.length - 5} weitere Fehler</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="csv-file"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                CSV-Datei ausw&auml;hlen
              </label>
              <input
                type="file"
                id="csv-file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isLoading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer cursor-pointer"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-2">
                  Ausgew&auml;hlt: {file.name}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={isLoading}>
                Importieren
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/admin/schueler")}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
