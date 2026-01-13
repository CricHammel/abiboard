'use client';

import { useState, useEffect } from 'react';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Image from 'next/image';

interface MultiImageUploadProps {
  label: string;
  currentImages?: string[];
  maxFiles: number;
  onChange: (data: { existing: string[], new: File[] }) => void;
  error?: string;
  disabled?: boolean;
}

export function MultiImageUpload({
  label,
  currentImages = [],
  maxFiles,
  onChange,
  error,
  disabled,
}: MultiImageUploadProps) {
  // Separate state for existing (saved) images and new files
  const [existingImages, setExistingImages] = useState<string[]>(currentImages);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  // Update existing images when props change
  useEffect(() => {
    setExistingImages(currentImages);
  }, [currentImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const currentCount = existingImages.length + newFiles.length;
    const availableSlots = maxFiles - currentCount;

    if (selectedFiles.length > availableSlots) {
      return; // Silently ignore extra files
    }

    // Validate files
    const validFiles = selectedFiles.filter(file => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      return file.size <= maxSize && 
        (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp');
    });

    if (validFiles.length === 0) return;

    // Create previews for new files
    const previews: string[] = [];
    let loadedCount = 0;

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        loadedCount++;
        
        if (loadedCount === validFiles.length) {
          setNewPreviews([...newPreviews, ...previews]);
          const updatedNewFiles = [...newFiles, ...validFiles];
          setNewFiles(updatedNewFiles);
          onChange({ existing: existingImages, new: updatedNewFiles });
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const handleRemoveExisting = (index: number) => {
    const updated = existingImages.filter((_, i) => i !== index);
    setExistingImages(updated);
    onChange({ existing: updated, new: newFiles });
  };

  const handleRemoveNew = (index: number) => {
    const updatedFiles = newFiles.filter((_, i) => i !== index);
    const updatedPreviews = newPreviews.filter((_, i) => i !== index);
    setNewFiles(updatedFiles);
    setNewPreviews(updatedPreviews);
    onChange({ existing: existingImages, new: updatedFiles });
  };

  const totalCount = existingImages.length + newFiles.length;
  const remainingSlots = maxFiles - totalCount;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-600 mb-2">
        {label}
      </label>

      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Existing images from server */}
        {existingImages.map((imageUrl, index) => (
          <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={imageUrl}
              alt={`Bild ${index + 1}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemoveExisting(index)}
              disabled={disabled}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        
        {/* New files (not yet uploaded) */}
        {newPreviews.map((preview, index) => (
          <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-blue-300">
            <Image
              src={preview}
              alt={`Neues Bild ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
              Neu
            </div>
            <button
              type="button"
              onClick={() => handleRemoveNew(index)}
              disabled={disabled}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {remainingSlots > 0 && (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
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
      )}

      {error && <ErrorMessage message={error} className="mt-2" />}

      <p className="mt-2 text-xs text-gray-500">
        {remainingSlots > 0 
          ? `Noch ${remainingSlots} von ${maxFiles} Bildern möglich`
          : `Maximum erreicht (${maxFiles} Bilder)`}
        {' • '}Max. 5 MB pro Bild • JPG, PNG oder WebP
      </p>
    </div>
  );
}
