'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Bell icon with unread badge and a dropdown of the 5 most recent
 * notifications. Sits next to PushToggle in the supervisor bar.
 *
 * Polls /api/notifications/unread-count every 20 s. The dropdown
 * fetches the latest 5 on demand (when opened), so the polling
 * payload stays cheap.
 */

interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  url: string;
  pushDelivered: boolean;
  readAt: string | null;
  clickedAt: string | null;
  createdAt: string;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 60 * 60_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 24 * 60 * 60_000) return `${Math.floor(ms / (60 * 60_000))}h ago`;
  return `${Math.floor(ms / (24 * 60 * 60_000))}d ago`;
}

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      const json = await res.json();
      if (json.success) setUnread(json.data.unread);
    } catch {
      // Ignore - try again on next interval.
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 20_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Close on click outside.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openDropdown = async () => {
    setOpen(true);
    if (items !== null) return; // already loaded once this session
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=5');
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setUnread(json.data.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    setOpen(false);
    if (!item.readAt) {
      try {
        await fetch(`/api/notifications/${item.id}/read`, { method: 'POST' });
      } catch {
        // Best-effort - navigate anyway.
      }
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) =>
        prev ? prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)) : prev
      );
    }
    router.push(item.url || '/notifications');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-md border border-[var(--border-strong)] bg-white hover:bg-[var(--neutral-50)] transition-colors"
      >
        <svg className="w-5 h-5 text-[var(--neutral-700)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-status-red text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-doc-xl border border-[var(--border)] z-[1001] overflow-hidden animate-fade-in">
          <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--neutral-600)]">
              Notifications
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/notifications/read-all', { method: 'POST' });
                  setUnread(0);
                  setItems((prev) =>
                    prev ? prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) : prev
                  );
                }}
                className="text-[10px] text-bmc-700 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-center text-xs text-[var(--neutral-500)]">Loading…</div>
            )}
            {!loading && items && items.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-[var(--neutral-500)]">
                No notifications yet.
              </div>
            )}
            {!loading && items && items.length > 0 && (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={`w-full text-left px-4 py-2.5 border-b border-[var(--border)] hover:bg-[var(--neutral-50)] transition-colors flex gap-2.5 ${
                        n.readAt ? 'opacity-70' : ''
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 mt-1.5 w-2 h-2 rounded-full ${
                          n.readAt ? 'bg-[var(--neutral-300)]' : 'bg-status-red'
                        }`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--neutral-800)] truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-[var(--neutral-600)] line-clamp-2 mt-0.5">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-[var(--neutral-400)] mt-1">
                          {relativeTime(n.createdAt)}
                          {!n.pushDelivered && (
                            <span className="ml-2 text-amber-700" title="Recorded but not delivered to a browser">
                              · push not delivered
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--neutral-50)] text-right">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-bmc-700 hover:underline"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
