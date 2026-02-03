"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { formatTeacherName } from "@/lib/format";

interface Teacher {
  id: string;
  salutation: "HERR" | "FRAU";
  firstName: string | null;
  lastName: string;
  subject: string | null;
  active: boolean;
}

interface TeacherListProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onToggleActive: (teacher: Teacher) => void;
  disabled?: boolean;
}

export function TeacherList({
  teachers,
  onEdit,
  onToggleActive,
  disabled,
}: TeacherListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hideInactive, setHideInactive] = useState(false);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        teacher.lastName.toLowerCase().includes(searchLower) ||
        (teacher.firstName?.toLowerCase().includes(searchLower) ?? false) ||
        (teacher.subject?.toLowerCase().includes(searchLower) ?? false);

      const matchesHideInactive = !hideInactive || teacher.active;

      return matchesSearch && matchesHideInactive;
    });
  }, [teachers, searchTerm, hideInactive]);

  const formatName = (teacher: Teacher) => {
    return formatTeacherName(teacher, { includeSubject: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Nach Name oder Fach suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hideInactiveTeachers"
          checked={hideInactive}
          onChange={(e) => setHideInactive(e.target.checked)}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary-light"
        />
        <label
          htmlFor="hideInactiveTeachers"
          className="text-sm text-gray-700 cursor-pointer"
        >
          Inaktive Einträge ausblenden
        </label>
      </div>

      <p className="text-sm text-gray-600">
        {filteredTeachers.length} Lehrer gefunden
      </p>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fach
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTeachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatName(teacher)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {teacher.subject || "—"}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {teacher.active ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Aktiv
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Inaktiv
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <button
                    onClick={() => onEdit(teacher)}
                    disabled={disabled}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => onToggleActive(teacher)}
                    disabled={disabled}
                    className={`hover:underline disabled:opacity-50 ${
                      teacher.active
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {teacher.active ? "Deaktivieren" : "Aktivieren"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden space-y-4">
        {filteredTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div>
              <h3 className="font-semibold text-gray-900">
                {formatName(teacher)}
              </h3>
              {teacher.subject && (
                <p className="text-sm text-gray-600">{teacher.subject}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {teacher.active ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Aktiv
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Inaktiv
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => onEdit(teacher)}
                disabled={disabled}
                className="flex-1 !py-2 text-sm"
              >
                Bearbeiten
              </Button>
              <Button
                variant={teacher.active ? "danger" : "primary"}
                onClick={() => onToggleActive(teacher)}
                disabled={disabled}
                className="flex-1 !py-2 text-sm"
              >
                {teacher.active ? "Deaktivieren" : "Aktivieren"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Keine Lehrer gefunden.
        </div>
      )}
    </div>
  );
}
