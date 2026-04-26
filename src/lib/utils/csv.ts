/**
 * Tiny client-side CSV generator + browser download trigger.
 *
 * Used by the Export buttons on /admin-logs, /supervisor-logs,
 * /attendance-log, and /audit. Pure browser code — no server endpoint
 * needed because the data is already loaded into the page.
 *
 * RFC-4180 quoting: any field containing comma, quote, or newline is
 * wrapped in double quotes; embedded quotes are doubled. The output
 * starts with a UTF-8 BOM so Excel opens Hindi/Marathi text correctly
 * instead of mangling it as Latin-1.
 */

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const header = columns.map(escapeCsvField).join(',');
  const body = rows
    .map((row) => columns.map((col) => escapeCsvField(row[col])).join(','))
    .join('\r\n');
  // ﻿ = UTF-8 BOM so Excel opens non-ASCII text correctly.
  return '﻿' + header + '\r\n' + body;
}

/** Trigger a browser download of `csv` content as `<filename>.csv`. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Free the object URL after a short delay so the browser has actually
  // initiated the download. Synchronous revoke can race in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Convenience: turn a date into a YYYY-MM-DD-friendly slug for filenames. */
export function timestampSlug(d: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
