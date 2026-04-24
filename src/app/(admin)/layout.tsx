import BMCHeader from '@/components/layout/BMCHeader';
import DesktopNav from '@/components/layout/DesktopNav';
import AppFooter from '@/components/layout/AppFooter';

const adminNav = [
  { href: '/staff', label: 'Staff Management' },
  { href: '/routes', label: 'Route Management' },
  { href: '/reports', label: 'Reports' },
  { href: '/admin-logs', label: 'Verification Logs' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <BMCHeader />
      <DesktopNav items={adminNav} />
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}
