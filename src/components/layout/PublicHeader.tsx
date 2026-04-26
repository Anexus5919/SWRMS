'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BMCSeal from '@/components/brand/BMCSeal';

/**
 * PublicHeader - used on About, Help, Privacy, Terms (the four pages
 * that are reachable without a session, but also navigable while signed
 * in).
 *
 * Behaviour:
 *   - If the visitor is NOT signed in, the top-right shows "Home · Sign In →"
 *     (the original public path).
 *   - If the visitor IS signed in, the Sign-In CTA is replaced with their
 *     name and a "Go to Dashboard" link that routes to the role-appropriate
 *     landing page. We never want a logged-in user staring at a "Sign In"
 *     button - that's confusing UX.
 *   - The active page (about / help / privacy / terms) is highlighted in
 *     gold with an underline so users see where they are.
 *   - The whole header is `sticky top-0` so the nav stays visible while
 *     scrolling long pages like the privacy policy.
 */

const navItems: { href: string; label: string }[] = [
  { href: '/about', label: 'About' },
  { href: '/help', label: 'Help' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

function dashboardUrlFor(role: string | undefined): string {
  if (role === 'admin') return '/staff';
  if (role === 'supervisor') return '/dashboard';
  if (role === 'staff') return '/home';
  return '/';
}

export default function PublicHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isActive = (href: string): boolean => pathname === href || pathname.startsWith(href + '/');

  const authed = !!session?.user;
  const dashboardUrl = dashboardUrlFor(session?.user?.role);
  const displayName = session?.user?.name ?? '';

  return (
    <div className="sticky top-0 z-40">
      <div className="bg-bmc-950 text-white text-[11px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between">
          <span className="text-white/70">
            Government of Maharashtra · Brihanmumbai Municipal Corporation
          </span>
          <div className="flex items-center gap-4">
            {authed ? (
              <>
                <span className="text-white/60 hidden sm:inline">
                  Signed in as <span className="text-white/85 font-medium">{displayName}</span>
                </span>
                <span className="text-white/30 hidden sm:inline">·</span>
                <Link
                  href={dashboardUrl}
                  className="text-gold-300 font-semibold hover:text-gold-200"
                >
                  Go to Dashboard →
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="text-white/70 hover:text-gold-300">Home</Link>
                <span className="text-white/30">·</span>
                <Link href="/login" className="text-gold-300 font-semibold hover:text-gold-200">
                  Sign In →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <header className="bg-bmc-900 text-white shadow-doc">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <BMCSeal size={44} variant="full" />
            <div className="leading-tight">
              <p className="text-[9px] uppercase tracking-[0.18em] text-gold-300 font-semibold">
                BMC · SWM
              </p>
              <p className="font-display text-sm font-bold group-hover:text-gold-300 transition-colors">
                SWRMS
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'text-gold-300 font-semibold border-b-2 border-gold-400 pb-0.5 transition-colors'
                      : 'text-white/80 hover:text-gold-300 transition-colors'
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="divider-gold" />
      </header>
    </div>
  );
}
