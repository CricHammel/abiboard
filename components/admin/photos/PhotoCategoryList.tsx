"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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

interface PhotoCategoryListProps {
  categories: PhotoCategory[];
  onEdit: (category: PhotoCategory) => void;
  onToggleActive: (category: PhotoCategory) => void;
  onReorder: (categories: PhotoCategory[]) => void;
  disabled?: boolean;
}

export function PhotoCategoryList({
  categories,
  onEdit,
  onToggleActive,
  onReorder,
  disabled,
}: PhotoCategoryListProps) {
  const [localCategories, setLocalCategories] =
    useState<PhotoCategory[]>(categories);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleDragStart = (index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    setOrderChanged(false);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || disabled) return;

    const newCategories = [...localCategories];
    const [draggedItem] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setLocalCategories(newCategories);
    setOrderChanged(true);
  };

  const handleDragEnd = () => {
    if (orderChanged && draggedIndex !== null) {
      onReorder(localCategories);
    }
    setDraggedIndex(null);
    setOrderChanged(false);
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    if (disabled) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localCategories.length) return;

    const newCategories = [...localCategories];
    const [item] = newCategories.splice(index, 1);
    newCategories.splice(newIndex, 0, item);

    setLocalCategories(newCategories);
    onReorder(newCategories);
  };

  if (localCategories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Keine Rubriken vorhanden. Erstelle die erste Rubrik.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {localCategories.map((category, index) => (
        <div
          key={category.id}
          draggable={!disabled}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            p-4 bg-white border rounded-lg
            ${!disabled ? "cursor-move" : ""}
            ${draggedIndex === index ? "opacity-50" : ""}
            ${!category.active ? "opacity-60 bg-gray-50" : ""}
            transition-all
          `}
        >
          {/* Desktop Layout (md+) */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {/* Drag Handle */}
            <div className="text-gray-400 flex-shrink-0">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </div>

            {/* Category Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {category.name}
              </p>
              <div className="flex gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                  Max. {category.maxPerUser} pro Person
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {category._count.photos} Fotos
                </span>
                <Badge variant={category.active ? "active" : "inactive"}>
                  {category.active ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
            </div>

            {/* Move Buttons */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => moveCategory(index, "up")}
                disabled={disabled || index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveCategory(index, "down")}
                disabled={disabled || index === localCategories.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => onEdit(category)}
                disabled={disabled}
                className="!py-2 !px-3 !text-sm"
              >
                Bearbeiten
              </Button>
              <Button
                variant={category.active ? "secondary" : "primary"}
                onClick={() => onToggleActive(category)}
                disabled={disabled}
                className="!py-2 !px-3 !text-sm"
              >
                {category.active ? "Deaktivieren" : "Aktivieren"}
              </Button>
            </div>
          </div>

          {/* Mobile Layout (< md) */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
                {category.name}
              </p>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => moveCategory(index, "up")}
                  disabled={disabled || index === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveCategory(index, "down")}
                  disabled={disabled || index === localCategories.length - 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                Max. {category.maxPerUser} pro Person
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {category._count.photos} Fotos
              </span>
              <Badge variant={category.active ? "active" : "inactive"}>
                {category.active ? "Aktiv" : "Inaktiv"}
              </Badge>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => onEdit(category)}
                disabled={disabled}
                className="flex-1 !py-2 !text-sm"
              >
                Bearbeiten
              </Button>
              <Button
                variant={category.active ? "secondary" : "primary"}
                onClick={() => onToggleActive(category)}
                disabled={disabled}
                className="flex-1 !py-2 !text-sm"
              >
                {category.active ? "Deaktivieren" : "Aktivieren"}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
