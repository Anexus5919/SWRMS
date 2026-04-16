'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      employeeId,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid Employee ID or Password');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--neutral-50)]">
      {/* Official header strip */}
      <div className="bg-bmc-900 text-white px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-xs font-bold">
            BMC
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">
              Brihanmumbai Municipal Corporation
            </h1>
            <p className="text-[11px] text-white/60">
              Solid Waste Management Department
            </p>
          </div>
        </div>
      </div>

      {/* Login form area */}
      <div className="flex-1 flex items-start justify-center pt-16 sm:pt-24 px-4">
        <div className="w-full max-w-sm">
          {/* System title */}
          <div className="mb-8 text-center">
            <h2 className="text-lg font-semibold text-[var(--neutral-900)]">
              Staff Workforce Management System
            </h2>
            <p className="mt-1 text-sm text-[var(--neutral-500)]">
              Chembur Ward Office — Employee Portal
            </p>
          </div>

          {/* Login card */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="employeeId"
                  className="block text-xs font-medium text-[var(--neutral-700)] mb-1.5 uppercase tracking-wider"
                >
                  Employee ID
                </label>
                <input
                  id="employeeId"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. BMC-CHB-001"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:ring-2 focus:ring-bmc-500/30 focus:border-bmc-500 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-[var(--neutral-700)] mb-1.5 uppercase tracking-wider"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded bg-[var(--neutral-50)] text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:ring-2 focus:ring-bmc-500/30 focus:border-bmc-500 transition-colors"
                />
              </div>

              {error && (
                <div className="bg-status-red-light border border-status-red/20 text-status-red text-xs px-3 py-2 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-sm font-medium text-white bg-bmc-700 rounded hover:bg-bmc-800 focus:outline-none focus:ring-2 focus:ring-bmc-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-[10px] text-[var(--neutral-400)] leading-relaxed">
            Authorized personnel only. This system is for official use by
            BMC Solid Waste Management staff. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
