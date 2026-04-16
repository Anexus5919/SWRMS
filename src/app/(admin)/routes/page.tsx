'use client';

import { useEffect, useState } from 'react';

interface RoutePoint {
  lat: number;
  lng: number;
  label?: string;
}

interface RouteItem {
  _id: string;
  name: string;
  code: string;
  ward: string;
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  estimatedLengthKm: number;
  requiredStaff: number;
  geofenceRadius: number;
  shiftStart: string;
  shiftEnd: string;
  status: 'active' | 'inactive' | 'suspended';
}

const emptyForm = {
  name: '',
  code: '',
  ward: 'Chembur',
  startPointLat: '',
  startPointLng: '',
  startPointLabel: '',
  endPointLat: '',
  endPointLng: '',
  endPointLabel: '',
  estimatedLengthKm: '',
  requiredStaff: '1',
  geofenceRadius: '200',
  shiftStart: '06:00',
  shiftEnd: '14:00',
};

type FormData = typeof emptyForm;

export default function RouteManagementPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchRoutes = async () => {
    try {
      const res = await fetch('/api/routes');
      const data = await res.json();
      if (data.success) setRoutes(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const set = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const openEdit = (r: RouteItem) => {
    setEditingId(r._id);
    setFormData({
      name: r.name,
      code: r.code,
      ward: r.ward || 'Chembur',
      startPointLat: String(r.startPoint.lat),
      startPointLng: String(r.startPoint.lng),
      startPointLabel: r.startPoint.label || '',
      endPointLat: String(r.endPoint.lat),
      endPointLng: String(r.endPoint.lng),
      endPointLabel: r.endPoint.label || '',
      estimatedLengthKm: String(r.estimatedLengthKm),
      requiredStaff: String(r.requiredStaff),
      geofenceRadius: String(r.geofenceRadius),
      shiftStart: r.shiftStart,
      shiftEnd: r.shiftEnd,
    });
    setShowForm(true);
    setFormError('');
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    const payload = {
      name: formData.name,
      code: formData.code,
      ward: formData.ward,
      startPoint: {
        lat: parseFloat(formData.startPointLat),
        lng: parseFloat(formData.startPointLng),
        label: formData.startPointLabel || undefined,
      },
      endPoint: {
        lat: parseFloat(formData.endPointLat),
        lng: parseFloat(formData.endPointLng),
        label: formData.endPointLabel || undefined,
      },
      estimatedLengthKm: parseFloat(formData.estimatedLengthKm),
      requiredStaff: parseInt(formData.requiredStaff, 10),
      geofenceRadius: parseInt(formData.geofenceRadius, 10),
      shiftStart: formData.shiftStart,
      shiftEnd: formData.shiftEnd,
    };

    try {
      const url = editingId ? `/api/routes/${editingId}` : '/api/routes';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error?.message || 'Failed to save route');
        return;
      }

      await fetchRoutes();
      cancelForm();
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (route: RouteItem) => {
    setTogglingId(route._id);
    const newStatus = route.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/routes/${route._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchRoutes();
      }
    } catch {
      // silent
    } finally {
      setTogglingId(null);
    }
  };

  const inputCls =
    'w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30';
  const labelCls =
    'block text-xs font-medium text-[var(--neutral-600)] mb-1 uppercase tracking-wider';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--neutral-800)]">
            Route Management
          </h2>
          <p className="text-sm text-[var(--neutral-500)]">
            {routes.length} route{routes.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={() => (showForm ? cancelForm() : setShowForm(true))}
          className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Route'}
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white border border-[var(--border)] rounded-lg p-6 mb-6">
          <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-4">
            {editingId ? 'Edit Route' : 'Add New Route'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Name</label>
              <input type="text" value={formData.name} onChange={(e) => set('name', e.target.value)} placeholder="Main Road Sweep" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Code</label>
              <input type="text" value={formData.code} onChange={(e) => set('code', e.target.value)} placeholder="CHB-R01" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ward</label>
              <input type="text" value={formData.ward} onChange={(e) => set('ward', e.target.value)} placeholder="Chembur" className={inputCls} />
            </div>

            {/* Start Point */}
            <div>
              <label className={labelCls}>Start Latitude</label>
              <input type="number" step="any" value={formData.startPointLat} onChange={(e) => set('startPointLat', e.target.value)} placeholder="19.0522" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Start Longitude</label>
              <input type="number" step="any" value={formData.startPointLng} onChange={(e) => set('startPointLng', e.target.value)} placeholder="72.8994" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Start Label</label>
              <input type="text" value={formData.startPointLabel} onChange={(e) => set('startPointLabel', e.target.value)} placeholder="Gate entrance" className={inputCls} />
            </div>

            {/* End Point */}
            <div>
              <label className={labelCls}>End Latitude</label>
              <input type="number" step="any" value={formData.endPointLat} onChange={(e) => set('endPointLat', e.target.value)} placeholder="19.0555" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Longitude</label>
              <input type="number" step="any" value={formData.endPointLng} onChange={(e) => set('endPointLng', e.target.value)} placeholder="72.9015" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Label</label>
              <input type="text" value={formData.endPointLabel} onChange={(e) => set('endPointLabel', e.target.value)} placeholder="Market end" className={inputCls} />
            </div>

            {/* Numeric fields */}
            <div>
              <label className={labelCls}>Est. Length (km)</label>
              <input type="number" step="0.1" min="0.1" value={formData.estimatedLengthKm} onChange={(e) => set('estimatedLengthKm', e.target.value)} placeholder="2.5" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Required Staff</label>
              <input type="number" min="1" max="20" value={formData.requiredStaff} onChange={(e) => set('requiredStaff', e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Geofence Radius (m)</label>
              <input type="number" min="50" max="1000" value={formData.geofenceRadius} onChange={(e) => set('geofenceRadius', e.target.value)} className={inputCls} />
            </div>

            {/* Shift times */}
            <div>
              <label className={labelCls}>Shift Start</label>
              <input type="time" value={formData.shiftStart} onChange={(e) => set('shiftStart', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Shift End</label>
              <input type="time" value={formData.shiftEnd} onChange={(e) => set('shiftEnd', e.target.value)} className={inputCls} />
            </div>

            {formError && (
              <div className="sm:col-span-2 lg:col-span-3 text-xs text-status-red bg-status-red-light border border-status-red/20 px-3 py-2 rounded">
                {formError}
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="submit" disabled={submitting} className="px-6 py-2 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Saving...' : editingId ? 'Update Route' : 'Create Route'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Routes table */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--neutral-50)] border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Ward</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Shift</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Geofence</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--neutral-600)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-[var(--neutral-400)]">
                    Loading...
                  </td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-[var(--neutral-400)]">
                    No routes configured.
                  </td>
                </tr>
              ) : (
                routes.map((r) => (
                  <tr key={r._id} className="hover:bg-[var(--neutral-50)]">
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-[var(--neutral-700)]">
                      {r.code}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-800)]">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-500)]">
                      {r.ward || '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-600)]">
                      {r.requiredStaff}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[var(--neutral-500)] whitespace-nowrap">
                      {r.shiftStart} \u2014 {r.shiftEnd}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--neutral-500)]">
                      {r.geofenceRadius}m
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                          r.status === 'active'
                            ? 'text-emerald-700 bg-emerald-50'
                            : r.status === 'suspended'
                            ? 'text-status-amber bg-status-amber-light'
                            : 'text-[var(--neutral-500)] bg-[var(--neutral-100)]'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="text-[10px] font-medium text-emerald-700 hover:text-emerald-900 uppercase tracking-wider"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(r)}
                          disabled={togglingId === r._id}
                          className={`text-[10px] font-medium uppercase tracking-wider ${
                            r.status === 'active'
                              ? 'text-[var(--neutral-500)] hover:text-status-red'
                              : 'text-emerald-600 hover:text-emerald-800'
                          } disabled:opacity-50`}
                        >
                          {togglingId === r._id
                            ? '...'
                            : r.status === 'active'
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      </div>
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
