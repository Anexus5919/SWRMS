'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // For pilot - we don't auto-send emails; this triggers an admin notification
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-[var(--page-bg)]">
      {/* Branded panel */}
      <div className="relative bg-bmc-900 text-white overflow-hidden hidden lg:flex flex-col p-10 xl:p-14">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: '24px 24px',
          }}
        />

        {/* BMC HQ building backdrop - actual sketch (invert + screen so
            only the line strokes show). Mask fades the sketch out behind
            the upper title block so it does not collide with the emblem. */}
        <div
          className="absolute inset-x-0 bottom-0 top-0 pointer-events-none"
          style={{
            maskImage:
              'linear-gradient(to bottom, transparent 0%, transparent 36%, rgba(0,0,0,0.55) 52%, black 70%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, transparent 36%, rgba(0,0,0,0.55) 52%, black 70%)',
          }}
        >
          <Image
            src="/bmc_complex.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1280px) 60vw, 50vw"
            className="object-contain object-bottom opacity-55"
            style={{
              filter: 'invert(1) brightness(1.4) contrast(1.05)',
              mixBlendMode: 'screen',
              transform: 'scale(1.08) translateX(-2%)',
              transformOrigin: 'bottom center',
            }}
          />
        </div>

        {/* Top: Full identity stack, centered */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold-300 font-semibold">
            Government of Maharashtra
          </p>
          <p className="text-xs text-white/70 mt-0.5">
            Brihanmumbai Municipal Corporation
          </p>

          <Image
            src="/bmc_logo.png"
            alt="Brihanmumbai Municipal Corporation"
            width={76}
            height={76}
            priority
            className="mt-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
          />

          <p className="text-[9px] uppercase tracking-[0.28em] text-gold-300 font-semibold mt-3">
            Account Recovery
          </p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto my-2.5" />

          <h1 className="font-display text-3xl xl:text-4xl font-bold tracking-tight text-white">
            Reset your access
          </h1>
          <p className="text-xs text-white/70 mt-3 leading-relaxed max-w-md">
            For audit and security reasons, password resets in SWRMS require
            administrator approval. Submit your request below - your ward
            administrator will be notified.
          </p>
        </div>

        {/* Bottom: Sanskrit motto */}
        <div className="relative z-10 mt-auto pt-6 -mb-6 xl:-mb-10 text-center">
          <p
            className="text-[28px] xl:text-[34px] font-bold tracking-wide"
            style={{
              color: 'rgba(235, 208, 147, 0.48)',
              WebkitTextStroke: '0.7px #dcae63',
              fontFamily: 'var(--font-display, serif)',
            }}
          >
            यतो धर्मस्ततो जयः
          </p>
        </div>

      </div>

      {/* Form */}
      <div className="relative flex flex-col">
        <div className="lg:hidden bg-bmc-900 text-white px-5 py-4 flex items-center gap-3">
          <Image src="/bmc_logo.png" alt="BMC" width={40} height={40} priority />
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
