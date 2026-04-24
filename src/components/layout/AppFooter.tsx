import Link from 'next/link';

/**
 * AppFooter — slim footer for inside-app pages (admin/supervisor/staff).
 * Different from PublicFooter (used on landing/about/etc).
 */
export default function AppFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface-sunken)] mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[var(--text-muted)]">
        <p>
          © {new Date().getFullYear()} Brihanmumbai Municipal Corporation · SWRMS Pilot
        </p>
        <div className="flex items-center gap-3">
          <Link href="/help" className="hover:text-bmc-700">Help</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-bmc-700">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-bmc-700">Terms</Link>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
            v0.1
          </span>
        </div>
      </div>
    </footer>
  );
}
