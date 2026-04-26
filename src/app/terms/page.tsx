import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';

export const metadata: Metadata = { title: 'Terms of Use' };

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)]">
      <PublicHeader />

      {/* min-h matches /about's natural rendered height so all four
          public heroes share the same dark-band size. */}
      <section className="relative bg-bmc-900 text-white py-12 sm:py-16 overflow-hidden min-h-[20rem]">
        {/* Etched BMC seal - fixed pixel size so all four public pages
            render an identically-sized watermark regardless of how tall
            their individual hero bands happen to be. */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[28rem] h-[28rem] pointer-events-none opacity-20 mix-blend-screen">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bmc_logo_sketch.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
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

      {/* Body matches hero outer width so the card extends fully right.
          Justified paragraphs flow flush on both sides for a consistent
          government-document feel. */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <article className="bg-white border border-[var(--border)] rounded-xl shadow-doc p-8 sm:p-10 space-y-6 text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
          <div className="bg-status-amber-light border-l-4 border-status-amber p-4 rounded-r">
            <p className="font-display text-sm font-bold text-status-amber-dark mb-1">Authorized Personnel Only</p>
            <p className="text-xs text-status-amber-dark/80">
              This system is restricted to BMC SWM staff. Unauthorized access, attempted access,
              or misuse is a punishable offense under the Information Technology Act, 2000.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">1. Acceptance of terms</h2>
            <p className="text-justify">
              By signing in to SWRMS, you acknowledge that you are an authorized employee of the
              Brihanmumbai Municipal Corporation (BMC) and agree to use this system solely for
              official Solid Waste Management duties. These terms apply for as long as your account
              remains active and continue to bind you with respect to data already submitted even
              after deactivation. If you do not accept these terms in full, you must not sign in to
              the system or attempt to access any of its endpoints.
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
            <p className="text-justify">
              You are responsible for maintaining the confidentiality of your password and for every
              action taken under your account. Treat your sign-in credentials as you would your
              official BMC identity card: do not write the password down where others can see it,
              do not share it with co-workers even briefly, and do not allow anyone else to operate
              the device while you are still signed in. Notify your ward administrator immediately
              if you suspect unauthorised access - earlier notification limits the scope of any
              audit-trail review that may follow.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">5. Disciplinary action</h2>
            <p className="text-justify">
              Violation of these terms may result in disciplinary action under BMC employment rules,
              including but not limited to suspension, termination, and referral for criminal
              prosecution under the Information Technology Act 2000 and the Indian Penal Code.
              Specific examples of conduct that the Department considers serious offences include
              the submission of fabricated GPS data or photographs, attempts to defeat face
              verification by presenting another person&apos;s image, and any unauthorised attempt to
              access verification logs or administrator screens.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">6. Audit &amp; monitoring</h2>
            <p className="text-justify">
              All actions in SWRMS - attendance check-ins, photo submissions, log resolutions,
              reallocations, and administrative changes - are logged and auditable. Each entry
              records the employee identifier of the actor, their role at the time of the action,
              the device IP address, the browser user-agent string, and where applicable a
              before-and-after diff of the modified record. Logs are retained for the duration
              required by BMC records policy and are made available to authorised auditors on
              request.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">7. Pilot disclaimer</h2>
            <p className="text-justify">
              SWRMS is a pilot deployment. The system is provided on an &quot;as-is&quot; basis during
              the pilot phase, with the understanding that operational outages, data loss during
              planned maintenance, and feature changes may occur. Material changes are announced
              with prior notice through the supervisor channel and are reflected in the audit log
              so the operational history of the system remains transparent to BMC reviewers.
            </p>
          </div>
        </article>
      </section>

      <PublicFooter />
    </div>
  );
}
