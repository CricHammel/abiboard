"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatTeacherName } from "@/lib/format";

interface Quote {
  id: string;
  text: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Teacher {
  id: string;
  salutation: "HERR" | "FRAU";
  lastName: string;
  subject: string | null;
}

interface TeacherQuoteAdminDetailProps {
  teacher: Teacher;
  initialQuotes: Quote[];
  backPath?: string;
}

export function TeacherQuoteAdminDetail({ teacher, initialQuotes, backPath = "/admin/zitate" }: TeacherQuoteAdminDetailProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const teacherDisplayName = formatTeacherName(teacher);

  const handleStartEdit = (quote: Quote) => {
    setEditingId(quote.id);
    setEditText(quote.text);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const trimmed = editText.trim();
    if (!trimmed) {
      setError("Bitte gib ein Zitat ein.");
      return;
    }
    if (trimmed.length > 500) {
      setError("Ein Zitat darf maximal 500 Zeichen lang sein.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/teacher-quotes/quote/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      setQuotes((prev) =>
        prev.map((q) => (q.id === editingId ? { ...q, text: trimmed } : q))
      );
      setEditingId(null);
      setEditText("");
      setSuccessMessage("Zitat aktualisiert.");
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteQuoteId) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/teacher-quotes/quote/${deleteQuoteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      setQuotes((prev) => prev.filter((q) => q.id !== deleteQuoteId));
      setSuccessMessage("Zitat gelöscht.");
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
      setDeleteQuoteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link and header */}
      <div>
        <Link
          href={backPath}
          className="text-primary hover:underline text-sm inline-flex items-center gap-1 mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{teacherDisplayName}</h1>
        <p className="text-sm text-gray-500 mt-1">{quotes.length} Zitat{quotes.length !== 1 ? "e" : ""}</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Quotes list */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
        {quotes.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Noch keine Zitate vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="p-4 bg-gray-50 rounded-lg space-y-2"
              >
                {editingId === quote.id ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary resize-y"
                      rows={3}
                      disabled={isLoading}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {editText.trim().length}/500
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                          className="!py-2 !px-4 !min-h-[36px] text-sm"
                        >
                          Abbrechen
                        </Button>
                        <Button
                          onClick={handleSaveEdit}
                          loading={isLoading}
                          disabled={isLoading}
                          className="!py-2 !px-4 !min-h-[36px] text-sm"
                        >
                          Speichern
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <>
                    <p className="text-gray-900 text-sm">&ldquo;{quote.text}&rdquo;</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        von {quote.user.firstName} {quote.user.lastName}
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEdit(quote)}
                          className="text-gray-400 hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Bearbeiten"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteQuoteId(quote.id)}
                          className="text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Löschen"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteQuoteId}
        title="Zitat löschen"
        message="Möchtest du dieses Zitat wirklich löschen?"
        confirmText="Löschen"
        cancelText="Abbrechen"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteQuoteId(null)}
        isLoading={isLoading}
      />
    </div>
  );
}
