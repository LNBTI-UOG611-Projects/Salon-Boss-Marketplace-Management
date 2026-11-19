import 'server-only';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, toLocale, type Locale } from './config';
import { createTranslator, type TFunction } from './translate';

/** The visitor's language for server components (from the language cookie). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return toLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getT(): Promise<TFunction> {
  return createTranslator(await getLocale());
}
