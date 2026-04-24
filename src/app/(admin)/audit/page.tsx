'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Breadcrumbs,
  Button,
  EmptyState,
  Input,
  SkeletonRow,
  useToast,
} from '@/components/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Category = 'user' | 'route' | 'reallocation' | 'verification' | 'auth' | 'bulk';
type CategoryFilter = 'all' | Category;
type Role = 'admin' | 'supervisor' | 'staff' | 'system';

interface AuditEntry {
  _id: string;
  action: string;
  category: Category;
  actorId: { _id: string; employeeId?: string; name?: { first: string; last: string }; role?: Role } | null;
  actorEmployeeId: string | null;
  actorRole: Role;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  ward: string;
  createdAt: string;
}

interface SummaryBucket {
  _id: Category | null;
  count: number;
}

interface AuditResponse {
  success: boolean;
  data?: AuditEntry[];
  pagination?: { page: number; limit: number; total: number; pages: number };
  summary?: SummaryBucket[];
  error?: { code: string; message: string };
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All categories' },
  { value: 'user', label: 'User' },
  { value: 'route', label: 'Route' },
  { value: 'reallocation', label: 'Reallocation' },
  { value: 'verification', label: 'Verification' },
  { value: 'auth', label: 'Authentication' },
  { value: 'bulk', label: 'Bulk operations' },
];

const ACTION_OPTIONS: { value: string; label: string; category: Category }[] = [
  { value: 'user.created', label: 'User created', category: 'user' },
  { value: 'user.updated', label: 'User updated', category: 'user' },
  { value: 'user.deactivated', label: 'User deactivated', category: 'user' },
  { value: 'user.reactivated', label: 'User reactivated', category: 'user' },
  { value: 'user.face_registered', label: 'Face descriptor registered', category: 'user' },
  { value: 'route.created', label: 'Route created', category: 'route' },
  { value: 'route.updated', label: 'Route updated', category: 'route' },
  { value: 'route.status_changed', label: 'Route status changed', category: 'route' },
  { value: 'reallocation.created', label: 'Reallocation requested', category: 'reallocation' },
  { value: 'reallocation.approved', label: 'Reallocation approved', category: 'reallocation' },
  { value: 'reallocation.rejected', label: 'Reallocation rejected', category: 'reallocation' },
  { value: 'photo.approved', label: 'Photo approved', category: 'verification' },
  { value: 'photo.rejected', label: 'Photo rejected', category: 'verification' },
  { value: 'log.resolved', label: 'Verification log resolved', category: 'verification' },
  { value: 'log.dismissed', label: 'Verification log dismissed', category: 'verification' },
  { value: 'login.success', label: 'Login successful', category: 'auth' },
  { value: 'login.failed', label: 'Login failed', category: 'auth' },
  { value: 'logout', label: 'Logout', category: 'auth' },
  { value: 'bulk_import.staff', label: 'Bulk staff import', category: 'bulk' },
];

const CATEGORY_BADGE: Record<Category, 'blue' | 'gold' | 'green' | 'amber' | 'neutral'> = {
  user: 'blue',
  route: 'gold',
  reallocation: 'green',
  verification: 'amber',
  auth: 'neutral',
  bulk: 'blue',
};

const CATEGORY_LABEL: Record<Category, string> = {
  user: 'User',
  route: 'Route',
  reallocation: 'Reallocation',
  verification: 'Verification',
  auth: 'Auth',
  bulk: 'Bulk',
};

const ROLE_BADGE: Record<Role, 'blue' | 'amber' | 'neutral' | 'gold'> = {
  admin: 'blue',
  supervisor: 'amber',
  staff: 'neutral',
  system: 'gold',
};

const PAGE_SIZE = 50;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function humanizeAction(action: string): string {
  const match = ACTION_OPTIONS.find((a) => a.value === action);
  if (match) return match.label;
  // Fallback: take "noun.verb" → "Verb noun"
  const [noun, verb] = action.split('.');
  if (!verb) return action;
  return `${verb.charAt(0).toUpperCase()}${verb.slice(1).replace(/_/g, ' ')} ${noun}`;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 30) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function targetHref(entry: AuditEntry): string | null {
  if (!entry.targetId) return null;
  if (entry.targetType === 'user') return `/staff?focus=${entry.targetId}`;
  if (entry.targetType === 'route') return `/routes?focus=${entry.targetId}`;
  return null;
}

