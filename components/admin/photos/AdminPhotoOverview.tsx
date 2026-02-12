"use client";

import Image from "next/image";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  photoCount: number;
  firstPhotoUrl: string | null;
}

interface AdminPhotoOverviewProps {
  categories: Category[];
  basePath?: string;
}

export function AdminPhotoOverview({ categories, basePath = "/admin/fotos/galerie" }: AdminPhotoOverviewProps) {
  const totalPhotos = categories.reduce((sum, cat) => sum + cat.photoCount, 0);

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Keine aktiven Rubriken vorhanden.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        {totalPhotos} Fotos in {categories.length} Rubriken
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const imageUrl =
            category.coverImageUrl || category.firstPhotoUrl || null;

          return (
            <Link
              key={category.id}
              href={`${basePath}/${category.id}`}
              className="group block"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <svg
                      className="w-16 h-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg truncate">
                    {category.name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {category.photoCount} Fotos
                  </p>
                  {category.description && (
                    <p className="text-white/60 text-xs mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
