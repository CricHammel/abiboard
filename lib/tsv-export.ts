// TSV export utilities for InDesign Data Merge compatible files

const BOM = "\uFEFF";

/**
 * Escape a value for TSV format.
 * Wraps in quotes if value contains tabs, newlines, or quotes.
 * Doubles internal quotes.
 */
export function escapeTsvValue(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes("\t") || str.includes("\n") || str.includes("\r") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a TSV string from headers and rows.
 * Prepends UTF-8 BOM for Excel/InDesign compatibility.
 */
export function buildTsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeTsvValue).join("\t");
  const dataLines = rows.map((row) => row.map(escapeTsvValue).join("\t"));
  return BOM + [headerLine, ...dataLines].join("\n");
}

/**
 * Create a Response object for TSV file download.
 */
export function tsvResponse(content: string, filename: string): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
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
