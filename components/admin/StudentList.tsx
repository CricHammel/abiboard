"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  createdAt: Date;
  userId: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    active: boolean;
    profile?: {
      status: "DRAFT" | "SUBMITTED" | "APPROVED";
    } | null;
  } | null;
}

interface StudentListProps {
  students: Student[];
  onEdit: (studentId: string) => void;
  onToggleActive: (
    studentId: string,
    studentName: string,
    isActive: boolean
  ) => void;
}

export function StudentList({
  students,
  onEdit,
  onToggleActive,
}: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [registrationFilter, setRegistrationFilter] = useState<
    "ALL" | "REGISTERED" | "NOT_REGISTERED"
  >("ALL");
  const [hideInactive, setHideInactive] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower);

      const matchesRegistration =
        registrationFilter === "ALL" ||
        (registrationFilter === "REGISTERED" && student.userId !== null) ||
        (registrationFilter === "NOT_REGISTERED" && student.userId === null);

      const matchesHideInactive = !hideInactive || student.active;

      return matchesSearch && matchesRegistration && matchesHideInactive;
    });
  }, [students, searchTerm, registrationFilter, hideInactive]);

  const getRegistrationBadge = (student: Student) => {
    if (student.userId) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Registriert
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Nicht registriert
      </span>
    );
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Aktiv
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Inaktiv
      </span>
    );
  };

  const getProfileStatusBadge = (status?: "DRAFT" | "SUBMITTED" | "APPROVED") => {
    if (!status) return null;

    const config = {
      DRAFT: { label: "Entwurf", className: "bg-gray-100 text-gray-700" },
      SUBMITTED: { label: "Eingereicht", className: "bg-yellow-100 text-yellow-700" },
      APPROVED: { label: "Genehmigt", className: "bg-green-100 text-green-700" },
    };

    const { label, className } = config[status];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Nach Name oder E-Mail suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
        />

        <select
          value={registrationFilter}
          onChange={(e) =>
            setRegistrationFilter(
              e.target.value as "ALL" | "REGISTERED" | "NOT_REGISTERED"
            )
          }
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
        >
          <option value="ALL">Alle</option>
          <option value="REGISTERED">Registriert</option>
          <option value="NOT_REGISTERED">Nicht registriert</option>
        </select>
      </div>

      {/* Checkbox to hide inactive */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hideInactive"
          checked={hideInactive}
          onChange={(e) => setHideInactive(e.target.checked)}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary-light"
        />
        <label
          htmlFor="hideInactive"
          className="text-sm text-gray-700 cursor-pointer"
        >
          Inaktive Einträge ausblenden
        </label>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-600">
        {filteredStudents.length}{" "}
        {filteredStudents.length === 1 ? "Schüler" : "Schüler"} gefunden
      </p>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                E-Mail
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registrierung
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Steckbrief
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
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{student.email}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getRegistrationBadge(student)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {student.user?.profile
                    ? getProfileStatusBadge(student.user.profile.status)
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getStatusBadge(student.active)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <button
                    onClick={() => onEdit(student.id)}
                    className="text-primary hover:underline"
                  >
                    Details
                  </button>
                  <button
                    onClick={() =>
                      onToggleActive(
                        student.id,
                        `${student.firstName} ${student.lastName}`,
                        student.active
                      )
                    }
                    className={`${
                      student.active
                        ? "text-red-600 hover:underline"
                        : "text-green-600 hover:underline"
                    }`}
                  >
                    {student.active ? "Deaktivieren" : "Aktivieren"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div>
              <h3 className="font-semibold text-gray-900">
                {student.firstName} {student.lastName}
              </h3>
              <p className="text-sm text-gray-600">{student.email}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {getRegistrationBadge(student)}
              {student.user?.profile && getProfileStatusBadge(student.user.profile.status)}
              {getStatusBadge(student.active)}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => onEdit(student.id)}
                className="flex-1 !py-2 text-sm"
              >
                Details
              </Button>
              <Button
                variant={student.active ? "danger" : "primary"}
                onClick={() =>
                  onToggleActive(
                    student.id,
                    `${student.firstName} ${student.lastName}`,
                    student.active
                  )
                }
                className="flex-1 !py-2 text-sm"
              >
                {student.active ? "Deaktivieren" : "Aktivieren"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Keine Schüler gefunden.
        </div>
      )}
    </div>
  );
}
