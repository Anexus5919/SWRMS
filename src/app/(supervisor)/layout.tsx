import BMCHeader from '@/components/layout/BMCHeader';
import DesktopNav from '@/components/layout/DesktopNav';

const supervisorNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/reallocation', label: 'Reallocation' },
  { href: '/attendance-log', label: 'Attendance Log' },
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
        <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
