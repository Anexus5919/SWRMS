import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';

export const metadata: Metadata = { title: 'Help & Support' };

const FAQS = [
  {
    q: 'How do I get an SWRMS account?',
    a: 'Accounts are created by ward administrators. Contact your supervisor or the M-East Ward Office (helpdesk 1916) with your BMC employee ID. Self-registration is not permitted as this is an authorized-personnel system.',
  },
  {
    q: 'I can\'t mark my attendance - it says I\'m too far from my route.',
    a: 'The system requires you to be within 200 metres of your assigned route start point. Verify (1) you are at the correct location, (2) GPS is enabled on your device with high accuracy, (3) you are not inside a building that may block GPS signal. The system takes 3 GPS readings and uses the median - try moving to an open area and waiting 10 seconds.',
  },
  {
    q: 'My face was not recognized in a photo. What do I do?',
    a: 'Low-confidence face matches are automatically flagged for supervisor review. The supervisor will compare your field photo against your registered profile photo and approve or reject manually. Common causes: poor lighting, helmet/mask covering the face, motion blur. Try retaking the photo facing direct light with your face clearly visible.',
  },
  {
    q: 'I forgot my password.',
    a: 'Use the "Forgot?" link on the sign-in page, or contact your ward administrator. For pilot deployment, password resets are handled manually by the admin to maintain audit trail.',
  },
  {
    q: 'I marked attendance but the supervisor says I have a missing photo alert.',
    a: 'After marking attendance, you must also submit a Shift Start photo at the route location. If 30+ minutes pass without a photo, the system creates a "missing photo" verification log for supervisor review. Open the SWRMS app, go to Photo Check, and submit a Shift Start photo immediately.',
  },
  {
    q: 'What happens if my phone has no internet on site?',
    a: 'Attendance is queued in the offline storage and will sync automatically when connectivity returns. You\'ll see a yellow indicator showing pending records. Photos require online connectivity to upload.',
  },
  {
    q: 'Who can see my location and photos?',
    a: 'Only your ward supervisor and the BMC SWM administrator can view your attendance records and submitted photos. GPS coordinates are recorded only at the moment of attendance check-in and during photo submission - there is no continuous location tracking.',
  },
];

export default function HelpPage() {
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

        {/* max-w-7xl matches PublicHeader so heading aligns with BMC logo
            above; inner column kept narrow for reading comfort. */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300 mb-3">Help &amp; support</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-white">
              We&apos;re here to help BMC field staff &amp; supervisors.
            </h1>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-[minmax(0,_56rem)_300px] gap-8">
        {/* FAQs */}
        <div>
          <h2 className="font-display text-xl font-bold text-bmc-700 mb-5">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="group bg-white border border-[var(--border)] rounded-lg shadow-doc overflow-hidden"
              >
                <summary className="cursor-pointer px-5 py-4 flex items-start justify-between gap-3 list-none">
                  <span className="font-display text-sm font-semibold text-[var(--neutral-900)] flex-1">{faq.q}</span>
                  <svg className="w-5 h-5 text-bmc-700 transition-transform group-open:rotate-180 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)] pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Sidebar contact */}
        <aside className="space-y-4">
          <div className="bg-bmc-900 text-white rounded-xl p-5 shadow-doc">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300 mb-2">Helpdesk</p>
            <p className="font-display text-2xl font-bold">1916</p>
            <p className="text-xs text-white/70 mt-1">BMC Citizen Helpline</p>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-doc">
            <h3 className="font-display text-sm font-bold text-bmc-700 mb-3">M-East Ward Office</h3>
            <address className="not-italic text-xs text-[var(--text-secondary)] space-y-1.5 leading-relaxed">
              <p className="font-semibold text-[var(--text-primary)]">SWM Department</p>
              <p>19B, 20A, Rd No. 1<br />Chembur Gaothan<br />Chembur, Mumbai 400 071</p>
            </address>
          </div>

          <div className="bg-gold-50 border border-gold-200 rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-700 mb-2">For technical issues</p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Contact your ward IT coordinator or escalate via the supervisor dashboard.
            </p>
          </div>
        </aside>
      </section>

      <PublicFooter />
    </div>
  );
}
