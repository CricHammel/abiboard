"use client";

import { useState, useMemo } from "react";

interface StudentWithProfile {
  id: string;
  firstName: string;
  lastName: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profile: {
      status: "DRAFT" | "SUBMITTED";
      updatedAt: Date;
    } | null;
  } | null;
}

interface SteckbriefeOverviewProps {
  students: StudentWithProfile[];
}

type FilterStatus = "all" | "submitted" | "not-submitted";

export function SteckbriefeOverview({ students }: SteckbriefeOverviewProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const name = `${student.firstName} ${student.lastName}`.toLowerCase();
        if (!name.includes(searchLower)) return false;
      }

      // Status filter
      if (filter === "submitted") {
        return student.user?.profile?.status === "SUBMITTED";
      }
      if (filter === "not-submitted") {
        return !student.user || student.user.profile?.status !== "SUBMITTED";
      }

      return true;
    });
  }, [students, search, filter]);

  const getStatusBadge = (student: StudentWithProfile) => {
    if (!student.user) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Nicht registriert
        </span>
      );
    }
    if (!student.user.profile || student.user.profile.status === "DRAFT") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          Entwurf
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Eingereicht
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Name suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilter("submitted")}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              filter === "submitted"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Eingereicht
          </button>
          <button
            onClick={() => setFilter("not-submitted")}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              filter === "not-submitted"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Offen
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {filteredStudents.length} von {students.length} Schüler
      </p>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Letzte Aktualisierung
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-900">
                    {student.lastName}, {student.firstName}
                  </span>
                </td>
                <td className="py-3 px-4">{getStatusBadge(student)}</td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {student.user?.profile?.updatedAt
                    ? formatDate(student.user.profile.updatedAt)
                    : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {student.lastName}, {student.firstName}
              </p>
              {student.user?.profile?.updatedAt && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(student.user.profile.updatedAt)}
                </p>
              )}
            </div>
            {getStatusBadge(student)}
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Keine Schüler gefunden.
        </div>
      )}
    </div>
  );
}
