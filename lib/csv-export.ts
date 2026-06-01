// CSV export utilities (RFC 4180) for InDesign Data Merge compatible files

const BOM = "\uFEFF";
const SEPARATOR = ",";

/**
 * Escape a value for CSV format per RFC 4180.
 * Embedded line breaks (CR/LF/CRLF) are collapsed to a single space because
 * InDesign Data Merge cannot parse quoted fields with real newlines — it
 * treats every \n as end-of-record and rejects the file.
 * Wraps in quotes if value contains separator or quotes. Doubles internal quotes.
 */
export function escapeCsvValue(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value).replace(/(?:\r\n|\r|\n)+/g, " ");
  if (str.includes(SEPARATOR) || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string from headers and rows.
 * Uses CRLF line endings per RFC 4180. Prepends UTF-8 BOM for Excel compatibility.
 */
export function buildCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvValue).join(SEPARATOR);
  const dataLines = rows.map((row) => row.map(escapeCsvValue).join(SEPARATOR));
  return BOM + [headerLine, ...dataLines].join("\r\n");
}

/**
 * Create a Response object for CSV file download.
 */
export function csvResponse(content: string, filename: string): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Sanitize a string for use in filenames.
 * Replaces German umlauts, lowercases, replaces non-alphanumeric with underscore.
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
