"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Alert } from "@/components/ui/Alert";
import { PhotoCategoryList } from "./PhotoCategoryList";
import { PhotoCategoryForm } from "./PhotoCategoryForm";

interface PhotoCategory {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  maxPerUser: number;
  order: number;
  active: boolean;
  _count: { photos: number };
}

interface PhotoCategoryManagementProps {
  initialCategories: PhotoCategory[];
}

export function PhotoCategoryManagement({
  initialCategories,
}: PhotoCategoryManagementProps) {
  const [categories, setCategories] =
    useState<PhotoCategory[]>(initialCategories);
  const [editingCategory, setEditingCategory] =
    useState<PhotoCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreate = async (data: {
    name: string;
    description: string;
    maxPerUser: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/photo-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: data.description || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      if (result.category) {
        setCategories((prev) => [...prev, result.category]);
      }

      setSuccessMessage("Rubrik erfolgreich erstellt.");
      setIsCreating(false);
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: {
    name: string;
    description: string;
    maxPerUser: number;
  }) => {
    if (!editingCategory) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/photo-categories/${editingCategory.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            description: data.description || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      if (result.category) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id ? result.category : c
          )
        );
      }

      setSuccessMessage("Rubrik erfolgreich aktualisiert.");
      setEditingCategory(null);
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (category: PhotoCategory) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/photo-categories/${category.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !category.active }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, active: !c.active } : c
        )
      );
      setSuccessMessage(
        category.active ? "Rubrik deaktiviert." : "Rubrik aktiviert."
      );
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (reorderedCategories: PhotoCategory[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/photo-categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryOrders: reorderedCategories.map((c, index) => ({
            id: c.id,
            order: index + 1,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      setCategories(
        reorderedCategories.map((c, index) => ({ ...c, order: index + 1 }))
      );
      setSuccessMessage("Reihenfolge aktualisiert.");
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {successMessage && (
        <Alert variant="success">{successMessage}</Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {categories.length} Rubriken
        </h2>
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditingCategory(null);
            setError(null);
            setSuccessMessage(null);
          }}
          variant="primary"
          disabled={isLoading || isCreating}
        >
          Neue Rubrik
        </Button>
      </div>

      {isCreating && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Neue Rubrik erstellen
          </h3>
          <PhotoCategoryForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isLoading={isLoading}
          />
        </div>
      )}

      {editingCategory && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Rubrik bearbeiten
          </h3>
          <PhotoCategoryForm
            category={editingCategory}
            onSubmit={handleUpdate}
            onCancel={() => setEditingCategory(null)}
            isLoading={isLoading}
          />
        </div>
      )}

      <PhotoCategoryList
        categories={categories}
        onEdit={(category) => {
          setEditingCategory(category);
          setIsCreating(false);
          setError(null);
          setSuccessMessage(null);
          setTimeout(
            () => window.scrollTo({ top: 0, behavior: "smooth" }),
            50
          );
        }}
        onToggleActive={handleToggleActive}
        onReorder={handleReorder}
        disabled={isLoading || isCreating || !!editingCategory}
      />
    </div>
  );
}
