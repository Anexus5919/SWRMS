'use client';

import { useEffect, useState } from 'react';

interface StaffMember {
  _id: string;
  employeeId: string;
  name: { first: string; last: string };
  role: string;
  phone: string;
  ward: string;
  assignedRouteId: { name: string; code: string } | null;
  isActive: boolean;
}

interface RouteOption {
  _id: string;
  name: string;
  code: string;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    role: 'staff',
    phone: '',
    password: '',
    assignedRouteId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/staff').then((r) => r.json()),
      fetch('/api/routes').then((r) => r.json()),
    ])
      .then(([staffData, routeData]) => {
        if (staffData.success) setStaff(staffData.data);
        if (routeData.success) setRoutes(routeData.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error?.message || 'Failed to register');
        return;
      }

      // Refresh list
      const refreshed = await fetch('/api/staff').then((r) => r.json());
      if (refreshed.success) setStaff(refreshed.data);

      setShowForm(false);
      setFormData({ employeeId: '', firstName: '', lastName: '', role: 'staff', phone: '', password: '', assignedRouteId: '' });
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--neutral-800)]">
            Staff Management
          </h2>
          <p className="text-sm text-[var(--neutral-500)]">
            {staff.length} registered staff members
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-xs font-medium text-white bg-bmc-700 rounded hover:bg-bmc-800 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Register Staff'}
        </button>
      </div>

      {/* Registration form */}
      {showForm && (
        <div className="bg-white border border-[var(--border)] rounded-lg p-6 mb-6">
          <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-4">Register New Staff</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1 uppercase tracking-wider">Employee ID</label>
              <input type="text" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} placeholder="BMC-CHB-031" required className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] focus:outline-none focus:ring-2 focus:ring-bmc-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1 uppercase tracking-wider">First Name</label>
              <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] focus:outline-none focus:ring-2 focus:ring-bmc-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1 uppercase tracking-wider">Last Name</label>
              <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] focus:outline-none focus:ring-2 focus:ring-bmc-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1 uppercase tracking-wider">Role</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] focus:outline-none focus:ring-2 focus:ring-bmc-500/30">
                <option value="staff">Staff</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1 uppercase tracking-wider">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] focus:outline-none focus:ring-2 focus:ring-bmc-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1 uppercase tracking-wider">Password</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] focus:outline-none focus:ring-2 focus:ring-bmc-500/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1 uppercase tracking-wider">Assigned Route</label>
              <select value={formData.assignedRouteId} onChange={(e) => setFormData({ ...formData, assignedRouteId: e.target.value })} className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] focus:outline-none focus:ring-2 focus:ring-bmc-500/30">
                <option value="">None</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>{r.code} — {r.name}</option>
                ))}
              </select>
            </div>
            {formError && (
              <div className="sm:col-span-2 text-xs text-status-red bg-status-red-light border border-status-red/20 px-3 py-2 rounded">
                {formError}
              </div>
            )}
            <div className="sm:col-span-2">
              <button type="submit" disabled={submitting} className="px-6 py-2 text-xs font-medium text-white bg-bmc-700 rounded hover:bg-bmc-800 disabled:opacity-60 transition-colors">
                {submitting ? 'Registering...' : 'Register Staff'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff table */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--neutral-50)] border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Employee ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-[var(--neutral-400)]">Loading...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-[var(--neutral-400)]">No staff registered.</td></tr>
              ) : (
                staff.map((s) => (
                  <tr key={s._id} className="hover:bg-[var(--neutral-50)]">
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-[var(--neutral-700)]">{s.employeeId}</td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-800)]">{s.name.first} {s.name.last}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        s.role === 'admin' ? 'text-bmc-700 bg-bmc-50' :
                        s.role === 'supervisor' ? 'text-status-amber bg-status-amber-light' :
                        'text-[var(--neutral-600)] bg-[var(--neutral-100)]'
                      }`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-500)]">{s.phone}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[var(--neutral-500)]">
                      {s.assignedRouteId ? (s.assignedRouteId as any).code || '—' : '—'}
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
