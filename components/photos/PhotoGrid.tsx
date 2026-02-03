"use client";

import { useState } from "react";
import Image from "next/image";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PhotoLightbox } from "./PhotoLightbox";

interface Photo {
  id: string;
  imageUrl: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface PhotoGridProps {
  photos: Photo[];
  currentUserId?: string;
  deadlinePassed?: boolean;
  onDelete?: (photoId: string) => Promise<void>;
  showUploaderName?: boolean;
  canDeleteAll?: boolean;
}

export function PhotoGrid({
  photos,
  currentUserId,
  deadlinePassed = false,
  onDelete,
  showUploaderName = false,
  canDeleteAll = false,
}: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingPhotoId || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deletingPhotoId);
    } finally {
      setIsDeleting(false);
      setDeletingPhotoId(null);
    }
  };

  if (photos.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        Noch keine Fotos in dieser Rubrik.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, index) => {
          const isOwn = photo.user?.id === currentUserId;
          const canDelete = canDeleteAll || (isOwn && !deadlinePassed && onDelete);

          return (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
              onClick={() => setLightboxIndex(index)}
            >
              <Image
                src={photo.imageUrl}
                alt={photo.user ? `Foto von ${photo.user.firstName} ${photo.user.lastName}` : "Foto"}
                fill
                unoptimized
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                {showUploaderName && photo.user ? (
                  <span className="text-white text-xs font-medium truncate">
                    {photo.user.firstName} {photo.user.lastName}
                  </span>
                ) : (
                  <span />
                )}
                {canDelete && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingPhotoId(photo.id);
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-red-300 transition-colors"
                    aria-label="Foto löschen"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
            </div>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(index) => setLightboxIndex(index)}
        />
      )}

      {onDelete && (
        <ConfirmDialog
          isOpen={!!deletingPhotoId}
          title="Foto löschen"
          message="Möchtest du dieses Foto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
          confirmText="Löschen"
          cancelText="Abbrechen"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeletingPhotoId(null)}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
