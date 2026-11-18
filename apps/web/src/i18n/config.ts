import { APP_LANGUAGES, type AppLanguage } from '@bossone/shared';

/** Customer interface languages. Staff workspaces stay in English. */
export const LOCALES = APP_LANGUAGES;
export type Locale = AppLanguage;
export const DEFAULT_LOCALE: Locale = 'en';

/** Guest (and signed-in) language choice lives in this cookie so the server renders the right language. */
export const LOCALE_COOKIE = 'bossone-lang';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Each language named in its own script, as the selector shows it. */
export const LOCALE_LABELS: Record<Locale, string> = { en: 'English', si: 'සිංහල' };

export function toLocale(value: unknown): Locale {
  return value === 'si' ? 'si' : DEFAULT_LOCALE;
}
