"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | null;
}

interface TeacherOption {
  id: string;
  salutation: "HERR" | "FRAU";
  firstName: string | null;
  lastName: string;
  subject: string | null;
}

type PersonOption =
  | { type: "student"; data: StudentOption }
  | { type: "teacher"; data: TeacherOption };

interface PersonAutocompleteProps {
  personType: "student" | "teacher";
  gender?: "MALE" | "FEMALE";
  excludeUserId?: string;
  selectedPerson?: PersonOption | null;
  allStudents?: StudentOption[];
  allTeachers?: TeacherOption[];
  onSelect: (person: PersonOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

function getStudentDisplayName(student: StudentOption, allStudents?: StudentOption[]): string {
  // Check for duplicate first names
  const duplicates = allStudents?.filter(
    (s) => s.firstName === student.firstName && s.id !== student.id
  );
  if (duplicates && duplicates.length > 0) {
    return `${student.firstName} ${student.lastName.charAt(0)}.`;
  }
  return student.firstName;
}

function getTeacherDisplayName(teacher: TeacherOption): string {
  const salutation = teacher.salutation === "HERR" ? "Hr." : "Fr.";
  const name = `${salutation} ${teacher.lastName}`;
  return teacher.subject ? `${name} (${teacher.subject})` : name;
}

export function PersonAutocomplete({
  personType,
  gender,
  excludeUserId,
  selectedPerson,
  allStudents,
  allTeachers,
  onSelect,
  disabled,
  placeholder,
}: PersonAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({ q: searchQuery });
      if (gender) params.set("gender", gender);
      if (excludeUserId && personType === "student") params.set("excludeUserId", excludeUserId);

      const endpoint = personType === "student"
        ? `/api/rankings/search/students?${params}`
        : `/api/rankings/search/teachers?${params}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (personType === "student" && data.students) {
        setResults(
          data.students.map((s: StudentOption) => ({ type: "student" as const, data: s }))
        );
      } else if (personType === "teacher" && data.teachers) {
        setResults(
          data.teachers.map((t: TeacherOption) => ({ type: "teacher" as const, data: t }))
        );
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [personType, gender, excludeUserId]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search(value);
    }, 300);
  };

  const handleSelect = (person: PersonOption) => {
    onSelect(person);
    setQuery("");
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setResults([]);
  };

  const getDisplayName = (person: PersonOption): string => {
    if (person.type === "student") {
      return getStudentDisplayName(person.data, allStudents);
    }
    return getTeacherDisplayName(person.data);
  };

  // If a person is selected, show it
  if (selectedPerson) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 min-h-[44px]">
        <span className="flex-1 text-sm text-gray-900">
          {getDisplayName(selectedPerson)}
        </span>
        {!disabled && (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-red-500 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
            title="Auswahl entfernen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (query.trim()) setIsOpen(true);
        }}
        placeholder={placeholder || (personType === "student" ? "Name eingeben..." : "Lehrer suchen...")}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light min-h-[44px] text-base disabled:bg-gray-100 disabled:text-gray-500"
      />

      {isOpen && (query.trim() || isSearching) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[240px] overflow-y-auto">
          {isSearching && (
            <div className="px-4 py-3 text-sm text-gray-500">Suche...</div>
          )}
          {!isSearching && results.length === 0 && query.trim() && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Keine Ergebnisse gefunden.
            </div>
          )}
          {!isSearching &&
            results.map((person) => {
              const key = person.type === "student" ? person.data.id : person.data.id;
              return (
                <button
                  key={key}
                  onClick={() => handleSelect(person)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 min-h-[44px] flex items-center"
                >
                  {getDisplayName(person)}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