function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AuditLogPage() {
  const toast = useToast();

  // Filters
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [action, setAction] = useState<string>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Data
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [summary, setSummary] = useState<SummaryBucket[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [category, action, from, to, debouncedSearch]);

  // If category changes, reset action when current selection no longer matches
  useEffect(() => {
    if (action === 'all') return;
    const opt = ACTION_OPTIONS.find((a) => a.value === action);
    if (!opt) return;
    if (category !== 'all' && opt.category !== category) {
      setAction('all');
    }
  }, [category, action]);

  const filteredActionOptions = useMemo(() => {
    if (category === 'all') return ACTION_OPTIONS;
    return ACTION_OPTIONS.filter((a) => a.category === category);
  }, [category]);

  /* --- fetch --- */
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (category !== 'all') params.set('category', category);
      if (action !== 'all') params.set('action', action);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (debouncedSearch) params.set('q', debouncedSearch);

      const res = await fetch(`/api/audit?${params.toString()}`);
      const json: AuditResponse = await res.json();

      if (!res.ok || !json.success) {
        toast.error('Could not load audit log', json.error?.message ?? 'Please try again.');
        setEntries([]);
        setSummary([]);
        setPagination({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 });
        return;
      }

      setEntries(json.data ?? []);
      setSummary(json.summary ?? []);
      if (json.pagination) setPagination(json.pagination);
    } catch (err) {
      console.error(err);
      toast.error('Network error', 'Failed to reach the audit service.');
    } finally {
      setLoading(false);
    }
  }, [category, action, from, to, debouncedSearch, page, toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  /* --- summary stats (from API summary buckets) --- */
  const summaryByCategory = useMemo(() => {
    const map: Record<Category, number> = {
      user: 0,
      route: 0,
      reallocation: 0,
      verification: 0,
      auth: 0,
      bulk: 0,
    };
    summary.forEach((b) => {
      if (b._id && b._id in map) map[b._id] += b.count;
    });
    return map;
  }, [summary]);

  const totalShown = pagination.total;

  const resetFilters = () => {
    setCategory('all');
    setAction('all');
    setFrom('');
    setTo('');
    setSearch('');
  };

  const hasActiveFilters =
    category !== 'all' || action !== 'all' || !!from || !!to || !!debouncedSearch;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Breadcrumbs + heading */}
      <div>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/staff' },
            { label: 'Admin', href: '/staff' },
            { label: 'Audit Log' },
          ]}
        />
        <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Activity Audit Log
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              Tamper-evident chronological record of every consequential action
              taken in the BMC SWRMS system &mdash; user changes, route edits,
              reallocations, verification decisions and authentication events.
              Use this view for compliance review and incident investigation.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchEntries}>
            Refresh
          </Button>
        </div>
        <div className="divider-gold mt-4" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(CATEGORY_LABEL) as Category[]).map((cat) => {
          const count = summaryByCategory[cat];
          const variant = CATEGORY_BADGE[cat];
          const accent =
            variant === 'blue'
              ? 'border-l-bmc-700'
              : variant === 'gold'
                ? 'border-l-gold-500'
                : variant === 'green'
                  ? 'border-l-status-green'
                  : variant === 'amber'
                    ? 'border-l-status-amber'
                    : 'border-l-[var(--border-strong)]';
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory((prev) => (prev === cat ? 'all' : cat))}
              className={`text-left bg-white border border-[var(--border)] border-l-4 ${accent} rounded-lg px-4 py-3 shadow-doc transition-all hover:shadow-doc-md ${
                category === cat ? 'ring-2 ring-bmc-500/30' : ''
              }`}
            >
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {CATEGORY_LABEL[cat]}
              </p>
              <p className="font-display text-2xl font-bold text-[var(--text-primary)] mt-1 leading-none">
                {count.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                {category === cat ? 'filtered' : 'entries in range'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[var(--border)] rounded-lg shadow-doc p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[var(--neutral-700)] mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryFilter)}
              className="w-full px-3 py-2.5 text-sm border border-[var(--border-strong)] rounded-md bg-white text-[var(--text-primary)] focus:outline-none focus:border-bmc-600 focus:ring-2 focus:ring-bmc-500/20 transition-all"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--neutral-700)] mb-1.5 uppercase tracking-wider">
              Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[var(--border-strong)] rounded-md bg-white text-[var(--text-primary)] focus:outline-none focus:border-bmc-600 focus:ring-2 focus:ring-bmc-500/20 transition-all"
            >
              <option value="all">All actions</option>
              {filteredActionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              type="date"
              label="From"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
            />
          </div>

          <div>
            <Input
              type="date"
              label="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
            />
          </div>

          <div>
            <Input
              label="Search"
              type="search"
              placeholder="Employee ID or target"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              }
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)]">
              Showing <span className="font-semibold text-[var(--text-primary)]">{totalShown.toLocaleString('en-IN')}</span> matching {totalShown === 1 ? 'entry' : 'entries'}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-bmc-700 hover:text-bmc-800 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[var(--border)] rounded-lg shadow-doc overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-sunken)] border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--neutral-700)] uppercase tracking-wider w-[180px]">
                  When
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--neutral-700)] uppercase tracking-wider w-[150px]">
                  Action
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--neutral-700)] uppercase tracking-wider">
                  Actor
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--neutral-700)] uppercase tracking-wider">
                  Target
                </th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-[var(--neutral-700)] uppercase tracking-wider w-[100px]">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-2">
                    <EmptyState
                      title="No audit entries match your filters"
                      description={
                        hasActiveFilters
                          ? 'Try widening the date range, clearing filters, or searching for a different employee ID.'
                          : 'Once admins or supervisors begin acting in the system, every change will appear here for review.'
                      }
                      action={
                        hasActiveFilters ? (
                          <Button variant="secondary" size="sm" onClick={resetFilters}>
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isExpanded = expandedId === entry._id;
                  const targetLink = targetHref(entry);
                  const hasDetails =
                    (entry.changes && Object.keys(entry.changes).length > 0) ||
                    (entry.metadata && Object.keys(entry.metadata).length > 0) ||
                    !!entry.ipAddress ||
                    !!entry.userAgent;
                  const actorName =
                    entry.actorId?.name
                      ? `${entry.actorId.name.first} ${entry.actorId.name.last}`
                      : entry.actorRole === 'system'
                        ? 'System'
                        : 'Unknown actor';
                  const actorEmpId = entry.actorId?.employeeId ?? entry.actorEmployeeId;
                  return (
                    <Fragment key={entry._id}>
                      <tr className="hover:bg-[var(--surface-sunken)]/50 transition-colors">
                        <td className="px-4 py-3 align-top">
                          <span
                            title={formatAbsolute(entry.createdAt)}
                            className="text-xs text-[var(--text-secondary)] cursor-help"
                          >
                            {formatRelative(entry.createdAt)}
                          </span>
                          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                            {new Date(entry.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge variant={CATEGORY_BADGE[entry.category]} dot>
                            {CATEGORY_LABEL[entry.category]}
                          </Badge>
                          <p className="text-xs text-[var(--text-primary)] font-medium mt-1.5 leading-tight">
                            {humanizeAction(entry.action)}
                          </p>
                          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                            {entry.action}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                                {actorName}
                              </p>
                              {actorEmpId && (
                                <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                                  {actorEmpId}
                                </p>
                              )}
                            </div>
                            <Badge variant={ROLE_BADGE[entry.actorRole]}>
                              {entry.actorRole}
                            </Badge>
                          </div>
                          {entry.ipAddress && (
                            <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                              IP {entry.ipAddress}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {entry.targetLabel ? (
                            targetLink ? (
                              <Link
                                href={targetLink}
                                className="text-xs font-medium text-bmc-700 hover:text-bmc-800 hover:underline transition-colors"
                              >
                                {entry.targetLabel}
                              </Link>
                            ) : (
                              <span className="text-xs text-[var(--text-primary)]">
                                {entry.targetLabel}
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
                          )}
                          {entry.targetType && (
                            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-0.5">
                              {entry.targetType}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          {hasDetails ? (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : entry._id)}
                              className="text-[11px] font-semibold text-bmc-700 hover:text-bmc-800 transition-colors"
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? 'Hide' : 'View details'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">&mdash;</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && hasDetails && (
                        <tr className="bg-[var(--surface-sunken)]">
                          <td colSpan={5} className="px-6 py-4 border-t border-[var(--border)]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                              {/* Changes diff */}
                              <div>
                                <h4 className="text-[11px] font-bold text-[var(--neutral-700)] uppercase tracking-wider mb-2">
                                  Changes
                                </h4>
                                {entry.changes && Object.keys(entry.changes).length > 0 ? (
                                  <div className="space-y-2">
                                    {Object.entries(entry.changes).map(([field, diff]) => (
                                      <div
                                        key={field}
                                        className="bg-white border border-[var(--border)] rounded-md p-3"
                                      >
                                        <p className="text-[11px] font-bold font-mono text-bmc-700 mb-1.5">
                                          {field}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                          <div>
                                            <p className="text-[10px] uppercase tracking-wider text-status-red mb-0.5">
                                              From
                                            </p>
                                            <p className="text-[var(--text-primary)] break-all bg-status-red-light/40 px-2 py-1 rounded">
                                              {formatDiffValue(diff.from)}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] uppercase tracking-wider text-status-green mb-0.5">
                                              To
                                            </p>
                                            <p className="text-[var(--text-primary)] break-all bg-status-green-light/40 px-2 py-1 rounded">
                                              {formatDiffValue(diff.to)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-[var(--text-muted)] italic">
                                    No field-level changes recorded.
                                  </p>
                                )}
                              </div>

                              {/* Metadata + request context */}
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-[11px] font-bold text-[var(--neutral-700)] uppercase tracking-wider mb-2">
                                    Metadata
                                  </h4>
                                  {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                                    <pre className="bg-bmc-950 text-bmc-100 text-[11px] font-mono rounded-md p-3 overflow-x-auto leading-relaxed">
                                      {JSON.stringify(entry.metadata, null, 2)}
                                    </pre>
                                  ) : (
                                    <p className="text-xs text-[var(--text-muted)] italic">
                                      No additional metadata.
                                    </p>
                                  )}
                                </div>

                                {(entry.ipAddress || entry.userAgent || entry.ward) && (
                                  <div>
                                    <h4 className="text-[11px] font-bold text-[var(--neutral-700)] uppercase tracking-wider mb-2">
                                      Request context
                                    </h4>
                                    <dl className="text-[11px] font-mono text-[var(--text-secondary)] space-y-1">
                                      <div className="flex gap-2">
                                        <dt className="w-20 text-[var(--text-muted)] uppercase">Ward</dt>
                                        <dd className="text-[var(--text-primary)]">{entry.ward}</dd>
                                      </div>
                                      {entry.ipAddress && (
                                        <div className="flex gap-2">
                                          <dt className="w-20 text-[var(--text-muted)] uppercase">IP</dt>
                                          <dd className="text-[var(--text-primary)]">{entry.ipAddress}</dd>
                                        </div>
                                      )}
                                      {entry.userAgent && (
                                        <div className="flex gap-2">
                                          <dt className="w-20 text-[var(--text-muted)] uppercase">UA</dt>
                                          <dd className="text-[var(--text-primary)] break-all">{entry.userAgent}</dd>
                                        </div>
                                      )}
                                      <div className="flex gap-2">
                                        <dt className="w-20 text-[var(--text-muted)] uppercase">Logged</dt>
                                        <dd className="text-[var(--text-primary)]">{formatAbsolute(entry.createdAt)}</dd>
                                      </div>
                                    </dl>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && entries.length > 0 && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-[var(--border)] rounded-lg px-4 py-3 shadow-doc">
          <p className="text-xs text-[var(--text-secondary)]">
            Page <span className="font-semibold text-[var(--text-primary)]">{pagination.page}</span> of{' '}
            <span className="font-semibold text-[var(--text-primary)]">{pagination.pages}</span> &mdash;{' '}
            <span className="font-mono">{pagination.total.toLocaleString('en-IN')}</span> total entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page >= pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
