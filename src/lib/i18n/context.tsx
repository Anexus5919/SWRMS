'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  lookup,
  messages as MESSAGES,
} from './messages';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const STORAGE_KEY = 'swrms.locale';

const LocaleContext = createContext<LocaleContextValue | null>(null);

function isLocale(v: string | null): v is Locale {
  return !!v && (SUPPORTED_LOCALES as readonly string[]).includes(v);
}

/**
 * LocaleProvider stores the user's chosen locale in localStorage so it
 * persists across reloads. Wrap the staff layout in this provider.
 *
 * Default locale order:
 *  1. value previously saved in localStorage
 *  2. browser's first navigator.languages match (hi-* → hi, mr-* → mr)
 *  3. English
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) {
      setLocaleState(saved);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.languages) {
      for (const tag of navigator.languages) {
        const base = tag.split('-')[0].toLowerCase();
        if (isLocale(base)) {
          setLocaleState(base);
          return;
        }
      }
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, l);
      } catch {
        /* localStorage may be disabled in private windows */
      }
    }
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const dict = MESSAGES[locale];
    return {
      locale,
      setLocale,
      t: (key: string) => lookup(dict, key),
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * useTranslation - main hook for staff-PWA components.
 *
 * Falls back gracefully if used outside a provider (returns the key
 * unchanged) so SSR snapshots render without crashing.
 */
export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE as Locale,
      setLocale: () => {},
      t: (key: string) => key,
    };
  }
  return ctx;
}
