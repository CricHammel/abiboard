"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PhotoLightbox } from "./PhotoLightbox";

interface Photo {
  id: string;
  imageUrl: string;
  createdAt: string;
  isOwn: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  maxPerUser: number;
}

interface PhotoCategoryDetailProps {
  category: Category;
  initialPhotos: Photo[];
  userPhotoCount: number;
  deadlinePassed: boolean;
  backPath?: string;
}

const PHOTOS_PER_PAGE = 12;

export function PhotoCategoryDetail({
  category,
  initialPhotos,
  userPhotoCount: initialUserPhotoCount,
  deadlinePassed,
  backPath = "/fotos",
}: PhotoCategoryDetailProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [userPhotoCount, setUserPhotoCount] = useState(initialUserPhotoCount);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);
  const [visibleOtherCount, setVisibleOtherCount] = useState(PHOTOS_PER_PAGE);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ownPhotos = photos.filter((p) => p.isOwn);
  const otherPhotos = photos.filter((p) => !p.isOwn);
  const canUpload = !deadlinePassed && userPhotoCount < category.maxPerUser;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      setError('Die Datei ist zu groß. Maximal 10 MB erlaubt.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Ungültiger Dateityp. Nur JPG, PNG und WebP sind erlaubt.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("categoryId", category.id);

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      if (result.photo) {
        const newPhoto: Photo = {
          id: result.photo.id,
          imageUrl: result.photo.imageUrl,
          createdAt: result.photo.createdAt,
          isOwn: true,
          user: result.photo.user,
        };
        setPhotos((prev) => [newPhoto, ...prev]);
        setUserPhotoCount((prev) => prev + 1);
      }

      setSuccessMessage("Foto erfolgreich hochgeladen.");
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deletingPhotoId) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/photos/photo/${deletingPhotoId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      setPhotos((prev) => prev.filter((p) => p.id !== deletingPhotoId));
      setUserPhotoCount((prev) => prev - 1);
      setSuccessMessage("Foto erfolgreich gelöscht.");
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsDeleting(false);
      setDeletingPhotoId(null);
    }
  };

  const openLightbox = (photoList: Photo[], index: number) => {
    setLightboxPhotos(photoList);
    setLightboxIndex(index);
  };

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
        <p className="text-sm text-gray-500 mt-2">
          {userPhotoCount}/{category.maxPerUser} Fotos hochgeladen
        </p>
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

      {/* Own photos section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Meine Fotos ({ownPhotos.length})
          </h2>
          {canUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload"
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                loading={isUploading}
                disabled={isUploading}
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Hochladen
              </Button>
            </>
          )}
        </div>

        {ownPhotos.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Du hast noch keine Fotos in dieser Rubrik hochgeladen.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ownPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => openLightbox(ownPhotos, index)}
              >
                <Image
                  src={photo.imageUrl}
                  alt="Mein Foto"
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                  {!deadlinePassed && (
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
            ))}
          </div>
        )}
      </div>

      {/* Other photos section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Weitere Fotos ({otherPhotos.length})
        </h2>

        {otherPhotos.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Noch keine weiteren Fotos vorhanden.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {otherPhotos.slice(0, visibleOtherCount).map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => openLightbox(otherPhotos.slice(0, visibleOtherCount), index)}
                >
                  <Image
                    src={photo.imageUrl}
                    alt="Foto"
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
            {otherPhotos.length > visibleOtherCount && (
              <button
                onClick={() =>
                  setVisibleOtherCount((prev) => prev + PHOTOS_PER_PAGE)
                }
                className="text-primary hover:underline text-sm font-medium min-h-[44px] w-full flex items-center justify-center"
              >
                Mehr anzeigen ({otherPhotos.length - visibleOtherCount} weitere)
              </button>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && lightboxPhotos.length > 0 && (
        <PhotoLightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onClose={() => {
            setLightboxIndex(null);
            setLightboxPhotos([]);
          }}
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
