import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth/config';
import BMCSeal from '@/components/brand/BMCSeal';
import {
  MumbaiSkyline,
  WasteCollectionTruck,
  SanitationWorker,
  RoutePin,
  GeofenceMap,
  BMCHeritageBuilding,
} from '@/components/brand/Illustrations';
import PublicFooter from '@/components/layout/PublicFooter';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If logged in, route to role-appropriate dashboard
  if (session) {
    switch (session.user.role) {
      case 'admin':
        redirect('/staff');
      case 'supervisor':
        redirect('/dashboard');
      case 'staff':
        redirect('/home');
    }
  }

  // ── Public landing page for unauthenticated visitors ──
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)]">
      {/* ─── Top bar ────────────────────────────────────────── */}
      <div className="bg-bmc-950 text-white text-[11px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between">
          <span className="text-white/70">
            Government of Maharashtra · Brihanmumbai Municipal Corporation
          </span>
          <div className="flex items-center gap-4">
            <Link href="/help" className="text-white/70 hover:text-gold-300">Help</Link>
            <span className="text-white/30">·</span>
            <Link href="/login" className="text-gold-300 font-semibold hover:text-gold-200">
              Sign In →
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="bg-bmc-900 text-white shadow-doc-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BMCSeal size={52} variant="full" />
            <div className="leading-tight">
              <p className="text-[9px] uppercase tracking-[0.18em] text-gold-300 font-semibold">
                Solid Waste Management Department
              </p>
              <p className="font-display text-base font-bold mt-0.5">
                SWRMS · Smart Workforce &amp; Route Management
              </p>
              <p className="text-[10px] text-white/50">Chembur Ward · Pilot Deployment</p>
            </div>
          </div>

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-bmc-950 rounded-md hover:bg-gold-400 transition-colors shadow-doc"
          >
            Sign In
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
        <div className="divider-gold" />
      </header>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="relative bg-bmc-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M20 0L40 20 20 40 0 20Z' fill='none' stroke='white' stroke-width='0.5'/></svg>\")",
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] rounded-full opacity-10" style={{
          background: 'radial-gradient(circle, var(--gold-500), transparent 70%)',
        }} />

        {/* BMC HQ heritage building watermark - extra layer of brand */}
        <div className="absolute left-0 right-0 bottom-0 h-[70%] flex items-end justify-center pointer-events-none text-bmc-700 opacity-[0.18]">
          <BMCHeritageBuilding className="w-full max-w-[1100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-300">
                UN SDG 11 · Sustainable Cities
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">
              Cleaner streets begin with{' '}
              <span className="text-gold-400">accountable workforce.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/75 leading-relaxed max-w-xl">
              SWRMS replaces paper attendance registers with geo-fenced check-ins,
              AI-verified field photos, and live route monitoring - ensuring every
              waste collection route operates with the right staff at the right time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-gold-500 text-bmc-950 rounded-md hover:bg-gold-400 transition-all shadow-doc-md hover:shadow-doc-lg active:scale-[0.98]"
              >
                Access Employee Portal
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-white/25 rounded-md hover:bg-white/10 transition-colors"
              >
                Learn how it works
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <p className="font-display text-2xl font-bold text-gold-400">200<span className="text-sm">m</span></p>
                <p className="text-[11px] text-white/60 uppercase tracking-wider mt-1">Geofence radius</p>
              </div>
              <div className="border-x border-white/10 px-4">
                <p className="font-display text-2xl font-bold text-gold-400">128<span className="text-sm">d</span></p>
                <p className="text-[11px] text-white/60 uppercase tracking-wider mt-1">Face vector</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-gold-400">&lt;500<span className="text-sm">ms</span></p>
                <p className="text-[11px] text-white/60 uppercase tracking-wider mt-1">API response</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 rounded-2xl overflow-hidden border border-white/10 shadow-doc-xl bg-white/5 backdrop-blur-sm">
                <GeofenceMap className="w-full h-full opacity-90" />
              </div>
              <div className="absolute -left-4 -bottom-6 bg-white rounded-xl shadow-doc-xl p-3 w-44 border border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-bmc-100 rounded-full overflow-hidden">
                    <SanitationWorker className="w-full h-full" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-mono font-semibold text-[var(--text-muted)]">BMC-CHB-007</p>
                    <p className="text-xs font-semibold text-[var(--neutral-900)]">Verified ✓</p>
                    <p className="text-[10px] text-status-green">Within geofence</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-2 -top-4 bg-white rounded-xl shadow-doc-xl p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <RoutePin className="w-8 h-10" />
                  <div className="leading-tight">
                    <p className="text-[10px] font-mono font-semibold text-[var(--text-muted)]">CHB-R03</p>
                    <p className="text-xs font-semibold text-[var(--neutral-900)]">Route 03</p>
                    <p className="text-[10px] text-status-amber">3 of 4 present</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative text-bmc-700">
          <MumbaiSkyline className="w-full h-32 sm:h-40 opacity-50" />
        </div>
      </section>

      {/* ─── Problem Strip ──────────────────────── */}
      <section className="bg-[var(--page-bg)] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-700 mb-3">
              The operational gap
            </p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--neutral-900)] leading-tight">
              Mumbai generates 9,000 tonnes of waste daily.
              <br />
              <span className="text-bmc-700">Coordination shouldn&apos;t be the bottleneck.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { stat: '15-30%', label: 'Daily absenteeism', detail: 'World Bank estimates of municipal waste workforce attendance variance - currently invisible to supervisors.', color: 'text-status-red' },
              { stat: '25-40 min', label: 'Per-worker time lost', detail: 'Daily travel + queue time at ward office for paper attendance - replaced by 15-second geo-verified check-in.', color: 'text-status-amber' },
              { stat: '0', label: 'Real-time visibility', detail: 'Existing systems offer no live route status, no missing-photo alerts, no automated reallocation.', color: 'text-bmc-700' },
            ].map((item) => (
              <div key={item.label} className="relative bg-white border border-[var(--border)] rounded-xl p-6 shadow-doc hover:shadow-doc-md transition-shadow">
                <div className="absolute top-0 left-6 right-6 divider-gold" />
                <p className={`font-display text-4xl font-bold ${item.color}`}>{item.stat}</p>
                <p className="font-display text-sm font-semibold text-[var(--neutral-800)] mt-2 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────── */}
      <section className="bg-bmc-50 border-y border-[var(--border)] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-700 mb-3">How SWRMS works</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--neutral-900)]">
              Five steps. Every shift. Every worker.
            </h2>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { num: '01', title: 'Face Registration', detail: 'One-time selfie enrollment generates a 128-d face embedding.' },
              { num: '02', title: 'Geo-fenced Check-in', detail: 'GPS verified within 200m of route start using Haversine formula.' },
              { num: '03', title: 'Shift Start Photo', detail: 'AI compares the field photo against the registered face.' },
              { num: '04', title: 'Route Tracking', detail: 'Live progress updates from staff, visible on supervisor dashboard.' },
              { num: '05', title: 'Smart Reallocation', detail: 'Surplus workers from completed routes redirected to understaffed ones.' },
            ].map((step, idx) => (
              <div key={step.num} className="relative">
                <div className="bg-white border border-[var(--border)] rounded-xl p-5 h-full shadow-doc">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-gold-600">{step.num}</span>
                    <span className="flex-1 h-px bg-[var(--border)]" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-[var(--neutral-900)] mb-2 leading-tight">{step.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{step.detail}</p>
                </div>
                {idx < 4 && (
                  <svg className="hidden md:block absolute top-1/2 -right-3 w-4 h-4 text-[var(--border-strong)] -translate-y-1/2 z-10" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Three roles ───────────────────────────── */}
      <section className="bg-[var(--page-bg)] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-700 mb-3">Built for every role</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--neutral-900)]">
              Three interfaces. One operational picture.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-doc hover:shadow-doc-md transition-shadow">
              <div className="bg-bmc-700 p-6 text-white relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300 mb-2">For field staff</p>
                  <h3 className="font-display text-xl font-bold text-white">Mobile-first PWA</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="w-20 h-32 mx-auto mb-4">
                  <SanitationWorker className="w-full h-full" />
                </div>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-status-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Daily checklist on home screen</li>
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-status-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Offline check-in queue</li>
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-status-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Single-tap photo capture</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border-2 border-gold-400 rounded-xl overflow-hidden shadow-doc-md hover:shadow-doc-lg transition-shadow relative">
              <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider bg-gold-500 text-bmc-950 px-2 py-0.5 rounded">Live</span>
              <div className="bg-bmc-800 p-6 text-white relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-gold-500/10" />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300 mb-2">For supervisors</p>
                  <h3 className="font-display text-xl font-bold text-white">Live Dashboard</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="w-full h-32 mb-4 rounded-md overflow-hidden border border-[var(--border)]">
                  <GeofenceMap className="w-full h-full" />
                </div>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-status-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Real-time staffing ratios</li>
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-status-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Verification photo review</li>
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-status-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>One-click reallocation</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-doc hover:shadow-doc-md transition-shadow">
              <div className="bg-bmc-700 p-6 text-white relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300 mb-2">For administrators</p>
                  <h3 className="font-display text-xl font-bold text-white">Reports &amp; Audit</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="w-full h-32 mb-4 flex items-center justify-center">
                  <WasteCollectionTruck className="w-full max-w-[200px]" />
                </div>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-status-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Staff &amp; route management</li>
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-status-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Attendance trend analytics</li>
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-status-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>All-ward verification logs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SDG 11 callout ─────────────────────── */}
      <section className="bg-bmc-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M30 0L60 30 30 60 0 30Z' fill='none' stroke='white' stroke-width='1'/></svg>\")",
          backgroundSize: '60px 60px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300 mb-2">
                Aligned with UN Sustainable Development Goal 11
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                Sustainable Cities &amp; Communities · Target 11.6
              </h3>
              <p className="text-sm text-white/70 mt-2 max-w-3xl leading-relaxed">
                &quot;Reduce the adverse per capita environmental impact of cities, including by paying special attention to municipal and other waste management.&quot;
              </p>
            </div>
            {/* Official UN SDG 11 mark — served from /public/sdg_logo.png.
                Square aspect ratio is preserved so the orange/yellow square
                + skyline-and-arrow icon proportions remain correct at every
                screen width. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sdg_logo.png"
              alt="UN Sustainable Development Goal 11 — Sustainable Cities and Communities"
              width={120}
              height={120}
              className="flex-shrink-0 shadow-doc-lg rounded-md"
              style={{ width: 120, height: 120, objectFit: 'contain' }}
            />
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
