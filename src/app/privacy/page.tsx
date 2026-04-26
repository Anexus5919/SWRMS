import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
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
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">Privacy Policy</h1>
            <p className="text-sm text-white/70 mt-3">Effective date: April 2026 · Pilot Deployment</p>
          </div>
        </div>
      </section>

      {/* Body uses the same outer width as the hero so the white card's
          left edge aligns under the header logo AND its right edge
          extends to the same right margin. Justified paragraphs fill
          the column flush on both sides. */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <article className="bg-white border border-[var(--border)] rounded-xl shadow-doc p-8 sm:p-10 space-y-6 text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">1. Scope</h2>
            <p className="text-justify">
              This Privacy Policy applies to the Smart Workforce &amp; Route Management System (SWRMS),
              a pilot deployment operated by the Brihanmumbai Municipal Corporation (BMC) Solid Waste
              Management Department for Chembur (M-East) Ward. It covers all personal information
              processed by the system in connection with daily field operations - attendance, route
              tracking, photo verification, and the audit logs generated alongside them. The policy
              applies to every authorised user of SWRMS regardless of role (sanitation staff, ward
              supervisor, or BMC administrator) and remains in effect for as long as you hold an
              active account.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">2. Data we collect</h2>
            <ul className="space-y-2 list-disc list-inside marker:text-gold-600">
              <li><strong>Identity:</strong> Employee ID, name, role, ward assignment, contact phone.</li>
              <li><strong>Authentication:</strong> Password (stored as bcrypt hash, never in plain text).</li>
              <li><strong>Biometric (face embedding):</strong> 128-dimensional numeric vector derived from your enrollment photo, used for identity verification at field photo submissions.</li>
              <li><strong>Location at check-in:</strong> GPS coordinates captured at the moment of attendance check-in and at each photo submission.</li>
              <li>
                <strong>Live tracking during shift (opt-in):</strong> If you press <em>Start Shift Tracking</em> on your home screen,
                your device sends GPS samples every ~30 seconds while you are on the route. Tracking automatically stops
                when you press <em>Stop Tracking</em>, when you mark your route 100% complete, or when your shift end time passes.
                A pulsing green indicator and the words &ldquo;Tracking: ON&rdquo; are shown the entire time pings are flowing.
                Tracking is not silent and is never enabled without your explicit action.
              </li>
              <li><strong>Device metadata:</strong> User agent, platform string, and (on Android) the operating system&apos;s mock-location flag, for audit purposes.</li>
              <li><strong>Operational records:</strong> Attendance logs, route progress updates, geotagged photos, GPS pings during opted-in tracking.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">3. How we use it</h2>
            <p className="text-justify">
              All data is used solely for verifying field staff presence at assigned routes, monitoring
              waste collection completion, detecting route deviations and idle periods during shift, and
              supporting workforce reallocation decisions by authorized supervisors. Data is not sold,
              rented, or shared with any third-party advertiser, recruiter, or analytics provider; the
              only external party that ever touches operational data is the OpenStreetMap routing
              service (OSRM), and only the route start/end coordinates of newly created routes are sent
              there for road-snapping - never personal information.
            </p>
            <p className="mt-3 text-justify">
              GPS pings collected during live tracking are used in two ways: first, to power the
              supervisor&apos;s real-time map showing which workers are on or off route; and second, to
              run automatic deviation and idle detection. Alerts generated by these checks are reviewed
              by your supervisor and recorded in the verification log. The system applies a 15-minute
              cooldown per (worker, alert kind) pair so that a single off-route episode produces one
              entry and not a flood of duplicates.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">4. Who can access your data</h2>
            <ul className="space-y-2 list-disc list-inside marker:text-gold-600">
              <li>You (your own attendance, photos, and route data via your account).</li>
              <li>Your assigned supervisor (your attendance, photos, and verification flags for your route).</li>
              <li>BMC SWM administrators (aggregate data and verification logs across all wards in pilot scope).</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">5. Data retention</h2>
            <p>
              Operational data (attendance, photos, logs) is retained for 365 days for audit purposes,
              after which it is archived or deleted per BMC records policy. Face embeddings are retained
              for the duration of your active employment in SWRMS.
            </p>
            <p className="mt-3">
              GPS pings from live tracking are retained for 90 days for incident investigation and
              GPS-replay reviews, then deleted. Aggregated anonymous statistics (e.g. average shift
              completion percentage per ward) may be retained indefinitely.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">6. Security</h2>
            <p className="text-justify">
              Passwords are hashed using bcrypt before storage and are never written to disk in plain
              text. Authenticated sessions use signed JSON Web Tokens with a 24-hour expiry, after
              which re-login is required. Every API endpoint is protected by role-based access control,
              so a staff account cannot read another worker&apos;s data and a supervisor account cannot
              modify administrator-only configuration. The application database runs on encrypted
              MongoDB Atlas infrastructure with TLS in transit and at-rest disk encryption provided
              by the platform.
            </p>
            <p className="mt-3 text-justify">
              In addition to the access controls above, every supervisor or administrator action that
              modifies stored data - user creation, route edits, reallocation approvals, log
              resolutions - is recorded to a tamper-evident audit log capturing the actor&apos;s identity,
              role, IP address, browser user-agent, and a before-and-after diff of any changed fields.
              Records are never hard-deleted; user accounts and routes are deactivated via a status
              flag so the historical trail remains queryable for any future review.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">7. Your rights</h2>
            <p className="text-justify">
              Under applicable Indian data protection regulations, including the Digital Personal Data
              Protection Act 2023, you have the right to access, correct, or request deletion of your
              personal data held by SWRMS, and to receive a clear explanation of how that data has
              been used. Requests are routed through the BMC SWM Department and are typically
              acknowledged within five working days. To exercise any of these rights - or to register
              a privacy concern - contact the M-East Ward SWM Office using the address below or the
              BMC Citizen Helpdesk on 1916.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-bmc-700 mb-3">8. Contact</h2>
            <address className="not-italic">
              Data Protection Officer<br />
              M-East Ward Office, BMC SWM Department<br />
              19B, 20A, Rd No. 1, Chembur Gaothan, Mumbai 400 071<br />
              Helpdesk: 1916
            </address>
          </div>
        </article>
      </section>

      <PublicFooter />
    </div>
  );
}
