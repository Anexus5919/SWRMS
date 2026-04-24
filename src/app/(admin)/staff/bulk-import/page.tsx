'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Breadcrumbs,
  Button,
  EmptyState,
  Spinner,
  useConfirm,
  useToast,
} from '@/components/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RoleValue = 'admin' | 'supervisor' | 'staff';

interface ParsedRow {
  rowNumber: number; // CSV row (header = 1, first data = 2)
  raw: Record<string, string>;
  employeeId: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  password: string;
  routeCode?: string;
  errors: string[];
}

interface ImportResult {
  row: number;
  status: 'created' | 'skipped' | 'failed';
  employeeId: string;
  message?: string;
}

interface ImportResponseData {
  totalRows: number;
  created: number;
  skipped: number;
  failed: number;
  results: ImportResult[];
}

interface ImportResponse {
  success: boolean;
  data?: ImportResponseData;
  error?: { code: string; message: string };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REQUIRED_COLUMNS = ['employeeId', 'firstName', 'lastName', 'role', 'phone', 'password'] as const;
const OPTIONAL_COLUMNS = ['routeCode'] as const;
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
const VALID_ROLES: RoleValue[] = ['admin', 'supervisor', 'staff'];

const TEMPLATE_HEADER = ALL_COLUMNS.join(',');
const TEMPLATE_EXAMPLE_ROW = [
  'BMC-CHB-031',
  'Rajesh',
  'Patil',
  'staff',
  '9876543210',
  'ChangeMe@123',
  'CHB-R-007',
].join(',');

const PREVIEW_LIMIT = 10;
const LARGE_IMPORT_THRESHOLD = 50;

const STATUS_BADGE: Record<ImportResult['status'], 'green' | 'amber' | 'red'> = {
  created: 'green',
  skipped: 'amber',
  failed: 'red',
};

/* ------------------------------------------------------------------ */
/*  CSV parser (handles quoted fields with embedded commas)            */
/* ------------------------------------------------------------------ */

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): { headers: string[]; rows: ParsedRow[] } {
  const cleaned = text.replace(/^﻿/, ''); // strip BOM
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = (cells[idx] ?? '').trim();
    });

    const errors: string[] = [];

    REQUIRED_COLUMNS.forEach((col) => {
      if (!raw[col]) errors.push(`Missing ${col}`);
    });

    if (raw.role && !VALID_ROLES.includes(raw.role as RoleValue)) {
      errors.push(`Invalid role "${raw.role}"`);
    }

    if (raw.phone && !/^\+?\d{7,15}$/.test(raw.phone.replace(/[\s-]/g, ''))) {
      errors.push('Phone format looks invalid');
    }

    if (raw.password && raw.password.length < 6) {
      errors.push('Password too short (min 6)');
    }

    rows.push({
      rowNumber: i + 1,
      raw,
      employeeId: raw.employeeId ?? '',
      firstName: raw.firstName ?? '',
      lastName: raw.lastName ?? '',
      role: raw.role ?? '',
      phone: raw.phone ?? '',
      password: raw.password ?? '',
      routeCode: raw.routeCode || undefined,
      errors,
    });
  }

  return { headers, rows };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BulkImportPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponseData | null>(null);

  /* --- derived stats --- */
  const stats = useMemo(() => {
    const valid = rows.filter((r) => r.errors.length === 0).length;
    const invalid = rows.length - valid;
    return { total: rows.length, valid, invalid };
  }, [rows]);

  const missingHeaders = useMemo(() => {
    if (headers.length === 0) return [];
    return REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  }, [headers]);

  /* --- handlers --- */
  const resetState = useCallback(() => {
    setFileName('');
    setHeaders([]);
    setRows([]);
    setParseError('');
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setParseError('');
      setImportResult(null);

      if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        setParseError('Please upload a .csv file.');
        toast.error('Unsupported file', 'Only .csv files are accepted.');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setParseError('File too large (max 2 MB).');
        toast.error('File too large', 'Bulk imports are capped at 2 MB to keep things responsive.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = String(e.target?.result ?? '');
        const { headers: hdrs, rows: parsed } = parseCsv(text);

        if (hdrs.length === 0 || parsed.length === 0) {
          setParseError('No data rows found in the CSV.');
          setHeaders(hdrs);
          setRows([]);
          return;
        }

        setFileName(file.name);
        setHeaders(hdrs);
        setRows(parsed);
        toast.success(`${parsed.length} rows parsed`, `${file.name} is ready for review.`);
      };
      reader.onerror = () => {
        setParseError('Could not read the file.');
        toast.error('Read failed', 'The file could not be read.');
      };
      reader.readAsText(file);
    },
    [toast],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const downloadTemplate = useCallback(() => {
    const csv = `${TEMPLATE_HEADER}\n${TEMPLATE_EXAMPLE_ROW}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bmc-staff-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadResults = useCallback(() => {
    if (!importResult) return;
    const header = 'row,employeeId,status,message';
    const lines = importResult.results.map((r) =>
      [r.row, r.employeeId, r.status, (r.message ?? '').replace(/"/g, '""')]
        .map((v, i) => (i === 3 && r.message ? `"${v}"` : String(v)))
        .join(','),
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bmc-staff-import-results-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [importResult]);

  const handleImport = useCallback(async () => {
    const validRows = rows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) {
      toast.warning('Nothing to import', 'All rows have validation errors.');
      return;
    }

    if (validRows.length > LARGE_IMPORT_THRESHOLD) {
      const ok = await confirm({
        title: `Import ${validRows.length} staff members?`,
        description:
          'This is a large batch. Each row will create a new BMC SWRMS user account with login credentials. Continue?',
        confirmLabel: `Import ${validRows.length}`,
        cancelLabel: 'Cancel',
      });
      if (!ok) return;
    }

    setSubmitting(true);
    setImportResult(null);
    try {
      const payload = {
        rows: validRows.map((r) => ({
          employeeId: r.employeeId,
          firstName: r.firstName,
          lastName: r.lastName,
          role: r.role,
          phone: r.phone,
          password: r.password,
          routeCode: r.routeCode,
        })),
      };

      const res = await fetch('/api/staff/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json: ImportResponse = await res.json();

      if (!res.ok || !json.success || !json.data) {
        toast.error('Import failed', json.error?.message ?? 'Please try again.');
        return;
      }

      setImportResult(json.data);
      toast.success(
        'Import complete',
        `${json.data.created} created, ${json.data.skipped} skipped, ${json.data.failed} failed.`,
      );
    } catch (err) {
      console.error(err);
      toast.error('Network error', 'Could not reach the import service.');
    } finally {
      setSubmitting(false);
    }
  }, [rows, confirm, toast]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const previewRows = rows.slice(0, PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, rows.length - PREVIEW_LIMIT);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs + heading */}
      <div>
        <Breadcrumbs
          items={[
            { label: 'Staff Management', href: '/staff' },
            { label: 'Bulk Import' },
          ]}
        />
        <div className="mt-3">
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Import Staff from CSV
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
            Onboard multiple BMC SWRMS users in a single batch. Download the
            template, fill in the rows, and upload &mdash; we will validate every
            entry before any record is created.
          </p>
        </div>
        <div className="divider-gold mt-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* ───────── Left column: Instructions / template ───────── */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <section className="bmc-paper border border-[var(--border)] rounded-lg shadow-doc p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-bmc-700 text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </span>
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                CSV format
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              The first row must contain column headers exactly as listed
              below. Required columns must be non-empty for every record.
            </p>

            <div className="mt-4 divide-y divide-[var(--border)] border border-[var(--border)] rounded-md overflow-hidden">
              {ALL_COLUMNS.map((col) => {
                const required = (REQUIRED_COLUMNS as readonly string[]).includes(col);
                return (
                  <div
                    key={col}
                    className="flex items-center justify-between px-3 py-2 bg-white"
                  >
                    <code className="text-xs font-mono font-semibold text-bmc-800">
                      {col}
                    </code>
                    {required ? (
                      <Badge variant="red">Required</Badge>
                    ) : (
                      <Badge variant="neutral">Optional</Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <ul className="mt-4 space-y-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed">
              <li>
                <span className="font-semibold text-[var(--text-primary)]">role</span> must be one of{' '}
                <code className="font-mono text-bmc-700">admin</code>,{' '}
                <code className="font-mono text-bmc-700">supervisor</code> or{' '}
                <code className="font-mono text-bmc-700">staff</code>.
              </li>
              <li>
                <span className="font-semibold text-[var(--text-primary)]">routeCode</span> must
                match an existing route code (e.g.{' '}
                <code className="font-mono text-bmc-700">CHB-R-007</code>).
              </li>
              <li>
                <span className="font-semibold text-[var(--text-primary)]">password</span> is
                hashed before storage. Encourage users to change it on first
                login.
              </li>
              <li>Maximum 200 rows per import.</li>
            </ul>

            <div className="mt-5">
              <Button variant="gold" size="sm" onClick={downloadTemplate} className="w-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download template CSV
              </Button>
            </div>
          </section>

          <section className="bg-bmc-50 border border-bmc-200 rounded-lg p-4">
            <h3 className="font-display text-sm font-bold text-bmc-900 mb-1.5">
              Before you import
            </h3>
            <ul className="text-[11px] text-bmc-900/80 leading-relaxed list-disc pl-4 space-y-1">
              <li>Duplicate employee IDs are skipped (not overwritten).</li>
              <li>Each row is validated independently &mdash; partial success is allowed.</li>
              <li>An audit-log entry is recorded for every batch.</li>
            </ul>
          </section>
        </aside>

        {/* ───────── Right column: Upload + preview + results ───────── */}
        <section className="space-y-5">
          {/* Upload area */}
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`relative bg-white border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? 'border-bmc-600 bg-bmc-50/50 shadow-doc-md'
                : 'border-[var(--border-strong)] hover:border-bmc-500'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-bmc-50 border border-bmc-200 flex items-center justify-center text-bmc-700">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                </svg>
              </div>
              <div>
                <p className="font-display text-base font-semibold text-[var(--text-primary)]">
                  {fileName ? `Loaded: ${fileName}` : 'Drop your CSV here, or browse'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  CSV files only &mdash; up to 2 MB / 200 rows
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                >
                  Choose file
                </Button>
                {fileName && (
                  <Button variant="ghost" size="sm" onClick={resetState} disabled={submitting}>
                    Clear
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="hidden"
              />
            </div>

            {parseError && (
              <p className="mt-4 text-xs text-status-red bg-status-red-light border border-status-red/30 px-3 py-2 rounded inline-block">
                {parseError}
              </p>
            )}
          </div>

          {/* Header validation banner */}
          {headers.length > 0 && missingHeaders.length > 0 && (
            <div className="bg-status-red-light border border-status-red/30 text-status-red-dark rounded-md p-4">
              <p className="text-sm font-semibold">Missing required columns</p>
              <p className="text-xs mt-1 leading-relaxed">
                Your CSV is missing:{' '}
                {missingHeaders.map((c) => (
                  <code key={c} className="font-mono font-semibold mr-1.5">
                    {c}
                  </code>
                ))}
                <br />
                Please add these columns and re-upload.
              </p>
            </div>
          )}

          {/* Preview + stats */}
          {rows.length > 0 && missingHeaders.length === 0 && (
            <div className="bg-white border border-[var(--border)] rounded-lg shadow-doc overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-sunken)]">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">
                    Preview
                  </h3>
                  <Badge variant="neutral">
                    {stats.total} {stats.total === 1 ? 'row' : 'rows'}
                  </Badge>
                  <Badge variant="green">{stats.valid} valid</Badge>
                  {stats.invalid > 0 && <Badge variant="red">{stats.invalid} invalid</Badge>}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Showing first {Math.min(PREVIEW_LIMIT, rows.length)} of {rows.length}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-sunken)] border-b border-[var(--border)]">
                      <th className="text-left px-3 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider w-10">
                        #
                      </th>
                      <th className="text-center px-3 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider w-14">
                        OK
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider">
                        Route
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider">
                        Issues
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {previewRows.map((r) => {
                      const ok = r.errors.length === 0;
                      return (
                        <tr key={r.rowNumber} className={ok ? '' : 'bg-status-red-light/30'}>
                          <td className="px-3 py-2 text-[11px] font-mono text-[var(--text-muted)]">
                            {r.rowNumber}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {ok ? (
                              <span className="inline-flex w-5 h-5 rounded-full bg-status-green-light text-status-green items-center justify-center" aria-label="Valid">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </span>
                            ) : (
                              <span className="inline-flex w-5 h-5 rounded-full bg-status-red-light text-status-red items-center justify-center" aria-label="Invalid">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono font-semibold text-[var(--text-primary)]">
                            {r.employeeId || <span className="text-status-red">(empty)</span>}
                          </td>
                          <td className="px-3 py-2 text-xs text-[var(--text-primary)]">
                            {r.firstName || r.lastName ? `${r.firstName} ${r.lastName}`.trim() : <span className="text-status-red">(empty)</span>}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {r.role ? (
                              <Badge variant={r.role === 'admin' ? 'blue' : r.role === 'supervisor' ? 'amber' : 'neutral'}>
                                {r.role}
                              </Badge>
                            ) : (
                              <span className="text-status-red text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-[var(--text-secondary)]">
                            {r.phone || <span className="text-status-red">(empty)</span>}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-[var(--text-secondary)]">
                            {r.routeCode || <span className="text-[var(--text-muted)]">—</span>}
                          </td>
                          <td className="px-3 py-2 text-[11px] text-status-red leading-tight">
                            {r.errors.length > 0 ? r.errors.join('; ') : <span className="text-status-green">OK</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hiddenCount > 0 && (
                <p className="text-[11px] text-[var(--text-muted)] text-center py-2 bg-[var(--surface-sunken)] border-t border-[var(--border)]">
                  + {hiddenCount} more {hiddenCount === 1 ? 'row' : 'rows'} not shown &mdash;
                  all rows will be processed when you import.
                </p>
              )}

              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)] bg-white">
                <p className="text-xs text-[var(--text-secondary)]">
                  {stats.invalid > 0 ? (
                    <>
                      <span className="font-semibold text-status-red">{stats.invalid}</span>{' '}
                      {stats.invalid === 1 ? 'row has' : 'rows have'} validation errors and will
                      be skipped.
                    </>
                  ) : (
                    <>All rows passed client-side validation. Server will perform final checks.</>
                  )}
                </p>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={submitting || stats.valid === 0}
                  loading={submitting}
                >
                  {submitting
                    ? 'Importing…'
                    : `Import ${stats.valid} staff ${stats.valid === 1 ? 'member' : 'members'}`}
                </Button>
              </div>
            </div>
          )}

          {/* Empty state when nothing loaded */}
          {rows.length === 0 && !parseError && !importResult && (
            <div className="bg-white border border-[var(--border)] rounded-lg shadow-doc">
              <EmptyState
                title="No file loaded yet"
                description="Drop a CSV above or use the template to get started. We will validate every row before any account is created."
                action={
                  <Button variant="secondary" size="sm" onClick={downloadTemplate}>
                    Download template CSV
                  </Button>
                }
              />
            </div>
          )}

          {/* Import results */}
          {importResult && (
            <div className="bg-white border border-[var(--border)] rounded-lg shadow-doc overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] bg-bmc-50/60 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-bmc-900">Import results</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Processed {importResult.totalRows.toLocaleString('en-IN')} rows.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={downloadResults}>
                  Download results CSV
                </Button>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-b border-[var(--border)]">
                <div className="px-5 py-4">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Created</p>
                  <p className="font-display text-2xl font-bold text-status-green mt-1">
                    {importResult.created.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Skipped</p>
                  <p className="font-display text-2xl font-bold text-status-amber mt-1">
                    {importResult.skipped.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Failed</p>
                  <p className="font-display text-2xl font-bold text-status-red mt-1">
                    {importResult.failed.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[480px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[var(--surface-sunken)] border-b border-[var(--border)]">
                      <th className="text-left px-4 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider w-16">
                        Row
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider w-28">
                        Status
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-bold text-[var(--neutral-700)] uppercase tracking-wider">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {importResult.results.map((r, idx) => (
                      <tr key={`${r.row}-${idx}`} className="hover:bg-[var(--surface-sunken)]/60">
                        <td className="px-4 py-2 text-xs font-mono text-[var(--text-muted)]">{r.row}</td>
                        <td className="px-4 py-2 text-xs font-mono font-semibold text-[var(--text-primary)]">
                          {r.employeeId}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={STATUS_BADGE[r.status]} dot>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">
                          {r.message ?? <span className="text-[var(--text-muted)]">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {submitting && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Spinner /> Sending rows to the server…
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
