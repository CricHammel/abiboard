"use client";

import { CsvImportPage, type ColumnDef } from "@/components/admin/CsvImportPage";

const columns: ColumnDef[] = [
  {
    key: "text",
    label: "Text",
    csvHeaders: ["text", "frage", "question"],
    required: true,
  },
  {
    key: "type",
    label: "Typ",
    csvHeaders: ["typ", "type", "kategorie"],
    required: true,
  },
  {
    key: "answerMode",
    label: "Antwort-Modus",
    csvHeaders: ["answermode", "answer_mode", "modus", "geschlechtsspezifisch", "gender_specific"],
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
        <strong>Text</strong> (Pflicht) – Fragetext
      </li>
      <li>
        <strong>Typ</strong> (Pflicht) – Schüler oder Lehrer
      </li>
      <li>
        <strong>Antwort-Modus</strong> (Optional) – SINGLE, GENDER_SPECIFIC (oder m/w), DUO
      </li>
    </ul>
    <p className="text-sm text-gray-500 mt-3">
      Beispiel: <code>Text;Typ;Modus</code>
    </p>
  </div>
);

export default function ImportQuestionsPage() {
  return (
    <CsvImportPage
      title="CSV Import"
      backLink="/admin/rankings/fragen"
      backLabel="&larr; Zurück zu den Fragen"
      apiEndpoint="/api/admin/ranking-questions/import"
      columns={columns}
      formatInfo={formatInfo}
      entityName="Fragen"
    />
  );
}
