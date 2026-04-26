import BMCHeader from '@/components/layout/BMCHeader';
import DesktopNav from '@/components/layout/DesktopNav';
import AppFooter from '@/components/layout/AppFooter';
import PushToggle from '@/components/supervisor/PushToggle';
import NotificationBell from '@/components/supervisor/NotificationBell';
import PrintCornerStamp from '@/components/layout/PrintCornerStamp';

const adminNav = [
  { href: '/staff', label: 'Staff Management' },
  { href: '/routes', label: 'Route Management' },
  { href: '/reports', label: 'Reports' },
  { href: '/admin-logs', label: 'Verification Logs' },
  { href: '/audit', label: 'Audit Log' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Etched BMC seal stamp on every printed page (admin reports + audit). */}
      <PrintCornerStamp />
      <BMCHeader />
      <DesktopNav items={adminNav} />
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-end gap-3">
          <NotificationBell />
          <PushToggle />
        </div>
      </div>
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}
