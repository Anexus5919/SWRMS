import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import { BMCHeritageBuilding } from '@/components/brand/Illustrations';

export const metadata: Metadata = { title: 'Terms of Use' };

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)]">
      <PublicHeader />

      <section className="relative bg-bmc-900 text-white py-12 sm:py-16 overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-2/3 max-w-2xl pointer-events-none text-bmc-600 opacity-25">
          <BMCHeritageBuilding className="w-full h-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-bmc-900 via-bmc-900/80 to-transparent pointer-events-none" />

        {/* max-w-7xl matches PublicHeader so heading aligns left with logo. */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300 mb-3">Legal</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">Terms of Use</h1>
            <p className="text-sm text-white/70 mt-3">Effective date: April 2026 · Authorized BMC personnel only</p>
          </div>
        </div>
      </section>

      {/* Body uses the same outer width as hero; card capped for reading. */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <article className="max-w-4xl bg-white border border-[var(--border)] rounded-xl shadow-doc p-8 sm:p-10 space-y-6 text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
          <div className="bg-status-amber-light border-l-4 border-status-amber p-4 rounded-r">
            <p className="font-display text-sm font-bold text-status-amber-dark mb-1">Authorized Personnel Only</p>
            <p className="text-xs text-status-amber-dark/80">
              This system is restricted to BMC SWM staff. Unauthorized access, attempted access,
              or misuse is a punishable offense under the Information Technology Act, 2000.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">1. Acceptance of terms</h2>
            <p>
              By signing in to SWRMS, you acknowledge that you are an authorized employee of the
              Brihanmumbai Municipal Corporation (BMC) and agree to use this system solely for
              official Solid Waste Management duties.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">2. Permitted use</h2>
            <p>SWRMS is to be used only for:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside marker:text-gold-600">
              <li>Marking your attendance at your assigned route start point.</li>
              <li>Submitting required field photos at shift start, checkpoint, and shift end.</li>
              <li>Updating route completion progress (staff role).</li>
              <li>Reviewing routes, attendance, and verification logs (supervisor/admin role).</li>
              <li>Managing staff and route assignments (admin role).</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">3. Prohibited conduct</h2>
            <ul className="space-y-1 list-disc list-inside marker:text-gold-600">
              <li>Sharing your account credentials with any other person.</li>
              <li>Submitting falsified GPS data, photos, or attendance records.</li>
              <li>Attempting to bypass face verification (e.g., using another worker&apos;s photo).</li>
              <li>Accessing or attempting to access data belonging to wards or staff outside your assigned scope.</li>
              <li>Reverse engineering, scraping, or extracting bulk data from the system.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">4. Account security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your password and for all
              activities under your account. Notify your ward administrator immediately if you suspect
              unauthorized access.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">5. Disciplinary action</h2>
            <p>
              Violation of these terms may result in disciplinary action under BMC employment rules,
              including but not limited to suspension, termination, and referral for criminal prosecution
              under the IT Act 2000 and the Indian Penal Code.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">6. Audit &amp; monitoring</h2>
            <p>
              All actions in SWRMS - attendance check-ins, photo submissions, log resolutions,
              reallocations, and administrative changes - are logged and auditable.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">7. Pilot disclaimer</h2>
            <p>
              SWRMS is a pilot deployment. The system is provided on an &quot;as-is&quot; basis during
              the pilot phase. Operational outages, data loss during planned maintenance, and feature
              changes may occur with prior notice via the supervisor channel.
            </p>
          </div>
        </article>
      </section>

      <PublicFooter />
    </div>
  );
}
