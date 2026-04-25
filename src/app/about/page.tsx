import Link from 'next/link';
import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import { GeofenceMap, BMCHeritageBuilding } from '@/components/brand/Illustrations';

export const metadata: Metadata = {
  title: 'About SWRMS',
  description:
    'About the Smart Workforce & Route Management System - a BMC Solid Waste Management pilot for Chembur Ward.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--page-bg)]">
      <PublicHeader />

      {/* Page header */}
      <section className="relative bg-bmc-900 text-white py-12 sm:py-16 overflow-hidden">
        {/* BMC HQ heritage building watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-2/3 max-w-2xl pointer-events-none text-bmc-600 opacity-25">
          <BMCHeritageBuilding className="w-full h-full" />
        </div>
        {/* Fade gradient over building so left text remains readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-bmc-900 via-bmc-900/80 to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300 mb-3">
            About the program
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-white">
            A purpose-built system for accountable municipal waste collection.
          </h1>
          <p className="text-base text-white/75 mt-4 max-w-2xl leading-relaxed">
            SWRMS is the operational layer between paper attendance and missed collections.
            It was designed in response to direct observation of BMC Chembur ward operations.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 w-full">
        <article className="prose-content space-y-8">
          {/* Origin */}
          <div>
            <h2 className="font-display text-xl font-bold text-bmc-700 mb-3">Origin of the Project</h2>
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
              The Brihanmumbai Municipal Corporation (BMC) manages waste collection for over 20 million
              residents through a network of routes serviced by dedicated vehicles and crews. Through
              field visits to BMC ward offices in Chembur and direct interactions with Solid Waste
              Management (SWM) supervisors and sanitation workers, three operational pain points emerged
              repeatedly:
            </p>
            <ul className="mt-4 space-y-2 text-[15px] text-[var(--text-secondary)]">
              <li className="flex gap-3"><span className="text-gold-600 font-bold">·</span><span>Attendance fraud - workers signing the register at the ward office without reporting to their assigned routes.</span></li>
              <li className="flex gap-3"><span className="text-gold-600 font-bold">·</span><span>Late detection of route failures - supervisors had no way to detect understaffing until collections were already missed.</span></li>
              <li className="flex gap-3"><span className="text-gold-600 font-bold">·</span><span>Idle workers on completed shorter routes while adjacent longer routes remained understaffed.</span></li>
            </ul>
          </div>

          {/* Solution */}
          <div>
            <h2 className="font-display text-xl font-bold text-bmc-700 mb-3">The Solution Architecture</h2>
            <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-doc grid sm:grid-cols-[1fr_240px] gap-6 items-center">
              <div>
                <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                  Geo-fenced attendance verification ensures workers can only mark attendance when
                  physically within 200m of their assigned route start point. AI-verified field photos
                  use 128-dimensional face embeddings to confirm worker identity. Real-time route
                  progress tracking and automated reallocation suggestions complete the loop.
                </p>
              </div>
              <GeofenceMap className="w-full" />
            </div>
          </div>

          {/* SDG */}
          <div className="bg-bmc-50 border border-bmc-200 rounded-xl p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-700 mb-2">
              UN Sustainable Development Goal 11
            </p>
            <h3 className="font-display text-lg font-bold text-bmc-900">
              Sustainable Cities &amp; Communities - Target 11.6
            </h3>
            <p className="text-[14px] text-[var(--text-secondary)] mt-2 leading-relaxed">
              SWRMS contributes to Target 11.6 by improving accountability and route completion
              rates in municipal solid waste collection - directly addressing the per-capita
              environmental impact of waste accumulation in densely populated urban areas.
            </p>
          </div>

          {/* Acknowledgments */}
          <div>
            <h2 className="font-display text-xl font-bold text-bmc-700 mb-3">Acknowledgments</h2>
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
              This pilot was developed by the Department of Information Technology at Vivekanand
              Education Society&apos;s Institute of Technology (V.E.S.I.T) under the guidance of
              Prof. Archana Kshirsagar, with field access generously provided by BMC officials
              and Solid Waste Management staff at the Chembur Ward Office.
            </p>
          </div>
        </article>

        {/* CTA */}
        <div className="mt-12 bg-bmc-900 text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-doc-lg">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300 mb-1">
              Authorized BMC personnel
            </p>
            <p className="font-display text-lg font-bold">Sign in to the SWRMS portal</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gold-500 text-bmc-950 rounded-md hover:bg-gold-400 transition-colors"
          >
            Sign In
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
