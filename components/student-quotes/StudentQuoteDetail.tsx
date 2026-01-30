"use client";

import { useState } from "react";
import Link from "next/link";
import { QuoteInput } from "@/components/teacher-quotes/QuoteInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Quote {
  id: string;
  text: string;
  createdAt: string;
  isOwn: boolean;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface StudentQuoteDetailProps {
  student: Student;
  initialQuotes: Quote[];
  backPath?: string;
  deadlinePassed?: boolean;
}

const QUOTES_PER_PAGE = 10;

export function StudentQuoteDetail({ student, initialQuotes, backPath = "/zitate/schueler", deadlinePassed = false }: StudentQuoteDetailProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(QUOTES_PER_PAGE);

  const ownQuotes = quotes.filter((q) => q.isOwn);
  const otherQuotes = quotes.filter((q) => !q.isOwn);

  const studentDisplayName = `${student.firstName} ${student.lastName}`;

  const handleAddQuotes = async (quoteTexts: string[]) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/student-quotes/${student.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotes: quoteTexts }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      setSuccessMessage(data.message);
      setIsAdding(false);

      // Reload quotes
      const reloadResponse = await fetch(`/api/student-quotes/${student.id}`);
      const reloadData = await reloadResponse.json();
      if (reloadResponse.ok) {
        setQuotes(reloadData.quotes);
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteQuoteId) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/student-quotes/quote/${deleteQuoteId}`, {
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
      setIsDeleting(false);
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
        <h1 className="text-2xl font-bold text-gray-900">{studentDisplayName}</h1>
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

      {/* Own quotes section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Meine Zitate ({ownQuotes.length})
          </h2>
          {!isAdding && !deadlinePassed && (
            <button
              onClick={() => {
                setIsAdding(true);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-primary hover:text-primary-dark text-sm font-medium min-h-[44px] px-3 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Hinzufügen
            </button>
          )}
        </div>

        {/* Add quote form */}
        {isAdding && !deadlinePassed && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Zitate hinzufügen</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <QuoteInput onSubmit={handleAddQuotes} isLoading={isSubmitting} />
          </div>
        )}

        {/* Own quotes list */}
        {ownQuotes.length === 0 && !isAdding ? (
          <p className="text-gray-500 text-sm">Du hast noch keine Zitate für diesen Schüler hinzugefügt.</p>
        ) : (
          <div className="space-y-2">
            {ownQuotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <p className="text-gray-900 text-sm flex-1">&ldquo;{quote.text}&rdquo;</p>
                {!deadlinePassed && (
                  <button
                    onClick={() => setDeleteQuoteId(quote.id)}
                    className="text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other quotes section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Weitere Zitate ({otherQuotes.length})
        </h2>

        {otherQuotes.length === 0 ? (
          <p className="text-gray-500 text-sm">Noch keine weiteren Zitate vorhanden.</p>
        ) : (
          <>
            <div className="space-y-2">
              {otherQuotes.slice(0, visibleCount).map((quote) => (
                <div
                  key={quote.id}
                  className="p-3 rounded-lg bg-gray-50"
                >
                  <p className="text-gray-900 text-sm">&ldquo;{quote.text}&rdquo;</p>
                </div>
              ))}
            </div>
            {otherQuotes.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + QUOTES_PER_PAGE)}
                className="text-primary hover:underline text-sm font-medium min-h-[44px] w-full flex items-center justify-center"
              >
                Mehr anzeigen ({otherQuotes.length - visibleCount} weitere)
              </button>
            )}
          </>
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
        isLoading={isDeleting}
      />
    </div>
  );
}
