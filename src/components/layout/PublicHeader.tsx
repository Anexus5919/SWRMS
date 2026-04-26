'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BMCSeal from '@/components/brand/BMCSeal';

/**
 * PublicHeader - used on About, Help, Privacy, Terms.
 * Slimmer than the landing-page header.
 *
 * The nav links highlight in BMC gold when the user is on that page,
 * giving a clear "you are here" signal that matches the rest of the
 * portal's brand palette.
 */

const navItems: { href: string; label: string }[] = [
  { href: '/about', label: 'About' },
  { href: '/help', label: 'Help' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const isActive = (href: string): boolean => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <div className="bg-bmc-950 text-white text-[11px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between">
          <span className="text-white/70">
            Government of Maharashtra · Brihanmumbai Municipal Corporation
          </span>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/70 hover:text-gold-300">Home</Link>
            <span className="text-white/30">·</span>
            <Link href="/login" className="text-gold-300 font-semibold hover:text-gold-200">
              Sign In →
            </Link>
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
    </>
  );
}
