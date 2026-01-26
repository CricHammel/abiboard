"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  _count: { quotesAbout: number };
}

interface StudentQuoteListProps {
  students: Student[];
  basePath?: string;
}

type SortMode = "alpha" | "quotes";

export function StudentQuoteList({ students, basePath = "/schuelerzitate" }: StudentQuoteListProps) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("alpha");

  const filtered = useMemo(() => {
    let result = students;

    if (search.trim()) {
      const words = search.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
      result = result.filter((s) => {
        const searchable = [
          s.firstName.toLowerCase(),
          s.lastName.toLowerCase(),
        ].join(" ");
        return words.every((word) => searchable.includes(word));
      });
    }

    if (sortMode === "quotes") {
      result = [...result].sort((a, b) => b._count.quotesAbout - a._count.quotesAbout);
    }

    return result;
  }, [students, search, sortMode]);

  const totalQuotes = students.reduce((sum, s) => sum + s._count.quotesAbout, 0);

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="text-sm text-gray-500">
        {students.length} Schüler, {totalQuotes} Zitat{totalQuotes !== 1 ? "e" : ""} insgesamt
      </div>

      {/* Search and Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Schüler suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary min-h-[44px]"
        />
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="px-4 py-3 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary min-h-[44px]"
        >
          <option value="alpha">Alphabetisch</option>
          <option value="quotes">Nach Zitatanzahl</option>
        </select>
      </div>

      {/* Student list */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {search ? "Keine Schüler gefunden." : "Keine Schüler vorhanden."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((student) => (
            <Link
              key={student.id}
              href={`${basePath}/${student.id}`}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {student.firstName} {student.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {student._count.quotesAbout} Zitat{student._count.quotesAbout !== 1 ? "e" : ""}
                </span>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
