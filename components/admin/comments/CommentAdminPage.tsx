"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ParticipationSection } from "@/components/ui/ParticipationSection";

interface AdminComment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  targetType: "STUDENT" | "TEACHER";
  targetId: string | null;
  target: {
    id: string;
    name: string;
  } | null;
}

interface StudentUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface CommentAdminPageProps {
  initialComments: AdminComment[];
  totalStudents: number;
  commented: StudentUser[];
  notCommented: StudentUser[];
}

const MAX_LENGTH = 500;

export function CommentAdminPage({ initialComments, totalStudents, commented, notCommented }: CommentAdminPageProps) {
  const [comments, setComments] = useState<AdminComment[]>(initialComments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [filterTargetType, setFilterTargetType] = useState<"ALL" | "STUDENT" | "TEACHER">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredComments = comments.filter((comment) => {
    // Filter by target type
    if (filterTargetType !== "ALL" && comment.targetType !== filterTargetType) {
      return false;
    }

    // Search in author name, target name, and comment text
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const authorName = `${comment.author.firstName} ${comment.author.lastName}`.toLowerCase();
      const targetName = comment.target?.name.toLowerCase() || "";
      const text = comment.text.toLowerCase();

      if (!authorName.includes(query) && !targetName.includes(query) && !text.includes(query)) {
        return false;
      }
    }

    return true;
  });

  const handleStartEdit = (comment: AdminComment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    if (!editText.trim()) {
      setError("Der Kommentar darf nicht leer sein.");
      return;
    }

    if (editText.length > MAX_LENGTH) {
      setError(`Der Kommentar darf maximal ${MAX_LENGTH} Zeichen lang sein.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/comments/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ein Fehler ist aufgetreten.");
      }

      setComments((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, text: editText.trim(), updatedAt: result.comment.updatedAt }
            : c
        )
      );

      setEditingId(null);
      setEditText("");
      setSuccess("Kommentar aktualisiert.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/comments/${deleteId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ein Fehler ist aufgetreten.");
      }

      setComments((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
      setSuccess("Kommentar gelöscht.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsGrid
        items={[
          { label: "Schüler gesamt", value: totalStudents },
          { label: "Hat kommentiert", value: commented.length, color: "green" },
          { label: "Noch keine", value: notCommented.length, color: "amber" },
        ]}
      />

      <ProgressBar
        value={commented.length}
        max={totalStudents}
        label="Beteiligung"
        color="green"
      />

      <ParticipationSection
        groups={[
          { label: "Hat kommentiert", color: "green", items: commented },
          { label: "Noch keine Kommentare", color: "amber", items: notCommented },
        ]}
      />

      {/* Content stats */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Kommentare verwalten
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <span>{comments.length} Kommentare gesamt</span>
          <span>{comments.filter((c) => c.targetType === "STUDENT").length} über Schüler</span>
          <span>{comments.filter((c) => c.targetType === "TEACHER").length} über Lehrer</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suchen (Autor, Ziel, Text)..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light min-h-[44px]"
          />
        </div>
        <select
          value={filterTargetType}
          onChange={(e) => setFilterTargetType(e.target.value as "ALL" | "STUDENT" | "TEACHER")}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light min-h-[44px]"
        >
          <option value="ALL">Alle Ziele</option>
          <option value="STUDENT">Nur Schüler</option>
          <option value="TEACHER">Nur Lehrer</option>
        </select>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">
          {success}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {filteredComments.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            {comments.length === 0
              ? "Noch keine Kommentare vorhanden."
              : "Keine Kommentare gefunden."}
          </p>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
                <span className="font-medium text-gray-900">
                  {comment.author.firstName} {comment.author.lastName}
                </span>
                <span className="text-gray-400">→</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                  {comment.targetType === "STUDENT" ? "Schüler" : "Lehrer"}
                </span>
                <span className="font-medium text-gray-900">
                  {comment.target?.name || "[Gelöscht]"}
                </span>
              </div>

              {/* Content */}
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    maxLength={MAX_LENGTH}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light resize-y text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${editText.length > MAX_LENGTH ? "text-red-500" : "text-gray-400"}`}>
                      {editText.length}/{MAX_LENGTH}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-sm bg-primary-dark text-white rounded-lg hover:bg-primary-darker disabled:opacity-50"
                      >
                        {isLoading ? "..." : "Speichern"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap break-words flex-1">
                    {comment.text}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="p-2 text-gray-400 hover:text-primary-dark transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Bearbeiten"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteId(comment.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Löschen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Kommentar löschen"
        message="Möchtest du diesen Kommentar wirklich löschen?"
        confirmText="Löschen"
        cancelText="Abbrechen"
        variant="danger"
        isLoading={isLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
