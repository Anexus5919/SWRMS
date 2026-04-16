import BMCHeader from '@/components/layout/BMCHeader';
import MobileNav from '@/components/layout/MobileNav';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <BMCHeader />
      <main className="flex-1 pb-20">{children}</main>
      <MobileNav />
    </div>
  );
}
