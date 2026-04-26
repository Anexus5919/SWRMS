'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Badge, Breadcrumbs, Button, Card, EmptyState, Skeleton } from '@/components/ui';

interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  url: string;
  tag: string | null;
  context: Record<string, unknown> | null;
  pushDelivered: boolean;
  readAt: string | null;
  clickedAt: string | null;
  createdAt: string;
}

const kindLabels: Record<string, string> = {
  missed_shift: 'Missed Shift',
  route_deviation: 'Route Deviation',
  idle_alert: 'Idle Alert',
  mock_location: 'Mock GPS',
  reallocation_executed: 'Reallocation',
  manual: 'Manual',
};

const kindBadgeVariant: Record<string, 'red' | 'amber' | 'blue' | 'green' | 'neutral'> = {
  missed_shift: 'red',
  route_deviation: 'amber',
  idle_alert: 'amber',
  mock_location: 'red',
  reallocation_executed: 'green',
  manual: 'neutral',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (reset: boolean) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      params.set('limit', '20');
      params.set('filter', filter);
      if (!reset && cursor) params.set('cursor', cursor);

      try {
        const res = await fetch(`/api/notifications?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setItems((prev) => (reset ? json.data.items : [...prev, ...json.data.items]));
          setCursor(json.data.nextCursor);
          setHasMore(json.data.hasMore);
          setUnreadCount(json.data.unreadCount);
          setTotalCount(json.data.totalCount);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter, cursor]
  );

  // Reload from scratch whenever the filter changes.
  useEffect(() => {
    setCursor(null);
    setItems([]);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const markRead = async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((u) => Math.max(0, u - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch {
      // Optimistic - server will catch up next visit.
    }
  };

  const markAllRead = async () => {
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch {
      // Optimistic.
    }
  };

  return (
    <div>
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Notifications' }]}
        className="mb-4"
      />
      <div className="flex items-start justify-between flex-wrap gap-4 mb-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-bmc-700">
            Inbox
          </p>
          <h1 className="font-display text-3xl font-bold text-[var(--neutral-900)] mt-1">
            Notifications
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {totalCount} total · {unreadCount} unread
          </p>
          <div className="divider-gold w-24 my-4" />
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-[var(--neutral-100)] rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                filter === 'all' ? 'bg-white shadow-sm text-[var(--neutral-800)]' : 'text-[var(--neutral-500)]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                filter === 'unread' ? 'bg-white shadow-sm text-[var(--neutral-800)]' : 'text-[var(--neutral-500)]'
              }`}
            >
              Unread {unreadCount > 0 && <span className="ml-1 text-status-red">({unreadCount})</span>}
            </button>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Card>
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton height="h-2" width="w-2" rounded="full" className="mt-2" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton height="h-3" width="w-1/2" />
                  <Skeleton height="h-3" width="w-3/4" />
                  <Skeleton height="h-2" width="w-20" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description={
              filter === 'unread'
                ? 'You are all caught up. Anything new will appear here.'
                : 'When the system sends you alerts (missed shifts, route deviations, mock-GPS warnings), they will appear in this inbox.'
            }
          />
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--border)]">
          {items.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start gap-3 ${n.readAt ? 'bg-white' : 'bg-status-red-light/40'}`}
            >
              <span
                className={`flex-shrink-0 mt-2 w-2 h-2 rounded-full ${
                  n.readAt ? 'bg-[var(--neutral-300)]' : 'bg-status-red'
                }`}
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={kindBadgeVariant[n.kind] ?? 'neutral'}>
                    {kindLabels[n.kind] ?? n.kind}
                  </Badge>
                  <span className="text-xs text-[var(--neutral-500)]">
                    {formatTimestamp(n.createdAt)}
                  </span>
                  {!n.pushDelivered && (
                    <Badge variant="amber" className="ml-auto">
                      Push not delivered
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-[var(--neutral-800)] mt-1">{n.title}</p>
                <p className="text-sm text-[var(--neutral-600)] mt-0.5">{n.body}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Link
                    href={n.url}
                    onClick={() => !n.readAt && markRead(n.id)}
                    className="text-xs font-medium text-bmc-700 hover:underline"
                  >
                    Open →
                  </Link>
                  {!n.readAt && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="text-xs text-[var(--neutral-500)] hover:text-[var(--neutral-700)]"
                    >
                      Mark read
                    </button>
                  )}
                  {n.clickedAt && (
                    <span className="text-[10px] text-[var(--neutral-400)] ml-auto">
                      Opened from notification
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => load(false)} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
