"use client";

import { CsvImportPage, type ColumnDef } from "@/components/admin/CsvImportPage";

const columns: ColumnDef[] = [
  {
    key: "firstName",
    label: "Vorname",
    csvHeaders: ["vorname", "firstname", "first_name"],
    required: true,
  },
  {
    key: "lastName",
    label: "Nachname",
    csvHeaders: ["nachname", "lastname", "last_name"],
    required: true,
  },
  {
    key: "email",
    label: "Email",
    csvHeaders: ["email", "e-mail", "mail"],
    required: false,
  },
  {
    key: "gender",
    label: "Geschlecht",
    csvHeaders: ["geschlecht", "gender"],
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
        <strong>Vorname</strong> (Pflicht)
      </li>
      <li>
        <strong>Nachname</strong> (Pflicht)
      </li>
      <li>
        <strong>Email</strong> (Optional – wird automatisch generiert)
      </li>
      <li>
        <strong>Geschlecht</strong> (Optional – m oder w)
      </li>
    </ul>
    <p className="text-sm text-gray-500 mt-3">
      Beispiel: <code>Vorname;Nachname</code> oder{" "}
      <code>Vorname,Nachname,Email,Geschlecht</code>
    </p>
  </div>
);

export default function ImportStudentsPage() {
  return (
    <CsvImportPage
      title="CSV Import"
      backLink="/admin/verwaltung/schueler"
      backLabel="&larr; Zurück zur Schülerliste"
      apiEndpoint="/api/admin/students/import"
      columns={columns}
      formatInfo={formatInfo}
      entityName="Schüler"
    />
  );
}
