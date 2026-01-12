"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Role, ProfileStatus } from "@prisma/client";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  profile?: { status: ProfileStatus } | null;
}

interface UserListProps {
  users: User[];
  onEdit: (userId: string) => void;
  onToggleActive: (userId: string, userName: string, isActive: boolean) => void;
}

export function UserList({ users, onEdit, onToggleActive }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );
  const [hideInactive, setHideInactive] = useState(false);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);

      // Role filter
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      // Status filter
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.active) ||
        (statusFilter === "INACTIVE" && !user.active);

      // Hide inactive filter
      const matchesHideInactive = !hideInactive || user.active;

      return matchesSearch && matchesRole && matchesStatus && matchesHideInactive;
    });
  }, [users, searchTerm, roleFilter, statusFilter, hideInactive]);

  const getRoleBadge = (role: Role) => {
    return role === "ADMIN" ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Admin
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        Student
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

  const getProfileStatusBadge = (status?: ProfileStatus) => {
    if (!status) return null;

    const labels = {
      DRAFT: "Entwurf",
      SUBMITTED: "Eingereicht",
      APPROVED: "Genehmigt",
    };

    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      SUBMITTED: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {labels[status]}
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
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "ALL" | Role)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
        >
          <option value="ALL">Alle Rollen</option>
          <option value="STUDENT">Studenten</option>
          <option value="ADMIN">Admins</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
          }
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
        >
          <option value="ALL">Alle Status</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="INACTIVE">Inaktiv</option>
        </select>
      </div>

      {/* Checkbox to hide inactive users */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hideInactive"
          checked={hideInactive}
          onChange={(e) => setHideInactive(e.target.checked)}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary-light"
        />
        <label htmlFor="hideInactive" className="text-sm text-gray-700 cursor-pointer">
          Inaktive Benutzer ausblenden
        </label>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-600">
        {filteredUsers.length} {filteredUsers.length === 1 ? "Benutzer" : "Benutzer"}{" "}
        gefunden
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
                Rolle
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profil
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{user.email}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getStatusBadge(user.active)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {user.role === "STUDENT" && user.profile
                    ? getProfileStatusBadge(user.profile.status)
                    : "—"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <button
                    onClick={() => onEdit(user.id)}
                    className="text-primary hover:underline"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() =>
                      onToggleActive(
                        user.id,
                        `${user.firstName} ${user.lastName}`,
                        user.active
                      )
                    }
                    className={`${
                      user.active
                        ? "text-red-600 hover:underline"
                        : "text-green-600 hover:underline"
                    }`}
                  >
                    {user.active ? "Deaktivieren" : "Aktivieren"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div>
              <h3 className="font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {getRoleBadge(user.role)}
              {getStatusBadge(user.active)}
              {user.role === "STUDENT" &&
                user.profile &&
                getProfileStatusBadge(user.profile.status)}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => onEdit(user.id)}
                className="flex-1 !py-2 text-sm"
              >
                Bearbeiten
              </Button>
              <Button
                variant={user.active ? "danger" : "primary"}
                onClick={() =>
                  onToggleActive(
                    user.id,
                    `${user.firstName} ${user.lastName}`,
                    user.active
                  )
                }
                className="flex-1 !py-2 text-sm"
              >
                {user.active ? "Deaktivieren" : "Aktivieren"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Keine Benutzer gefunden.
        </div>
      )}
    </div>
  );
}
