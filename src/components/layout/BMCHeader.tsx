'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import BMCSeal from '@/components/brand/BMCSeal';

export default function BMCHeader() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const roleBadge = {
    admin: { label: 'Administrator', color: 'bg-gold-500 text-bmc-950' },
    supervisor: { label: 'Supervisor', color: 'bg-status-blue text-white' },
    staff: { label: 'Field Staff', color: 'bg-status-green text-white' },
  }[session?.user?.role ?? 'staff'];

  return (
    <>
      {/* Top government strip */}
      <div className="bg-bmc-950 text-white text-[11px]">
        <div className="max-w-[1400px] mx-auto px-4 py-1.5 flex items-center justify-between">
          <span className="text-white/70 hidden sm:block">
            Government of Maharashtra · Brihanmumbai Municipal Corporation
          </span>
          <span className="text-white/70 sm:hidden">Government of Maharashtra</span>
          <div className="flex items-center gap-3">
            <span className="text-white/60 hidden md:inline">{today}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
              <span className="text-white/80">Live</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-bmc-900 text-white shadow-doc">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <BMCSeal size={44} variant="full" />
            <div className="leading-tight hidden sm:block">
              <p className="text-[9px] uppercase tracking-[0.18em] text-gold-300 font-semibold">
                BMC · Solid Waste Management
              </p>
              <p className="font-display text-sm font-bold mt-0.5 group-hover:text-gold-300 transition-colors">
                SWRMS
                <span className="font-normal text-white/60 hidden md:inline"> · Chembur Ward</span>
              </p>
            </div>
            <div className="leading-tight sm:hidden">
              <p className="font-display text-sm font-bold">SWRMS</p>
              <p className="text-[9px] text-white/60">BMC · SWM</p>
            </div>
          </Link>

          {/* User */}
          {session?.user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 transition-colors"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-bmc-950 font-bold text-xs flex items-center justify-center shadow-inset">
                  {session.user.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="text-right hidden sm:block leading-tight">
                  <p className="text-xs font-semibold">{session.user.name}</p>
                  <p className="text-[10px] text-white/60 font-mono">{session.user.employeeId}</p>
                </div>
                <svg className={`w-4 h-4 text-white/60 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  {/* Click-outside overlay. Lifted above Leaflet's tooltip
                      pane (z-700) so the menu renders correctly when a map
                      is the next sibling on the page. */}
                  <div
                    className="fixed inset-0 z-[1000]"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-doc-xl border border-[var(--border)] z-[1001] overflow-hidden animate-fade-in">
                    {/* User header */}
                    <div className="bg-bmc-900 text-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-bmc-950 font-bold text-sm flex items-center justify-center">
                          {session.user.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div className="leading-tight min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{session.user.name}</p>
                          <p className="text-[10px] text-white/60 font-mono">{session.user.employeeId}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="p-2 text-sm">
                      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                        Account
                      </div>
                      <Link
                        href="/help"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-[var(--neutral-50)] text-[var(--text-secondary)]"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                        Help &amp; Support
                      </Link>
                      <div className="border-t border-[var(--border)] my-2" />
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md hover:bg-status-red-light text-status-red font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="divider-gold" />
      </header>
    </>
  );
}
