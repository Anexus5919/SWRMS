'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import TrackingCard from '@/components/tracking/TrackingCard';
import UnavailabilityCard from '@/components/staff/UnavailabilityCard';
import { useTranslation } from '@/lib/i18n/context';

interface StatusData {
  faceRegistered: boolean;
  attendance: {
    marked: boolean;
    time: string | null;
    status: string | null;
  };
  photos: {
    shiftStart: { submitted: boolean; verified: boolean; time: string | null };
    checkpoints: number;
    shiftEnd: { submitted: boolean; verified: boolean; time: string | null };
  };
  routeProgress: {
    percentage: number;
    status: string;
  };
  route: { name: string; code: string; shiftEnd?: string } | null;
  unavailability: { reason: string; declaredAt: string } | null;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function StaffHomePage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch {
      // Silently fail - keep last known state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Determine which step is current (first incomplete step)
  const getCurrentStep = (): number => {
    if (!status) return 1;
    if (!status.faceRegistered) return 1;
    if (!status.attendance.marked) return 2;
    if (!status.photos.shiftStart.submitted) return 3;
    if (status.routeProgress.status !== 'completed') return 4;
    if (!status.photos.shiftEnd.submitted) return 5;
    return 6; // all done
  };

  const currentStep = status ? getCurrentStep() : 1;

  const steps = status
    ? [
        {
          num: 1,
          title: t('home.stepFace'),
          done: status.faceRegistered,
          time: null as string | null,
          action: !status.faceRegistered ? '/onboarding' : null,
          actionLabel: t('home.stepFaceAction'),
          doneLabel: t('home.stepFaceDone'),
          pendingLabel: t('home.stepFacePending'),
          warning: !status.faceRegistered,
        },
        {
          num: 2,
          title: t('home.stepAttendance'),
          done: status.attendance.marked,
          time: status.attendance.time,
          action: !status.attendance.marked && status.faceRegistered ? '/attendance' : null,
          actionLabel: t('home.stepAttendanceAction'),
          doneLabel: `${t('home.stepAttendanceVerifiedAt')} ${status.attendance.time || ''}`,
          pendingLabel: t('home.stepAttendancePending'),
          warning: false,
        },
        {
          num: 3,
          title: t('home.stepShiftStart'),
          done: status.photos.shiftStart.submitted,
          time: status.photos.shiftStart.time,
          action:
            status.attendance.marked && !status.photos.shiftStart.submitted
              ? '/photo-check?type=shift_start'
              : null,
          actionLabel: t('home.stepShiftStartAction'),
          doneLabel: `${t('home.submittedAt')} ${status.photos.shiftStart.time || ''}${status.photos.shiftStart.verified ? ` - ${t('home.verifiedSuffix')}` : ''}`,
          pendingLabel: t('home.stepShiftStartPending'),
          warning: false,
        },
        {
          num: 4,
          title: t('home.stepRoute'),
          done: status.routeProgress.status === 'completed',
          time: null as string | null,
          action: '/progress',
          actionLabel: t('home.stepRouteAction'),
          doneLabel: t('home.stepRouteCompleted'),
          pendingLabel: `${status.routeProgress.percentage}${t('home.stepRoutePercentSuffix')}`,
          warning: false,
          showProgress: true,
          progressPercent: status.routeProgress.percentage,
        },
        {
          num: 5,
          title: t('home.stepShiftEnd'),
          done: status.photos.shiftEnd.submitted,
          time: status.photos.shiftEnd.time,
          action:
            status.attendance.marked && !status.photos.shiftEnd.submitted
              ? '/photo-check?type=shift_end'
              : null,
          actionLabel: t('home.stepShiftEndAction'),
          doneLabel: `${t('home.submittedAt')} ${status.photos.shiftEnd.time || ''}${status.photos.shiftEnd.verified ? ` - ${t('home.verifiedSuffix')}` : ''}`,
          pendingLabel: t('home.stepShiftEndPending'),
          warning: false,
        },
      ]
    : [];

  return (
    <div className="px-4 pt-5 pb-6 max-w-lg mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[var(--neutral-800)]">
          {(() => {
            const h = new Date().getHours();
            const key = h < 12 ? 'home.morning' : h < 17 ? 'home.afternoon' : 'home.evening';
            return t(key);
          })()}
          {session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-xs text-[var(--neutral-500)] mt-0.5">
          {formatDate()}
        </p>
        {session?.user?.employeeId && (
          <p className="text-[10px] text-[var(--neutral-400)] uppercase tracking-wider mt-0.5">
            {session.user.employeeId}
          </p>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">{t('home.loading')}</p>
        </div>
      )}

      {/* Checklist Timeline */}
      {!loading && status && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gray-200" />

          <div className="space-y-1">
            {steps.map((step) => {
              const isCurrent = step.num === currentStep;
              const isFuture = step.num > currentStep;
              const isDone = step.done;

              return (
                <div key={step.num} className="relative flex items-start gap-3 py-3">
                  {/* Step icon */}
                  <div className="relative z-10 flex-shrink-0">
                    {isDone ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    ) : step.warning ? (
                      <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                    ) : isCurrent ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center animate-pulse">
                        <span className="text-sm font-bold text-emerald-600">{step.num}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-400">{step.num}</span>
                      </div>
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <h3
                      className={`text-sm font-semibold ${
                        isDone
                          ? 'text-emerald-700'
                          : step.warning
                            ? 'text-red-600'
                            : isCurrent
                              ? 'text-[var(--neutral-800)]'
                              : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-xs mt-0.5 ${
                        isDone
                          ? 'text-emerald-600'
                          : step.warning
                            ? 'text-red-500'
                            : isFuture
                              ? 'text-gray-400'
                              : 'text-[var(--neutral-500)]'
                      }`}
                    >
                      {isDone ? step.doneLabel : step.pendingLabel}
                    </p>

                    {/* Progress bar for route progress */}
                    {'showProgress' in step && step.showProgress && !isDone && !isFuture && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${step.progressPercent}%` }}
                        />
                      </div>
                    )}

                    {/* Checkpoint count */}
                    {step.num === 3 && isDone && status.photos.checkpoints > 0 && (
                      <p className="text-[10px] text-[var(--neutral-400)] mt-0.5">
                        + {status.photos.checkpoints} {t('home.checkpointPhotosSuffix')}
                      </p>
                    )}

                    {/* Action button */}
                    {step.action && !isDone && !isFuture && (
                      <Link
                        href={step.action}
                        className={`inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-[0.97] ${
                          step.warning
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : isCurrent
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-bmc-100 text-bmc-700 hover:bg-bmc-200'
                        }`}
                      >
                        {step.actionLabel}
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    )}

                    {/* View action for completed route progress */}
                    {step.num === 4 && step.action && isDone && (
                      <Link
                        href={step.action}
                        className="inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors active:scale-[0.97]"
                      >
                        {t('home.stepRouteViewDetails')}
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unavailability card - shown when attendance NOT yet marked.
          If worker already self-declared unavailable, shows confirmation
          state. Hidden entirely once attendance is marked. */}
      {!loading && status && (
        <UnavailabilityCard
          attendanceMarked={status.attendance.marked}
          alreadyDeclared={status.unavailability !== null}
          onDeclared={fetchStatus}
        />
      )}

      {/* Live tracking card - only after attendance is marked */}
      {!loading && status?.attendance.marked && status.attendance.status === 'verified' && (
        <TrackingCard
          attendanceVerified
          routeCompleted={status.routeProgress.status === 'completed'}
          shiftEnd={status.route?.shiftEnd}
        />
      )}

      {/* Route info footer */}
      {!loading && status?.route && (
        <div className="mt-6 p-3 rounded-lg bg-bmc-50 border border-bmc-100">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-bmc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-bmc-700">{status.route.name}</p>
              <p className="text-[10px] text-bmc-500">{status.route.code}</p>
            </div>
          </div>
        </div>
      )}

      {/* All done state */}
      {!loading && status && currentStep === 6 && (
        <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
          <svg className="w-10 h-10 mx-auto text-emerald-500 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          <p className="text-sm font-semibold text-emerald-700">{t('home.allDoneTitle')}</p>
          <p className="text-xs text-emerald-600 mt-0.5">{t('home.allDoneSub')}</p>
        </div>
      )}
    </div>
  );
}
