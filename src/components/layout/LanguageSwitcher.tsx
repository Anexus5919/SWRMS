'use client';

import { useTranslation } from '@/lib/i18n/context';
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n/messages';

/**
 * Compact language switcher: 3 pill-shaped buttons (En / हिं / मरा).
 * Designed for the staff PWA header — single tap to switch language,
 * no dropdown to navigate (important for low-literacy users).
 */
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-white/10 p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {(SUPPORTED_LOCALES as readonly Locale[]).map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${
              active
                ? 'bg-white text-bmc-800'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            aria-pressed={active}
          >
            {LOCALE_LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
