'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

interface DesktopNavProps {
  items: NavItem[];
}

export default function DesktopNav({ items }: DesktopNavProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-bmc-800 border-b border-bmc-700/50 shadow-doc-sm">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 text-xs font-display font-semibold tracking-wide whitespace-nowrap transition-all relative ${
                  isActive
                    ? 'text-white bg-bmc-700'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
                {isActive && (
                  <>
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold-400 rounded-full" />
                    <span className="absolute top-0 left-0 right-0 h-px bg-gold-500/30" />
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
