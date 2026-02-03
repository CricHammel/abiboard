"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";

interface DownloadState {
  loading: boolean;
  error: string | null;
}

function useDownload() {
  const [states, setStates] = useState<Record<string, DownloadState>>({});

  async function download(key: string, url: string, filename: string) {
    setStates((prev) => ({ ...prev, [key]: { loading: true, error: null } }));

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Download fehlgeschlagen.");
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

      setStates((prev) => ({ ...prev, [key]: { loading: false, error: null } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download fehlgeschlagen.";
      setStates((prev) => ({ ...prev, [key]: { loading: false, error: message } }));
    }
  }

  function getState(key: string): DownloadState {
    return states[key] || { loading: false, error: null };
  }

  return { download, getState };
}

interface ExportPageProps {
  initialDeadline: string | null;
}

function formatDeadline(isoString: string): string {
  return new Date(isoString).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDatetimeValue(isoString: string): string {
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function ExportPage({ initialDeadline }: ExportPageProps) {
  const { download, getState } = useDownload();
  const [deadline, setDeadline] = useState<string | null>(initialDeadline);
  const [deadlineInput, setDeadlineInput] = useState(
    initialDeadline ? toLocalDatetimeValue(initialDeadline) : ""
  );
  const [deadlineLoading, setDeadlineLoading] = useState(false);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [deadlineSuccess, setDeadlineSuccess] = useState<string | null>(null);

  const isPassed = deadline ? new Date(deadline) < new Date() : false;

  const handleSaveDeadline = async () => {
    if (!deadlineInput) return;

    setDeadlineLoading(true);
    setDeadlineError(null);
    setDeadlineSuccess(null);

    try {
      const isoDate = new Date(deadlineInput).toISOString();
      const res = await fetch("/api/admin/deadline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: isoDate }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeadlineError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      setDeadline(data.deadline);
      setDeadlineSuccess(data.message);
      setTimeout(() => setDeadlineSuccess(null), 3000);
    } catch {
      setDeadlineError("Ein Fehler ist aufgetreten.");
    } finally {
      setDeadlineLoading(false);
    }
  };

  const handleRemoveDeadline = async () => {
    setDeadlineLoading(true);
    setDeadlineError(null);
    setDeadlineSuccess(null);

    try {
      const res = await fetch("/api/admin/deadline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: null }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeadlineError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      setDeadline(null);
      setDeadlineInput("");
      setDeadlineSuccess(data.message);
      setTimeout(() => setDeadlineSuccess(null), 3000);
    } catch {
      setDeadlineError("Ein Fehler ist aufgetreten.");
    } finally {
      setDeadlineLoading(false);
    }
  };

  const sections = [
    {
      title: "Steckbriefe",
      description: "Alle Steckbrief-Daten inkl. Bildpfade als TSV und Bilder als ZIP.",
      buttons: [
        {
          key: "steckbriefe-tsv",
          label: "TSV herunterladen",
          url: "/api/admin/export/steckbriefe",
          filename: "steckbriefe.tsv",
        },
        {
          key: "steckbriefe-zip",
          label: "Bilder als ZIP herunterladen",
          url: "/api/admin/export/steckbriefe/images",
          filename: "steckbrief_bilder.zip",
        },
      ],
    },
    {
      title: "Rankings",
      description: "Top 5 pro Frage mit Stimmenanzahl und Prozent.",
      buttons: [
        {
          key: "rankings",
          label: "TSV herunterladen",
          url: "/api/admin/export/rankings",
          filename: "rankings.tsv",
        },
      ],
    },
    {
      title: "Zitate - Lehrer",
      description: "Alle Lehrer-Zitate sortiert nach Lehrer.",
      buttons: [
        {
          key: "zitate-lehrer",
          label: "TSV herunterladen",
          url: "/api/admin/export/zitate?type=lehrer",
          filename: "zitate_lehrer.tsv",
        },
      ],
    },
    {
      title: "Zitate - Schüler",
      description: "Alle Schüler-Zitate sortiert nach Schüler.",
      buttons: [
        {
          key: "zitate-schueler",
          label: "TSV herunterladen",
          url: "/api/admin/export/zitate?type=schueler",
          filename: "zitate_schueler.tsv",
        },
      ],
    },
    {
      title: "Umfragen",
      description: "Umfrageergebnisse mit Stimmenanzahl und Prozent.",
      buttons: [
        {
          key: "umfragen",
          label: "TSV herunterladen",
          url: "/api/admin/export/umfragen",
          filename: "umfragen.tsv",
        },
      ],
    },
    {
      title: "Kommentare",
      description: "Alle Kommentare sortiert nach Empfänger.",
      buttons: [
        {
          key: "kommentare",
          label: "TSV herunterladen",
          url: "/api/admin/export/kommentare",
          filename: "kommentare.tsv",
        },
      ],
    },
    {
      title: "Fotos",
      description: "Alle Fotos nach Rubriken sortiert als ZIP.",
      buttons: [
        {
          key: "fotos-zip",
          label: "ZIP herunterladen",
          url: "/api/admin/export/fotos",
          filename: "fotos.zip",
        },
      ],
    },
    {
      title: "Kontaktdaten",
      description: "Private Kontaktdaten für das Abibuch (E-Mail, Telefon, Instagram).",
      buttons: [
        {
          key: "kontaktdaten",
          label: "TSV herunterladen",
          url: "/api/admin/export/kontaktdaten",
          filename: "kontaktdaten.tsv",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Deadline Management */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Abgabefrist</h2>
          {deadline && (
            <Badge variant={isPassed ? "draft" : "submitted"}>
              {isPassed ? "Abgelaufen" : "Aktiv"}
            </Badge>
          )}
        </div>

        {deadline && (
          <p className="text-sm text-gray-600 mb-4">
            Aktuelle Frist: <span className="font-medium">{formatDeadline(deadline)}</span>
          </p>
        )}

        {!deadline && (
          <p className="text-sm text-gray-500 mb-4">
            Keine Abgabefrist gesetzt. Nach Ablauf einer Frist können Schüler keine Inhalte mehr bearbeiten.
          </p>
        )}

        {deadlineError && (
          <div className="mb-4">
            <Alert variant="error">{deadlineError}</Alert>
          </div>
        )}
        {deadlineSuccess && (
          <div className="mb-4">
            <Alert variant="success">{deadlineSuccess}</Alert>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="datetime-local"
            value={deadlineInput}
            onChange={(e) => setDeadlineInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={deadlineLoading}
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveDeadline}
              loading={deadlineLoading}
              disabled={deadlineLoading || !deadlineInput}
            >
              Speichern
            </Button>
            {deadline && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRemoveDeadline}
                loading={deadlineLoading}
                disabled={deadlineLoading}
              >
                Entfernen
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Download sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{section.description}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              {section.buttons.map((btn) => {
                const state = getState(btn.key);
                return (
                  <div key={btn.key}>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={state.loading}
                      onClick={() => download(btn.key, btn.url, btn.filename)}
                      disabled={state.loading}
                    >
                      <svg
                        className="w-4 h-4 mr-2 inline-block"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {btn.label}
                    </Button>
                    {state.error && (
                      <div className="mt-2">
                        <Alert variant="error">{state.error}</Alert>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
