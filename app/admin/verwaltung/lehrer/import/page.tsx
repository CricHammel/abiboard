"use client";

import { CsvImportPage, type ColumnDef } from "@/components/admin/CsvImportPage";

const columns: ColumnDef[] = [
  {
    key: "salutation",
    label: "Anrede",
    csvHeaders: ["anrede", "salutation"],
    required: true,
  },
  {
    key: "lastName",
    label: "Nachname",
    csvHeaders: ["nachname", "lastname", "last_name"],
    required: true,
  },
  {
    key: "firstName",
    label: "Vorname",
    csvHeaders: ["vorname", "firstname", "first_name"],
    required: false,
  },
  {
    key: "subject",
    label: "Fach",
    csvHeaders: ["fach", "subject"],
    required: false,
  },
];

const formatInfo = (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="font-medium text-gray-900 mb-2">CSV-Format</h3>
    <p className="text-sm text-gray-600 mb-2">
      Die CSV-Datei muss folgende Spalten enthalten:
    </p>
    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
      <li>
        <strong>Anrede</strong> (Pflicht) – Hr. oder Fr.
      </li>
      <li>
        <strong>Nachname</strong> (Pflicht)
      </li>
      <li>
        <strong>Vorname</strong> (Optional)
      </li>
      <li>
        <strong>Fach</strong> (Optional)
      </li>
    </ul>
    <p className="text-sm text-gray-500 mt-3">
      Beispiel: <code>Anrede;Nachname;Vorname;Fach</code>
    </p>
  </div>
);

export default function ImportTeachersPage() {
  return (
    <CsvImportPage
      title="CSV Import"
      backLink="/admin/verwaltung/lehrer"
      backLabel="&larr; Zurück zur Lehrerliste"
      apiEndpoint="/api/admin/teachers/import"
      columns={columns}
      formatInfo={formatInfo}
      entityName="Lehrer"
    />
  );
}
