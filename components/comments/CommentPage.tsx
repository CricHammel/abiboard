"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CommentForm } from "./CommentForm";
import { CommentList, CommentWithTarget } from "./CommentList";

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | null;
}

interface TeacherOption {
  id: string;
  salutation: "HERR" | "FRAU";
  firstName: string | null;
  lastName: string;
  subject: string | null;
}

interface ReceivedAuthor {
  firstName: string;
  lastName: string;
}

interface CommentPageProps {
  initialComments: CommentWithTarget[];
  allStudents: StudentOption[];
  allTeachers: TeacherOption[];
  currentUserId: string;
  deadlinePassed?: boolean;
  receivedFromAuthors?: ReceivedAuthor[];
}

export function CommentPage({
  initialComments,
  allStudents,
  allTeachers,
  currentUserId,
  deadlinePassed = false,
  receivedFromAuthors = [],
}: CommentPageProps) {
  const [comments, setComments] = useState<CommentWithTarget[]>(initialComments);
  const [receivedOpen, setReceivedOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentWithTarget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = async (data: { text: string; targetType: "STUDENT" | "TEACHER"; targetId: string }) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ein Fehler ist aufgetreten.");
      }

      // Refetch comments to get full data
      const listResponse = await fetch("/api/comments");
      const listResult = await listResponse.json();

      if (listResponse.ok) {
        setComments(listResult.comments);
      }

      setIsAdding(false);
      setSuccess("Kommentar hinzugefügt.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: { text: string }) => {
    if (!editingComment) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/comments/${editingComment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.text }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ein Fehler ist aufgetreten.");
      }

      // Update local state
      setComments((prev) =>
        prev.map((c) =>
          c.id === editingComment.id
            ? { ...c, text: data.text, updatedAt: result.comment.updatedAt }
            : c
        )
      );

      setEditingComment(null);
      setSuccess("Kommentar aktualisiert.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ein Fehler ist aufgetreten.");
      }

      // Update local state
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setSuccess("Kommentar gelöscht.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <Alert variant="info">
        Schreibe nette Kommentare über deine Mitschüler und Lehrer für das Abibuch.
        Du kannst für jede Person einen Kommentar schreiben.
      </Alert>

      {/* Messages */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Add/Edit Form */}
      {isAdding && !editingComment && !deadlinePassed && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Neuen Kommentar schreiben
          </h2>
          <CommentForm
            allStudents={allStudents}
            allTeachers={allTeachers}
            excludeUserId={currentUserId}
            onSubmit={handleCreate}
            onCancel={() => setIsAdding(false)}
            isLoading={isLoading}
          />
        </div>
      )}

      {editingComment && !deadlinePassed && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Kommentar bearbeiten
          </h2>
          <CommentForm
            editMode
            initialText={editingComment.text}
            initialTargetType={editingComment.targetType}
            initialTargetName={editingComment.target?.name}
            onSubmit={handleUpdate}
            onCancel={() => setEditingComment(null)}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Add Button */}
      {!isAdding && !editingComment && !deadlinePassed && (
        <Button onClick={() => setIsAdding(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neuen Kommentar schreiben
        </Button>
      )}

      {/* Received Comments Disclosure */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setReceivedOpen(!receivedOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors min-h-[44px]"
        >
          <span className="text-sm font-medium text-gray-700">
            Kommentare über mich ({receivedFromAuthors.length})
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${receivedOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {receivedOpen && (
          <div className="p-4">
            {receivedFromAuthors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {receivedFromAuthors.map((author, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                  >
                    {author.firstName} {author.lastName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Noch hat niemand einen Kommentar über dich geschrieben.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Comments List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Meine Kommentare ({comments.length})
        </h2>
        <CommentList
          comments={comments}
          onEdit={setEditingComment}
          onDelete={handleDelete}
          deadlinePassed={deadlinePassed}
        />
      </div>
    </div>
  );
}
