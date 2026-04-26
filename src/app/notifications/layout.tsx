import BMCHeader from '@/components/layout/BMCHeader';
import AppFooter from '@/components/layout/AppFooter';

/**
 * Shared layout for the notifications inbox. Used by both supervisors
 * and admins (proxy.ts gates the route to those two roles). Kept
 * deliberately minimal — no role-specific nav strip, since this page
 * is reached from a bell icon that already lives in each role's main
 * layout. The breadcrumb on the page itself plus the BMC header give
 * users a clear way back.
 */
export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <BMCHeader />
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}
