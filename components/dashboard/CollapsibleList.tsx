'use client';

import { useState } from 'react';

interface CollapsibleListProps {
  title: string;
  count: number;
  items: { id: string; name: string }[];
  emptyText?: string;
  defaultOpen?: boolean;
}

export function CollapsibleList({
  title,
  count,
  items,
  emptyText = "Alle erledigt!",
  defaultOpen = false,
}: CollapsibleListProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors w-full"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>{title}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {count}
        </span>
      </button>

      {isOpen && (
        <div className="mt-2 ml-6">
          {items.length === 0 ? (
            <p className="text-sm text-green-600 font-medium">{emptyText}</p>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id} className="text-sm text-gray-600">
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
