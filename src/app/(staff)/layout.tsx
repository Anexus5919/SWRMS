'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import BMCHeader from '@/components/layout/BMCHeader';
import MobileNav from '@/components/layout/MobileNav';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [faceChecked, setFaceChecked] = useState(false);
  const [hasFace, setHasFace] = useState(true); // assume true until proven false

  useEffect(() => {
    // Only check for staff role and skip if already on onboarding page
    if (status !== 'authenticated' || session?.user?.role !== 'staff') return;
    if (pathname === '/onboarding') return;

    // Check if face is registered
    fetch('/api/staff/face')
      .then(res => res.json())
      .then(data => {
        setFaceChecked(true);
        if (data.success && !data.data.hasRegisteredFace) {
          setHasFace(false);
          router.replace('/onboarding');
        } else {
          setHasFace(true);
        }
      })
      .catch(() => {
        setFaceChecked(true);
        setHasFace(true); // don't block on network error
      });
  }, [status, session, pathname, router]);

  // Show nothing while checking (prevents flash of content before redirect)
  if (status === 'authenticated' && session?.user?.role === 'staff' && !faceChecked && pathname !== '/onboarding') {
    return (
      <div className="flex flex-col min-h-screen">
        <BMCHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <BMCHeader />
      <main className="flex-1 pb-20">{children}</main>
      {/* Only show nav if face is registered (not on onboarding) */}
      {hasFace && pathname !== '/onboarding' && <MobileNav />}
    </div>
  );
}
