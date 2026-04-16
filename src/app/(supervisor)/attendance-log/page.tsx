'use client';

import { useEffect, useState } from 'react';

interface AttendanceRecord {
  _id: string;
  userId: { employeeId: string; name: { first: string; last: string } };
  routeId: { name: string; code: string };
  checkInTime: string;
  distanceFromRoute: number;
  status: 'verified' | 'rejected' | 'pending_sync';
  rejectionReason?: string;
  isOfflineSync: boolean;
}

export default function AttendanceLogPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/attendance?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRecords(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date]);

  const verifiedCount = records.filter((r) => r.status === 'verified').length;
  const rejectedCount = records.filter((r) => r.status === 'rejected').length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--neutral-800)]">
            Attendance Log
          </h2>
          <p className="text-sm text-[var(--neutral-500)]">
            {verifiedCount} verified, {rejectedCount} rejected — {date}
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-1.5 text-xs border border-[var(--border)] rounded bg-white focus:outline-none focus:ring-2 focus:ring-bmc-500/30"
        />
      </div>

      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--neutral-50)] border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">
                  Employee
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">
                  Route
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">
                  Time
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">
                  Distance
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--neutral-400)] text-xs">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--neutral-400)] text-xs">
                    No attendance records for this date.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-[var(--neutral-50)]">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-[var(--neutral-800)]">
                        {record.userId?.name?.first} {record.userId?.name?.last}
                      </p>
                      <p className="text-[10px] text-[var(--neutral-400)] font-mono">
                        {record.userId?.employeeId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-semibold text-[var(--neutral-600)]">
                        {record.routeId?.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-600)]">
                      {new Date(record.checkInTime).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {record.isOfflineSync && (
                        <span className="ml-1 text-[10px] text-bmc-500">(synced)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-mono text-[var(--neutral-600)]">
                        {record.distanceFromRoute}m
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded ${
                          record.status === 'verified'
                            ? 'text-status-green bg-status-green-light'
                            : 'text-status-red bg-status-red-light'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
