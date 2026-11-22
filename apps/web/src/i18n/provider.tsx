'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from './config';
import { createTranslator, type TFunction } from './translate';

interface I18nValue {
  locale: Locale;
  t: TFunction;
  /**
   * Changes the language now, remembers it in a cookie (guests too) and, for signed-in customers,
   * saves it to their account. `save: false` skips the account update (used after login, when the
   * language comes from the account itself).
   */
  setLocale: (locale: Locale, opts?: { save?: boolean }) => Promise<void>;
}

const I18nContext = createContext<I18nValue | null>(null);

export function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    async (next: Locale, opts: { save?: boolean } = {}) => {
      const changed = next !== document.documentElement.lang;
      setLocaleState(next);
      writeLocaleCookie(next);
      document.documentElement.lang = next;
      // Server-rendered parts of the page read the cookie: re-render them in the new language.
      // Only when the language really changed - an extra refresh while navigating can interrupt the page.
      if (changed) router.refresh();
      if (opts.save === false) return;
      try {
        const { data } = await createClient().auth.getSession();
        if (data.session) {
          await apiFetch('/account/language', { method: 'PATCH', body: JSON.stringify({ preferredLanguage: next }) });
        }
      } catch {
        // Staff accounts have no language setting, and a failed save keeps the cookie choice.
        // The interface has already changed, so there is nothing to undo.
      }
    },
    [router],
  );

  const value = useMemo<I18nValue>(() => ({ locale, t: createTranslator(locale), setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Translation hook for client components: `const { t } = useT(); t('nav.brands')`. */
export function useT(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useT must be used inside <I18nProvider>');
  return value;
}
