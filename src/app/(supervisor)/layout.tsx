import BMCHeader from '@/components/layout/BMCHeader';
import DesktopNav from '@/components/layout/DesktopNav';
import AppFooter from '@/components/layout/AppFooter';

const supervisorNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/reallocation', label: 'Reallocation' },
  { href: '/attendance-log', label: 'Attendance Log' },
  { href: '/supervisor-logs', label: 'Verification Logs' },
];

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <BMCHeader />
      <DesktopNav items={supervisorNav} />
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}
