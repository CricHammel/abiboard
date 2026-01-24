"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Teacher {
  id: string;
  salutation: string;
  firstName: string | null;
  lastName: string;
  subject: string | null;
  _count: { teacherQuotes: number };
}

interface TeacherQuoteListProps {
  teachers: Teacher[];
  basePath?: string;
}

type SortMode = "alpha" | "quotes";

export function TeacherQuoteList({ teachers, basePath = "/lehrerzitate" }: TeacherQuoteListProps) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("alpha");

  const filtered = useMemo(() => {
    let result = teachers;

    if (search.trim()) {
      const words = search.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
      result = result.filter((t) => {
        const searchable = [
          t.salutation === "HERR" ? "herr" : "frau",
          t.firstName?.toLowerCase() || "",
          t.lastName.toLowerCase(),
          t.subject?.toLowerCase() || "",
        ].join(" ");
        return words.every((word) => searchable.includes(word));
      });
    }

    if (sortMode === "quotes") {
      result = [...result].sort((a, b) => b._count.teacherQuotes - a._count.teacherQuotes);
    }

    return result;
  }, [teachers, search, sortMode]);

  const totalQuotes = teachers.reduce((sum, t) => sum + t._count.teacherQuotes, 0);

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="text-sm text-gray-500">
        {teachers.length} Lehrer, {totalQuotes} Zitat{totalQuotes !== 1 ? "e" : ""} insgesamt
      </div>

      {/* Search and Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Lehrer suchen..."
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

      {/* Teacher list */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {search ? "Keine Lehrer gefunden." : "Keine Lehrer vorhanden."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((teacher) => (
            <Link
              key={teacher.id}
              href={`${basePath}/${teacher.id}`}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {teacher.salutation === "HERR" ? "Herr" : "Frau"}{" "}
                  {teacher.firstName && `${teacher.firstName} `}
                  {teacher.lastName}
                </p>
                {teacher.subject && (
                  <p className="text-sm text-gray-500">{teacher.subject}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {teacher._count.teacherQuotes} Zitat{teacher._count.teacherQuotes !== 1 ? "e" : ""}
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
