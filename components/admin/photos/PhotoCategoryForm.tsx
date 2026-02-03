"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface PhotoCategoryFormData {
  name: string;
  description: string;
  maxPerUser: number;
}

interface PhotoCategoryFormProps {
  category?: {
    id?: string;
    name: string;
    description: string | null;
    maxPerUser: number;
  };
  onSubmit: (data: PhotoCategoryFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function PhotoCategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading,
}: PhotoCategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [maxPerUser, setMaxPerUser] = useState(category?.maxPerUser ?? 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, maxPerUser });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="z. B. Klassenfahrt, Abiball, etc."
        required
        maxLength={100}
        disabled={isLoading}
      />

      <div className="mb-4">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-600 mb-2"
        >
          Beschreibung (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kurze Beschreibung der Rubrik..."
          maxLength={500}
          rows={3}
          disabled={isLoading}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
      </div>

      <Input
        label="Max. Fotos pro Person"
        type="number"
        value={maxPerUser}
        onChange={(e) => setMaxPerUser(parseInt(e.target.value) || 1)}
        min={1}
        max={50}
        disabled={isLoading}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isLoading} disabled={!name.trim()}>
          {category ? "Speichern" : "Erstellen"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
