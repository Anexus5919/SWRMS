'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Reason = 'sick' | 'personal' | 'transport' | 'other';

interface Props {
  /** Worker has already declared themselves unavailable today. */
  alreadyDeclared: boolean;
  /** Worker has already marked attendance today (hide the card entirely). */
  attendanceMarked: boolean;
  /** Called after a successful declaration so the parent can refresh status. */
  onDeclared?: () => void;
}

/**
 * Big-icon, low-literacy unavailability card on the staff home page.
 *
 * Four large square buttons (Sick / Personal / No Transport / Other)
 * — each one tap. After tapping, a single confirmation modal asks the
 * worker to confirm before posting to /api/unavailability.
 *
 * If the worker has already checked in, this card is hidden entirely
 * (`attendanceMarked === true`) — they can't unmark themselves.
 */
export default function UnavailabilityCard({
  alreadyDeclared,
  attendanceMarked,
  onDeclared,
}: Props) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<Reason | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (attendanceMarked) return null;

  if (alreadyDeclared) {
    return (
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
        <svg
          className="w-8 h-8 mx-auto text-amber-600 mb-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <p className="text-sm font-semibold text-amber-800">{t('unavail.declared')}</p>
      </div>
    );
  }

  const submit = async (reason: Reason) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/unavailability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (json.success) {
        setPending(null);
        onDeclared?.();
      } else {
        setError(json.error?.message ?? t('errors.generic'));
      }
    } catch {
      setError(t('errors.network'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] bg-white p-4">
      <h3 className="text-sm font-semibold text-[var(--neutral-800)]">
        {t('unavail.title')}
      </h3>
      <p className="text-xs text-[var(--neutral-500)] mt-1.5 leading-relaxed">
        {t('unavail.explainer')}
      </p>

      {error && (
        <p className="mt-2 text-[11px] text-red-700 bg-red-50 px-2 py-1 rounded">{error}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <ReasonButton
          icon={<SickIcon />}
          label={t('unavail.sick')}
          onClick={() => setPending('sick')}
        />
        <ReasonButton
          icon={<PersonalIcon />}
          label={t('unavail.personal')}
          onClick={() => setPending('personal')}
        />
        <ReasonButton
          icon={<TransportIcon />}
          label={t('unavail.transport')}
          onClick={() => setPending('transport')}
        />
        <ReasonButton
          icon={<OtherIcon />}
          label={t('unavail.other')}
          onClick={() => setPending('other')}
        />
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 animate-fade-in">
            <h4 className="text-base font-semibold text-[var(--neutral-800)]">
              {t('unavail.title')}
            </h4>
            <p className="text-sm text-[var(--neutral-600)] mt-1.5">
              {t(`unavail.${pending}`)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={submitting}
                className="px-4 py-3 rounded-lg text-sm font-semibold border border-[var(--border)] text-[var(--neutral-700)] active:scale-[0.97] disabled:opacity-50"
              >
                {t('unavail.cancel')}
              </button>
              <button
                type="button"
                onClick={() => submit(pending)}
                disabled={submitting}
                className="px-4 py-3 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.97] disabled:opacity-60"
              >
                {submitting ? t('common.loading') : t('unavail.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReasonButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-800 font-semibold text-sm hover:bg-amber-100 active:scale-[0.97] transition-colors"
    >
      <span className="w-9 h-9 flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function SickIcon() {
  return (
    <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

function PersonalIcon() {
  return (
    <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25v3.75m0 0l3 3m-3-3l-3 3"
      />
    </svg>
  );
}

function TransportIcon() {
  return (
    <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
      />
    </svg>
  );
}

function OtherIcon() {
  return (
    <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    </svg>
  );
}
