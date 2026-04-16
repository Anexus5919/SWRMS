import BMCHeader from '@/components/layout/BMCHeader';
import DesktopNav from '@/components/layout/DesktopNav';

const adminNav = [
  { href: '/staff', label: 'Staff Management' },
  { href: '/routes', label: 'Route Management' },
  { href: '/reports', label: 'Reports' },
  { href: '/logs', label: 'Verification Logs' },
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
        <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
