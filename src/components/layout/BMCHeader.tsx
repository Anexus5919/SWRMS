'use client';

import { useSession, signOut } from 'next-auth/react';

export default function BMCHeader() {
  const { data: session } = useSession();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-bmc-900 text-white">
      {/* Primary Header Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* BMC Emblem placeholder - circular badge */}
          <div className="w-10 h-10 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-xs font-bold tracking-tight">
            BMC
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide leading-tight">
              Brihanmumbai Municipal Corporation
            </h1>
            <p className="text-[11px] text-white/70 leading-tight">
              Solid Waste Management — Chembur Ward Office
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-white/60 hidden sm:block">{today}</span>
          {session?.user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium">{session.user.name}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">
                  {session.user.role} — {session.user.employeeId}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs px-3 py-1.5 rounded border border-white/25 hover:bg-white/10 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
