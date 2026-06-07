// CSV export utilities (RFC 4180) for InDesign Data Merge compatible files

const SEPARATOR = ",";

/**
 * Matches emoji and related code points (pictographs, variation selectors,
 * keycaps, skin-tone modifiers, ZWJ and regional indicators). Removed from
 * exports because InDesign cannot render them.
 */
const EMOJI_REGEX =
  /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{FE0F}\u{20E3}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu;

/** Strip emoji and collapse any whitespace their removal leaves behind. */
function stripEmoji(value: string): string {
  return value.replace(EMOJI_REGEX, "").replace(/ {2,}/g, " ").trim();
}

/**
 * Escape a value for CSV format per RFC 4180.
 * Embedded line breaks (CR/LF/CRLF) are collapsed to a single space because
 * InDesign Data Merge cannot parse quoted fields with real newlines — it
 * treats every \n as end-of-record and rejects the file. Emojis are stripped
 * for the same reason (InDesign cannot render them).
 * Wraps in quotes if value contains separator or quotes. Doubles internal quotes.
 */
export function escapeCsvValue(value: string | null | undefined): string {
  if (value == null) return "";
  const str = stripEmoji(String(value).replace(/(?:\r\n|\r|\n)+/g, " "));
  if (str.includes(SEPARATOR) || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string from headers and rows.
 * Uses CRLF line endings per RFC 4180. No BOM is emitted because InDesign
 * Data Merge fails to parse UTF-8 files that start with one.
 */
export function buildCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvValue).join(SEPARATOR);
  const dataLines = rows.map((row) => row.map(escapeCsvValue).join(SEPARATOR));
  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Create a Response object for CSV file download.
 * Encodes as UTF-16 LE with BOM. This is the only encoding InDesign Data
 * Merge reliably recognizes as Unicode — UTF-8 (with or without BOM) is
 * misread as MacRoman/Windows-1252, breaking umlauts and other non-ASCII
 * characters in placed text.
 */
export function csvResponse(content: string, filename: string): Response {
  const bytes = Buffer.from("﻿" + content, "utf16le");
  return new Response(bytes, {
    headers: {
      "Content-Type": "text/csv; charset=utf-16le",
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
