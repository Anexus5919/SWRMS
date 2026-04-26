'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  Spinner,
} from '@/components/ui';
import GPSReplayMap from '@/components/maps/DynamicGPSReplayMap';
import type { ReplayPing } from '@/components/maps/GPSReplayMap';

interface WorkerOption {
  userId: string;
  employeeId: string;
  name: string;
  ward: string | null;
  route: { code: string; name: string } | null;
  pingCount: number;
  offRoutePings: number;
  firstPing: string;
  lastPing: string;
}

interface ReplayDetail {
  date: string;
  worker: { userId: string; employeeId: string; name: string; ward: string };
  route: {
    _id: string;
    code: string;
    name: string;
    shiftStart: string;
    shiftEnd: string;
    routePolyline: string | null;
    startPoint: { lat: number; lng: number; label?: string };
    endPoint: { lat: number; lng: number; label?: string };
    geofenceRadius: number;
  } | null;
  pings: ReplayPing[];
}

function todayDateInput(): string {
  // YYYY-MM-DD in local zone - close enough for the date picker on a same-day desktop.
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

function formatTime(d: string | Date): string {
  return new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function ReplayPage() {
  const [date, setDate] = useState(todayDateInput);
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const [detail, setDetail] = useState<ReplayDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(8); // 1× = 1s real / 1s replay; 8× = compressed playback
  const tickRef = useRef<number | null>(null);

  // Fetch worker list whenever the date changes
  useEffect(() => {
    setLoadingWorkers(true);
    setSelectedWorkerId(null);
    setDetail(null);
    fetch(`/api/tracking/replay?date=${date}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setWorkers(json.data.workers);
          // Auto-select first worker for a quick start
          if (json.data.workers.length > 0) {
            setSelectedWorkerId(json.data.workers[0].userId);
          }
        }
      })
      .finally(() => setLoadingWorkers(false));
  }, [date]);

  // Fetch detail whenever the selected worker / date changes
  const fetchDetail = useCallback(() => {
    if (!selectedWorkerId) return;
    setLoadingDetail(true);
    setPlaying(false);
    fetch(`/api/tracking/replay?date=${date}&userId=${selectedWorkerId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setDetail(json.data);
          setCursor(0);
        }
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedWorkerId, date]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Auto-advance the cursor while playing
  useEffect(() => {
    if (!playing || !detail || detail.pings.length === 0) return;
    const tick = () => {
      setCursor((c) => {
        if (!detail || c >= detail.pings.length - 1) {
          setPlaying(false);
          return c;
        }
        return c + 1;
      });
    };
    // Real interval between consecutive pings ≈ 30s; we compress by speed.
    const intervalMs = Math.max(80, Math.round(30_000 / speed));
    tickRef.current = window.setInterval(tick, intervalMs);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [playing, detail, speed]);

  const summary = useMemo(() => {
    if (!detail) return null;
    const total = detail.pings.length;
    const off = detail.pings.filter((p) => p.isOffRoute).length;
    const mock = detail.pings.filter((p) => p.mockLocation).length;
    const first = detail.pings[0]?.recordedAt ?? null;
    const last = detail.pings[total - 1]?.recordedAt ?? null;
    return { total, off, mock, first, last };
  }, [detail]);

  const currentPing = detail?.pings[cursor] ?? null;

  return (
    <div>
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'GPS Replay' }]}
        className="mb-4"
      />
      <div className="mb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-bmc-700">
          Field Audit
        </p>
        <h1 className="font-display text-3xl font-bold text-[var(--neutral-900)] mt-1">
          GPS Replay
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Scrub through any worker&rsquo;s GPS trail for any day. Off-route pings are highlighted red.
        </p>
        <div className="divider-gold w-24 my-4" />
      </div>

      {/* Picker row */}
      <Card className="p-4 mb-4">
        <div className="flex items-end flex-wrap gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded border border-[var(--border)] bg-white"
              max={todayDateInput()}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-500)] mb-1">
              Worker {loadingWorkers && <span className="text-[var(--neutral-400)]">- loading…</span>}
            </label>
            <select
              value={selectedWorkerId ?? ''}
              onChange={(e) => setSelectedWorkerId(e.target.value || null)}
              className="px-3 py-1.5 text-sm rounded border border-[var(--border)] bg-white w-full"
              disabled={loadingWorkers || workers.length === 0}
            >
              {workers.length === 0 && (
                <option value="">No workers with GPS pings on this day</option>
              )}
              {workers.map((w) => (
                <option key={w.userId} value={w.userId}>
                  {w.name} ({w.employeeId}) · {w.route?.code ?? '-'} · {w.pingCount} pings
                  {w.offRoutePings > 0 ? ` · ${w.offRoutePings} off-route` : ''}
                </option>
              ))}
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchDetail} disabled={!selectedWorkerId || loadingDetail}>
            {loadingDetail ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
      </Card>

      {!selectedWorkerId ? (
        <Card>
          <EmptyState
            title="Select a worker"
            description={
              workers.length === 0 && !loadingWorkers
                ? 'No GPS pings were recorded on this date. Pick another date or check back after shifts have started.'
                : 'Choose a worker from the dropdown above to load their GPS trail.'
            }
          />
        </Card>
      ) : loadingDetail ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        </Card>
      ) : !detail || detail.pings.length === 0 ? (
        <Card>
          <EmptyState
            title="No GPS data for this worker"
            description="The worker has no recorded pings on the selected date. They may not have started a shift, or tracking was disabled."
          />
        </Card>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Card statusBorder="blue" className="px-4 py-3">
              <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Pings</p>
              <p className="text-xl font-bold text-[var(--neutral-800)] mt-0.5 font-display">{summary?.total}</p>
              <p className="text-[10px] text-[var(--neutral-400)]">total samples</p>
            </Card>
            <Card statusBorder={summary && summary.off > 0 ? 'red' : 'green'} className="px-4 py-3">
              <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Off route</p>
              <p className={`text-xl font-bold mt-0.5 font-display ${summary && summary.off > 0 ? 'text-status-red' : 'text-[var(--neutral-800)]'}`}>
                {summary?.off}
              </p>
              <p className="text-[10px] text-[var(--neutral-400)]">pings beyond threshold</p>
            </Card>
            <Card statusBorder={summary && summary.mock > 0 ? 'red' : 'amber'} className="px-4 py-3">
              <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Mock-GPS</p>
              <p className={`text-xl font-bold mt-0.5 font-display ${summary && summary.mock > 0 ? 'text-status-red' : 'text-[var(--neutral-800)]'}`}>
                {summary?.mock}
              </p>
              <p className="text-[10px] text-[var(--neutral-400)]">flagged samples</p>
            </Card>
            <Card statusBorder="gold" className="px-4 py-3">
              <p className="text-[10px] text-[var(--neutral-500)] uppercase tracking-wider">Window</p>
              <p className="text-sm font-bold text-[var(--neutral-800)] mt-0.5 font-mono">
                {summary?.first ? formatTime(summary.first) : '-'} → {summary?.last ? formatTime(summary.last) : '-'}
              </p>
              <p className="text-[10px] text-[var(--neutral-400)]">first to last ping</p>
            </Card>
          </div>

          {/* Map */}
          <Card className="p-3 mb-4">
            <GPSReplayMap
              pings={detail.pings}
              routePolyline={detail.route?.routePolyline}
              startPoint={detail.route?.startPoint ?? null}
              endPoint={detail.route?.endPoint ?? null}
              cursor={cursor}
              height="500px"
            />
          </Card>

          {/* Scrubber */}
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div>
                <p className="text-xs text-[var(--neutral-500)]">
                  {detail.worker.name} · {detail.route?.code ?? 'Unassigned'}
                </p>
                {currentPing && (
                  <p className="text-sm font-medium mt-0.5">
                    {formatTime(currentPing.recordedAt)}
                    {currentPing.isOffRoute && (
                      <Badge variant="red" className="ml-2">OFF ROUTE</Badge>
                    )}
                    {currentPing.mockLocation && (
                      <Badge variant="red" className="ml-2">MOCK GPS</Badge>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCursor(0)}
                  disabled={cursor === 0}
                  aria-label="Jump to start"
                >
                  ⏮
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCursor((c) => Math.max(0, c - 1))}
                  disabled={cursor === 0}
                  aria-label="Step back"
                >
                  ◀
                </Button>
                <Button
                  variant={playing ? 'ghost' : 'primary'}
                  size="sm"
                  onClick={() => setPlaying((p) => !p)}
                >
                  {playing ? '⏸ Pause' : '▶ Play'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCursor((c) => Math.min(detail.pings.length - 1, c + 1))}
                  disabled={cursor >= detail.pings.length - 1}
                  aria-label="Step forward"
                >
                  ▶
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCursor(detail.pings.length - 1)}
                  disabled={cursor >= detail.pings.length - 1}
                  aria-label="Jump to end"
                >
                  ⏭
                </Button>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="px-2 py-1 text-xs rounded border border-[var(--border)] bg-white"
                  aria-label="Playback speed"
                >
                  <option value={2}>2×</option>
                  <option value={4}>4×</option>
                  <option value={8}>8×</option>
                  <option value={16}>16×</option>
                  <option value={32}>32×</option>
                </select>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={detail.pings.length - 1}
              step={1}
              value={cursor}
              onChange={(e) => setCursor(Number(e.target.value))}
              className="w-full"
              aria-label="Replay scrubber"
            />
            <div className="flex justify-between text-[10px] text-[var(--neutral-500)] font-mono mt-1">
              <span>{detail.pings[0] ? formatTime(detail.pings[0].recordedAt) : '-'}</span>
              <span>
                {cursor + 1} / {detail.pings.length}
              </span>
              <span>
                {detail.pings[detail.pings.length - 1]
                  ? formatTime(detail.pings[detail.pings.length - 1].recordedAt)
                  : '-'}
              </span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
