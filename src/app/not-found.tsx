import Link from 'next/link';
import BMCSeal from '@/components/brand/BMCSeal';
import { EmptyStateIllustration } from '@/components/brand/Illustrations';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)]">
      {/* Top strip */}
      <div className="bg-bmc-950 text-white text-[11px] py-1.5 px-4">
        <div className="max-w-7xl mx-auto">
          <span className="text-white/70">Government of Maharashtra · BMC</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md animate-fade-in">
          <Link href="/" className="inline-block mb-8">
            <BMCSeal size={64} variant="full" />
          </Link>

          <div className="w-40 h-40 mx-auto mb-6 opacity-80">
            <EmptyStateIllustration className="w-full h-full" />
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-gold-700 font-bold mb-2">
            Error 404 · Page not found
          </p>
          <h1 className="font-display text-3xl font-bold text-[var(--neutral-900)]">
            We couldn&apos;t find that page
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
            The page you&apos;re looking for may have been moved, removed, or you may have
            mistyped the address.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-bmc-700 text-white rounded-md hover:bg-bmc-800 transition-colors shadow-doc"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Return home
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-bmc-700 border border-bmc-700 rounded-md hover:bg-bmc-50 transition-colors"
            >
              Get help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
