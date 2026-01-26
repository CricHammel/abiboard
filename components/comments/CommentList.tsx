"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export interface CommentWithTarget {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  targetType: "STUDENT" | "TEACHER";
  targetId: string | null;
  target: {
    id: string;
    name: string;
  } | null;
}

interface CommentListProps {
  comments: CommentWithTarget[];
  onEdit: (comment: CommentWithTarget) => void;
  onDelete: (commentId: string) => Promise<void>;
}

export function CommentList({ comments, onEdit, onDelete }: CommentListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (comments.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4">
        Du hast noch keine Kommentare geschrieben.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {comment.targetType === "STUDENT" ? "Schüler/in" : "Lehrer/in"}
                  </span>
                  <span className="font-medium text-gray-900 text-sm">
                    {comment.target?.name || "[Gelöscht]"}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                  {comment.text}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(comment)}
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
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Kommentar löschen"
        message="Möchtest du diesen Kommentar wirklich löschen?"
        confirmText="Löschen"
        cancelText="Abbrechen"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
