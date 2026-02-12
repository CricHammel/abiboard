"use client";

import { useState } from "react";

interface ParticipationGroup {
  label: string;
  color: "green" | "amber" | "gray";
  items: { id: string; firstName: string; lastName: string }[];
}

interface ParticipationSectionProps {
  groups: ParticipationGroup[];
  className?: string;
}

const badgeColorMap = {
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  gray: "bg-gray-100 text-gray-600",
};

export function ParticipationSection({
  groups,
  className = "",
}: ParticipationSectionProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  const toggleGroup = (index: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {groups.map((group, index) => {
        if (group.items.length === 0) return null;
        const isExpanded = expandedGroups.has(index);

        return (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleGroup(index)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors min-h-[44px]"
            >
              <span className="text-sm font-medium text-gray-700">
                {group.label} ({group.items.length})
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isExpanded && (
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item.id}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${badgeColorMap[group.color]}`}
                    >
                      {item.firstName} {item.lastName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
