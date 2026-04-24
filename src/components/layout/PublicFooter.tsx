import Link from 'next/link';
import BMCSeal from '@/components/brand/BMCSeal';

/**
 * PublicFooter — government-grade footer with BMC contact info,
 * legal links, and program credits. Used across public pages.
 */
export default function PublicFooter() {
  return (
    <footer className="bg-bmc-950 text-white">
      {/* Top gold accent strip */}
      <div className="divider-gold" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8">
          {/* Brand column */}
          <div>
            <div className="flex items-start gap-3">
              <BMCSeal size={56} variant="full" />
              <div className="leading-tight">
                <p className="text-[9px] uppercase tracking-[0.18em] text-gold-300 font-semibold">
                  Government of Maharashtra
                </p>
                <p className="font-display text-base font-bold mt-0.5">
                  Brihanmumbai Municipal Corporation
                </p>
                <p className="text-[11px] text-white/60 mt-1">
                  Solid Waste Management Department
                </p>
              </div>
            </div>
            <p className="text-xs text-white/60 mt-4 leading-relaxed max-w-sm">
              SWRMS is a pilot deployment of the Smart Workforce &amp; Route Management
              System for Chembur Ward, developed in academic partnership with V.E.S.I.T.
            </p>
          </div>

          {/* System */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300 mb-3">
              The System
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li><Link href="/about" className="hover:text-white">About SWRMS</Link></li>
              <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
              <li><Link href="/help" className="hover:text-white">Help &amp; Support</Link></li>
              <li><a href="https://github.com/Anexus5919/SWRMS" target="_blank" rel="noopener noreferrer" className="hover:text-white">Source Code (Pilot)</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300 mb-3">
              Legal
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Use</Link></li>
              <li><a href="https://portal.mcgm.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white">BMC Portal ↗</a></li>
              <li><a href="https://www.mygov.in/rti/" target="_blank" rel="noopener noreferrer" className="hover:text-white">RTI ↗</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300 mb-3">
              Ward Office
            </h4>
            <address className="not-italic text-xs text-white/70 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-white/90">M-East Ward Office</p>
              <p>19B, 20A, Rd No. 1<br />Chembur Gaothan, Chembur<br />Mumbai 400 071</p>
              <p className="pt-2 text-white/60">Helpdesk: 1916</p>
            </address>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[11px] text-white/50">
            © {new Date().getFullYear()} Brihanmumbai Municipal Corporation. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[10px] text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
              System operational
            </span>
            <span>·</span>
            <span>v0.1 Pilot</span>
            <span>·</span>
            <span>SDG 11</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
