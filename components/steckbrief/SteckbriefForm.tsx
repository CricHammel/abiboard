'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { FieldRenderer } from './FieldRenderer';
import { getSortedFields } from '@/lib/steckbrief-fields';
import { steckbriefUpdateSchema } from '@/lib/steckbrief-validation';

interface SteckbriefFormProps {
  initialData: {
    imageUrl?: string | null;
    quote?: string | null;
    plansAfter?: string | null;
    memory?: string | null;
    memoryImages?: string[];
    status: string;
  };
}

export function SteckbriefForm({ initialData }: SteckbriefFormProps) {
  const router = useRouter();
  const fields = getSortedFields();

  // State for text fields
  const [formData, setFormData] = useState<Record<string, any>>({
    quote: initialData.quote || '',
    plansAfter: initialData.plansAfter || '',
    memory: initialData.memory || '',
  });

  // State for images
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.imageUrl || null);

  // State for memory images (existing + new)
  const [existingMemoryImages, setExistingMemoryImages] = useState<string[]>(initialData.memoryImages || []);
  const [newMemoryImageFiles, setNewMemoryImageFiles] = useState<File[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFieldChange = (key: string, value: any) => {
    // Handle different field types
    if (key === 'imageUrl') {
      // Single image upload
      setImageFile(value as File | null);
    } else if (key === 'memoryImages') {
      // Multi-image upload - value is { existing: string[], new: File[] }
      const { existing, new: newFiles } = value;
      setExistingMemoryImages(existing);
      setNewMemoryImageFiles(newFiles);
    } else {
      // Text fields
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm('draft');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm('submit');
  };

  const submitForm = async (action: 'draft' | 'submit') => {
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      // Client-side validation for text fields
      const textData = {
        quote: formData.quote,
        plansAfter: formData.plansAfter,
        memory: formData.memory,
      };

      const validation = steckbriefUpdateSchema.safeParse(textData);
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          fieldErrors[field] = issue.message;
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      // Build FormData for multipart upload
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append('quote', formData.quote);
      formDataToSend.append('plansAfter', formData.plansAfter);
      formDataToSend.append('memory', formData.memory);

      // Add profile image if changed
      if (imageFile) {
        formDataToSend.append('imageUrl', imageFile);
      }

      // Add existing memory images as JSON
      formDataToSend.append('existingMemoryImages', JSON.stringify(existingMemoryImages));

      // Add new memory image files
      newMemoryImageFiles.forEach(file => {
        formDataToSend.append('newMemoryImages', file);
      });

      // Save or submit
      if (action === 'draft') {
        const response = await fetch('/api/steckbrief', {
          method: 'PATCH',
          body: formDataToSend,
        });

        const data = await response.json();

        if (!response.ok) {
          setGeneralError(data.error || 'Ein Fehler ist aufgetreten.');
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Steckbrief als Entwurf gespeichert.');
        router.refresh();
      } else {
        // First save, then submit
        const saveResponse = await fetch('/api/steckbrief', {
          method: 'PATCH',
          body: formDataToSend,
        });

        if (!saveResponse.ok) {
          const data = await saveResponse.json();
          setGeneralError(data.error || 'Ein Fehler ist aufgetreten.');
          setIsLoading(false);
          return;
        }

        // Now submit for review
        const submitResponse = await fetch('/api/steckbrief/submit', {
          method: 'POST',
        });

        const data = await submitResponse.json();

        if (!submitResponse.ok) {
          setGeneralError(data.error || 'Ein Fehler ist aufgetreten.');
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Steckbrief erfolgreich eingereicht!');
        router.refresh();
      }

      setIsLoading(false);
    } catch (error) {
      setGeneralError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      setIsLoading(false);
    }
  };

  const isSubmitted = initialData.status !== 'DRAFT';

  return (
    <form className="space-y-6">
      {generalError && <ErrorMessage message={generalError} />}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {isSubmitted && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
          Dein Steckbrief wurde eingereicht und wird geprüft. Du kannst ihn nicht mehr bearbeiten.
        </div>
      )}

      {fields.map((field) => {
        let fieldValue = formData[field.key];

        // Special handling for images
        if (field.key === 'imageUrl') {
          fieldValue = imagePreview;
        } else if (field.key === 'memoryImages') {
          fieldValue = { existing: existingMemoryImages, new: newMemoryImageFiles };
        }

        return (
          <FieldRenderer
            key={field.key}
            field={field}
            value={fieldValue}
            onChange={(value) => handleFieldChange(field.key, value)}
            error={errors[field.key]}
            disabled={isLoading || isSubmitted}
          />
        );
      })}

      {!isSubmitted && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={handleSaveDraft}
            variant="secondary"
            loading={isLoading}
            className="flex-1"
          >
            Als Entwurf speichern
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            variant="primary"
            loading={isLoading}
            className="flex-1"
          >
            Zur Prüfung einreichen
          </Button>
        </div>
      )}
    </form>
  );
}
