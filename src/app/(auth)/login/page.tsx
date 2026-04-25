'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BMCSeal from '@/components/brand/BMCSeal';
import { BMCHeritageBuilding } from '@/components/brand/Illustrations';

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      employeeId: employeeId.trim().toUpperCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid Employee ID or password. Please verify your credentials.');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-[var(--page-bg)]">
      {/* ─── LEFT: BMC Branded Panel ──────────────────────────── */}
      <div className="relative bg-bmc-900 text-white overflow-hidden hidden lg:flex flex-col justify-between p-10 xl:p-14">
        {/* Subtle dot grid background */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top-right warm gold radial */}
        <div
          className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, var(--gold-500) 0%, transparent 70%)' }}
        />

        {/* BMC HQ Heritage Building — anchored to bottom, full-width architectural backdrop */}
        <div className="absolute inset-x-0 bottom-0 h-[58%] flex items-end justify-center pointer-events-none text-bmc-700">
          <BMCHeritageBuilding className="w-full max-w-[760px] opacity-60" />
        </div>

        {/* Soft gradient at bottom blends building into navy floor */}
        <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--bmc-900) 0%, transparent 100%)' }}
        />

        {/* ── Top: Government identifier ───────────────── */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-12 bg-gold-500 rounded-full" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold-300 font-semibold">
                Government of Maharashtra
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                Brihanmumbai Municipal Corporation
              </p>
            </div>
          </div>
          <p className="text-[11px] text-white/50">{today}</p>
        </div>

        {/* ── Center: Seal + Title block ──────────────── */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto pt-4">
          {/* Compact seal */}
          <div className="relative inline-block">
            <div
              className="absolute -inset-3 blur-xl opacity-50"
              style={{ background: 'radial-gradient(circle, var(--gold-400) 0%, transparent 65%)' }}
            />
            <BMCSeal size={96} variant="full" className="relative" />
          </div>

          {/* Department label */}
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold-300 font-semibold mt-5">
            Solid Waste Management Department
          </p>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto my-4" />

          {/* Wordmark */}
          <h1 className="font-display text-5xl xl:text-6xl font-bold tracking-tight text-white">
            SWRMS
          </h1>
          <p className="font-display text-lg text-white/85 mt-2 font-medium">
            Smart Workforce &amp; Route Management
          </p>
          <p className="text-xs text-white/55 mt-3 leading-relaxed max-w-md">
            Geo-fenced attendance · AI-verified field photos · Real-time route tracking
          </p>

          {/* Three sub-pillars with gold dividers */}
          <div className="mt-8 grid grid-cols-3 gap-2 max-w-md w-full">
            {[
              { num: '24', label: 'BMC Wards' },
              { num: '9000', label: 'Tonnes / day' },
              { num: '11', label: 'UN SDG' },
            ].map((s, i) => (
              <div key={s.label} className={i === 1 ? 'border-x border-white/10' : ''}>
                <p className="font-display text-2xl font-bold text-gold-400">{s.num}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom: Address + SDG strip ─────────────── */}
        <div className="relative z-10 mt-auto">
          <div className="flex items-center justify-between text-[10px] text-white/45 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>Chembur Ward Office · Mumbai 400 071</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
              <span>SDG 11 · Sustainable Cities</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Login Form ──────────────────────────────────── */}
      <div className="relative flex flex-col">
        {/* Mobile-only top header */}
        <div className="lg:hidden bg-bmc-900 text-white px-5 py-4 flex items-center gap-3">
          <BMCSeal size={40} variant="minimal" />
          <div className="leading-tight">
            <p className="text-[9px] uppercase tracking-[0.18em] text-gold-300 font-semibold">
              BMC · SWM
            </p>
            <p className="text-sm font-display font-bold">SWRMS</p>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-sm animate-fade-in">
            {/* Form header */}
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold-700 font-bold mb-2">
                Employee Portal · Sign In
              </p>
              <h2 className="font-display text-2xl font-bold text-[var(--neutral-900)] leading-tight">
                Welcome back
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5">
                Sign in with your BMC credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee ID */}
              <div>
                <label
                  htmlFor="employeeId"
                  className="block text-[11px] font-bold text-[var(--neutral-700)] mb-1.5 uppercase tracking-wider"
                >
                  Employee ID
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                  </div>
                  <input
                    id="employeeId"
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="BMC-CHB-001"
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-3 py-2.5 text-sm font-mono border border-[var(--border-strong)] rounded-md bg-white text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-bmc-600 focus:ring-2 focus:ring-bmc-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-bold text-[var(--neutral-700)] uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-bmc-700 hover:text-bmc-800 hover:underline font-medium"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-[var(--border-strong)] rounded-md bg-white text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-bmc-600 focus:ring-2 focus:ring-bmc-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-500)] hover:text-[var(--neutral-700)]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-status-red-light border border-status-red/30 text-status-red text-xs px-3 py-2.5 rounded-md animate-fade-in">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="leading-snug">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !employeeId || !password}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-bmc-700 rounded-md hover:bg-bmc-800 focus:outline-none focus:ring-2 focus:ring-bmc-500/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-doc"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in to SWRMS
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Help link */}
            <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
              <p className="text-[11px] text-[var(--text-muted)]">
                Need an account?{' '}
                <Link href="/help" className="text-bmc-700 hover:text-bmc-800 font-medium">
                  Contact your ward administrator
                </Link>
              </p>
            </div>

            {/* Demo credentials hint */}
            <details className="mt-4 group">
              <summary className="text-[10px] text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)] select-none flex items-center gap-1">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                Demo credentials (pilot)
              </summary>
              <div className="mt-2 bg-gold-50 border border-gold-200 rounded-md p-3 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Admin:</span>
                  <code className="font-mono font-semibold text-[var(--neutral-800)]">BMC-CHB-ADMIN / bmc123</code>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Supervisor:</span>
                  <code className="font-mono font-semibold text-[var(--neutral-800)]">BMC-CHB-SUP01 / bmc123</code>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Staff:</span>
                  <code className="font-mono font-semibold text-[var(--neutral-800)]">BMC-CHB-001 / bmc123</code>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Bottom legal strip */}
        <div className="border-t border-[var(--border)] bg-[var(--surface-sunken)] px-6 py-4 sm:px-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed max-w-md">
              <strong className="text-[var(--text-secondary)]">Authorized personnel only.</strong> This system is restricted to BMC SWM staff.
              Unauthorized access is a punishable offense under the IT Act, 2000.
            </p>
            <div className="flex gap-4 text-[10px]">
              <Link href="/privacy" className="text-[var(--text-muted)] hover:text-bmc-700">Privacy</Link>
              <Link href="/terms" className="text-[var(--text-muted)] hover:text-bmc-700">Terms</Link>
              <Link href="/help" className="text-[var(--text-muted)] hover:text-bmc-700">Help</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
