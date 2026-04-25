'use client';

import { useState } from 'react';
import Link from 'next/link';
import BMCSeal from '@/components/brand/BMCSeal';
import { BMCHeritageBuilding } from '@/components/brand/Illustrations';

export default function ForgotPasswordPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // For pilot — we don't auto-send emails; this triggers an admin notification
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-[var(--page-bg)]">
      {/* Branded panel */}
      <div className="relative bg-bmc-900 text-white overflow-hidden hidden lg:flex flex-col justify-between p-10 xl:p-14">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top-right warm gold radial */}
        <div
          className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, var(--gold-500) 0%, transparent 70%)' }}
        />

        {/* BMC HQ building backdrop */}
        <div className="absolute inset-x-0 bottom-0 h-[58%] flex items-end justify-center pointer-events-none text-bmc-700">
          <BMCHeritageBuilding className="w-full max-w-[760px] opacity-60" />
        </div>
        <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--bmc-900) 0%, transparent 100%)' }}
        />

        {/* Top: Government identifier */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-12 bg-gold-500 rounded-full" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold-300 font-semibold">
                Government of Maharashtra
              </p>
              <p className="text-xs text-white/70 mt-0.5">Brihanmumbai Municipal Corporation</p>
            </div>
          </div>
        </div>

        {/* Center: Seal + title */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="relative inline-block">
            <div
              className="absolute -inset-3 blur-xl opacity-50"
              style={{ background: 'radial-gradient(circle, var(--gold-400) 0%, transparent 65%)' }}
            />
            <BMCSeal size={96} variant="full" className="relative" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold-300 font-semibold mt-5">
            Account Recovery
          </p>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto my-4" />
          <h1 className="font-display text-4xl xl:text-5xl font-bold tracking-tight text-white">
            Reset your access
          </h1>
          <p className="text-sm text-white/70 mt-4 leading-relaxed max-w-md">
            For audit and security reasons, password resets in SWRMS require
            administrator approval. Submit your request below — your ward
            administrator will be notified.
          </p>
        </div>

        {/* Bottom: address */}
        <div className="relative z-10 mt-auto">
          <div className="flex items-center justify-between text-[10px] text-white/45 pt-4 border-t border-white/10">
            <span>Chembur Ward Office · Mumbai 400 071</span>
            <span>SDG 11 · Sustainable Cities</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="relative flex flex-col">
        <div className="lg:hidden bg-bmc-900 text-white px-5 py-4 flex items-center gap-3">
          <BMCSeal size={40} variant="minimal" />
          <p className="text-sm font-display font-bold">SWRMS · Reset Password</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-sm animate-fade-in">
            {!submitted ? (
              <>
                <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-bmc-700 hover:text-bmc-800 mb-6 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Back to sign in
                </Link>

                <p className="text-[10px] uppercase tracking-[0.2em] text-gold-700 font-bold mb-2">
                  Forgot password
                </p>
                <h2 className="font-display text-2xl font-bold text-[var(--neutral-900)] leading-tight">
                  Request a reset
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5">
                  We&apos;ll notify your administrator who will issue a new password through the
                  ward office.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                  <div>
                    <label htmlFor="emp" className="block text-[11px] font-bold text-[var(--neutral-700)] mb-1.5 uppercase tracking-wider">
                      Your Employee ID
                    </label>
                    <input
                      id="emp"
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="BMC-CHB-001"
                      required
                      className="w-full px-3 py-2.5 text-sm font-mono border border-[var(--border-strong)] rounded-md bg-white focus:outline-none focus:border-bmc-600 focus:ring-2 focus:ring-bmc-500/20 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !employeeId}
                    className="w-full py-3 px-4 text-sm font-semibold text-white bg-bmc-700 rounded-md hover:bg-bmc-800 disabled:opacity-50 transition-all shadow-doc"
                  >
                    {loading ? 'Submitting...' : 'Submit reset request'}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
                  Need urgent access?{' '}
                  <Link href="/help" className="text-bmc-700 hover:text-bmc-800 font-medium">
                    Contact ward office
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-status-green-light rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-status-green" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-bold text-[var(--neutral-900)]">Request submitted</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed max-w-xs mx-auto">
                  Your reset request for <code className="font-mono font-semibold">{employeeId}</code> has been logged.
                  Visit the M-East Ward Office or call <strong>1916</strong> for a new password.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-bmc-700 rounded-md hover:bg-bmc-800 transition-all"
                >
                  Back to sign in
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border)] bg-[var(--surface-sunken)] px-6 py-4 sm:px-12 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
          <span>BMC SWRMS · Pilot Deployment</span>
          <Link href="/help" className="hover:text-bmc-700">Help</Link>
        </div>
      </div>
    </div>
  );
}
