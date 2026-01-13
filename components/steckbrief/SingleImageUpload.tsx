'use client';

import { useState } from 'react';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Image from 'next/image';

interface SingleImageUploadProps {
  label: string;
  currentImage?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export function SingleImageUpload({
  label,
  currentImage,
  onChange,
  error,
  disabled,
}: SingleImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      onChange(null);
      return;
    }

    // Client-side validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onChange(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    setShowRemoveDialog(false);
  };

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          {label}
        </label>

        <div className="space-y-3">
          {preview && (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setShowRemoveDialog(true)}
                disabled={disabled}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={disabled}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-primary-light file:text-primary
              hover:file:bg-primary-light/80
              file:cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {error && <ErrorMessage message={error} className="mt-2" />}

        <p className="mt-2 text-xs text-gray-500">
          Max. 5 MB • JPG, PNG oder WebP
        </p>
      </div>

      <ConfirmDialog
        isOpen={showRemoveDialog}
        title="Bild entfernen"
        message="Möchtest du dieses Bild wirklich entfernen?"
        confirmText="Entfernen"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setShowRemoveDialog(false)}
      />
    </>
  );
}
