"use client";

export interface ColumnDef {
  key: string;
  label: string;
  csvHeaders: string[];
  required: boolean;
}

interface CsvImportPreviewProps {
  columns: ColumnDef[];
  rows: Record<string, string>[];
  onRowsChange: (rows: Record<string, string>[]) => void;
}

export function CsvImportPreview({
  columns,
  rows,
  onRowsChange,
}: CsvImportPreviewProps) {
  const handleCellChange = (
    rowIndex: number,
    columnKey: string,
    value: string
  ) => {
    const updated = rows.map((row, i) =>
      i === rowIndex ? { ...row, [columnKey]: value } : row
    );
    onRowsChange(updated);
  };

  const handleRemoveRow = (rowIndex: number) => {
    onRowsChange(rows.filter((_, i) => i !== rowIndex));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        {rows.length} {rows.length === 1 ? "Zeile" : "Zeilen"} erkannt
      </p>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                  {col.required && (
                    <span className="text-error ml-1">*</span>
                  )}
                </th>
              ))}
              <th className="px-2 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="px-2 py-1 text-xs text-gray-400 align-middle">
                  {rowIndex + 1}
                </td>
                {columns.map((col) => {
                  const value = row[col.key] || "";
                  const isEmpty = col.required && !value.trim();
                  return (
                    <td key={col.key} className="px-1 py-1">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          handleCellChange(rowIndex, col.key, e.target.value)
                        }
                        className={`
                          w-full px-2 py-2 text-sm rounded border min-h-[44px]
                          focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary
                          ${isEmpty ? "border-error bg-red-50" : "border-gray-200"}
                        `}
                      />
                    </td>
                  );
                })}
                <td className="px-1 py-1 align-middle">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(rowIndex)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Zeile entfernen"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Keine Zeilen vorhanden.
        </div>
      )}
    </div>
  );
}
