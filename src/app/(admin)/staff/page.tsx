'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  Input,
  useToast,
  useConfirm,
} from '@/components/ui';
import { SanitationWorker } from '@/components/brand/Illustrations';

interface StaffMember {
  _id: string;
  employeeId: string;
  name: { first: string; last: string };
  role: string;
  phone: string;
  ward: string;
  assignedRouteId: { name: string; code: string } | null;
  isActive: boolean;
  faceDescriptor: number[] | null;
  faceRegisteredAt: string | null;
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

  const toast = useToast();
  const confirm = useConfirm();

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

  const refreshStaff = async () => {
    const refreshed = await fetch('/api/staff').then((r) => r.json());
    if (refreshed.success) setStaff(refreshed.data);
  };

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
        const message = data.error?.message || 'Failed to register';
        setFormError(message);
        toast.error('Failed to create staff', message);
        return;
      }

      await refreshStaff();
      toast.success('Staff member created', `${formData.employeeId} added`);

      setShowForm(false);
      setFormData({ employeeId: '', firstName: '', lastName: '', role: 'staff', phone: '', password: '', assignedRouteId: '' });
    } catch {
      setFormError('Network error');
      toast.error('Failed to create staff', 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (member: StaffMember) => {
    const ok = await confirm({
      title: 'Deactivate staff?',
      description: 'They will lose access immediately.',
      variant: 'destructive',
      confirmLabel: 'Deactivate',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/staff/${member._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error('Could not deactivate', data.error?.message || 'Please try again.');
        return;
      }
      toast.success('Staff deactivated', `${member.employeeId} no longer has access`);
      await refreshStaff();
    } catch {
      toast.error('Could not deactivate', 'Network error');
    }
  };

  const roleBadgeVariant = (role: string): 'blue' | 'amber' | 'neutral' => {
    if (role === 'admin') return 'blue';
    if (role === 'supervisor') return 'amber';
    return 'neutral';
  };

  return (
    <div>
      <div className="mb-6">
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Staff Management' }]}
          className="mb-4"
        />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-bmc-700">
              Workforce
            </p>
            <h1 className="font-display text-3xl font-bold text-[var(--neutral-900)] mt-1">
              Staff Management
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Manage BMC SWM personnel across all wards
            </p>
            <div className="divider-gold w-24 my-4" />
            <p className="text-xs text-[var(--text-muted)]">
              {staff.length} registered staff members
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/staff/bulk-import">
              <Button variant="secondary">Bulk Import</Button>
            </Link>
            <Button variant="primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Register Staff'}
            </Button>
          </div>
        </div>
      </div>

      {/* Registration form */}
      {showForm && (
        <Card padded className="mb-6">
          <h3 className="font-display text-base font-semibold text-[var(--neutral-800)] mb-4">
            Register New Staff
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="staff-employee-id"
              label="Employee ID"
              type="text"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              placeholder="BMC-CHB-031"
              required
            />
            <Input
              id="staff-first-name"
              label="First Name"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              id="staff-last-name"
              label="Last Name"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
            <div>
              <label
                htmlFor="staff-role"
                className="block text-[11px] font-bold text-[var(--neutral-700)] mb-1.5 uppercase tracking-wider"
              >
                Role
              </label>
              <select
                id="staff-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-[var(--border-strong)] rounded-md bg-white text-[var(--text-primary)] focus:outline-none focus:border-bmc-600 focus:ring-2 focus:ring-bmc-500/20 transition-all"
              >
                <option value="staff">Staff</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Input
              id="staff-phone"
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              id="staff-password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <div className="sm:col-span-2">
              <label
                htmlFor="staff-route"
                className="block text-[11px] font-bold text-[var(--neutral-700)] mb-1.5 uppercase tracking-wider"
              >
                Assigned Route
              </label>
              <select
                id="staff-route"
                value={formData.assignedRouteId}
                onChange={(e) => setFormData({ ...formData, assignedRouteId: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-[var(--border-strong)] rounded-md bg-white text-[var(--text-primary)] focus:outline-none focus:border-bmc-600 focus:ring-2 focus:ring-bmc-500/20 transition-all"
              >
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
              <Button type="submit" variant="primary" loading={submitting}>
                {submitting ? 'Registering...' : 'Register Staff'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Staff table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--neutral-50)] border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Employee ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Route</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Face</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[var(--neutral-400)]">Loading...</td></tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-0 py-0">
                    <EmptyState
                      title="No staff registered"
                      description="Add your first staff member with the Register button above, or import a roster in bulk."
                      illustration={<SanitationWorker className="w-full h-full" />}
                    />
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s._id} className="hover:bg-[var(--neutral-50)]">
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-[var(--neutral-700)]">{s.employeeId}</td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-800)]">{s.name.first} {s.name.last}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleBadgeVariant(s.role)}>{s.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-500)]">{s.phone}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[var(--neutral-500)]">
                      {s.assignedRouteId ? s.assignedRouteId.code || '—' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {s.faceDescriptor && s.faceDescriptor.length === 128 ? (
                        <Badge variant="green">Registered</Badge>
                      ) : (
                        <Badge variant="red">Not registered</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(s)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
