"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PhotoLightbox } from "@/components/photos/PhotoLightbox";

interface Photo {
  id: string;
  imageUrl: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
}

interface AdminPhotoCategoryDetailProps {
  category: Category;
  initialPhotos: Photo[];
  backPath?: string;
}

const PHOTOS_PER_PAGE = 12;

export function AdminPhotoCategoryDetail({
  category,
  initialPhotos,
  backPath = "/admin/fotos/galerie",
}: AdminPhotoCategoryDetailProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    category.coverImageUrl
  );
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingCover, setIsSettingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PHOTOS_PER_PAGE);

  const handleDelete = async () => {
    if (!deletingPhotoId) return;
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/photos/${deletingPhotoId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      // Check if deleted photo was the cover
      const deletedPhoto = photos.find((p) => p.id === deletingPhotoId);
      const remainingPhotos = photos.filter((p) => p.id !== deletingPhotoId);

      if (deletedPhoto && deletedPhoto.imageUrl === coverImageUrl) {
        // Set cover to first remaining photo (sorted by createdAt asc)
        const sortedRemaining = [...remainingPhotos].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setCoverImageUrl(sortedRemaining[0]?.imageUrl ?? null);
      }

      setPhotos(remainingPhotos);
      setSuccessMessage("Foto erfolgreich gelöscht.");
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsDeleting(false);
      setDeletingPhotoId(null);
    }
  };

  const handleSetCover = async (imageUrl: string) => {
    setIsSettingCover(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/admin/photo-categories/${category.id}/cover`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      setCoverImageUrl(imageUrl);
      setSuccessMessage("Cover-Bild gesetzt.");
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsSettingCover(false);
    }
  };

  const visiblePhotos = photos.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      {/* Back link and header */}
      <div>
        <Link
          href={backPath}
          className="text-primary hover:underline text-sm inline-flex items-center gap-1 mb-3"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Zurück
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="text-gray-500 mt-1">{category.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">{photos.length} Fotos</p>
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

      {/* Photos grid */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Alle Fotos ({photos.length})
        </h2>

        {photos.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Noch keine Fotos in dieser Rubrik.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visiblePhotos.map((photo, index) => {
                const isCover = photo.imageUrl === coverImageUrl;

                return (
                  <div
                    key={photo.id}
                    className={`group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer ${
                      isCover ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    onClick={() => setLightboxIndex(index)}
                  >
                    <Image
                      src={photo.imageUrl}
                      alt={`Foto von ${photo.user.firstName} ${photo.user.lastName}`}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    {isCover && (
                      <div className="absolute top-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded">
                        Cover
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <span className="text-white text-xs font-medium">
                        {photo.user.firstName} {photo.user.lastName}
                      </span>
                      <div className="flex gap-2">
                        {!isCover && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetCover(photo.imageUrl);
                            }}
                            disabled={isSettingCover}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                            title="Als Cover setzen"
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
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingPhotoId(photo.id);
                          }}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/20 hover:bg-red-500/50 rounded-lg text-white transition-colors"
                          title="Foto löschen"
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {photos.length > visibleCount && (
              <button
                onClick={() =>
                  setVisibleCount((prev) => prev + PHOTOS_PER_PAGE)
                }
                className="text-primary hover:underline text-sm font-medium min-h-[44px] w-full flex items-center justify-center"
              >
                Mehr anzeigen ({photos.length - visibleCount} weitere)
              </button>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && visiblePhotos.length > 0 && (
        <PhotoLightbox
          photos={visiblePhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(index) => setLightboxIndex(index)}
        />
      )}

      {/* Delete confirmation */}
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
    </div>
  );
}
