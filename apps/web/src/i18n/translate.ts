import type { Locale } from './config';
import { en, type Messages } from './en';
import { si } from './si';

/** Every dotted key in the English dictionary, e.g. "nav.brands". */
export type TKey = Paths<Messages>;
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

export type Vars = Record<string, string | number>;
export type TFunction = (key: TKey, vars?: Vars) => string;

const DICTIONARIES: Record<Locale, unknown> = { en, si };

/** Reads a dotted key from a nested dictionary. Shared with the Owner workspace dictionary. */
export function lookup(dict: unknown, key: string): string | undefined {
  let node: unknown = dict;
  const parts = key.split('.');
  for (let i = 0; i < parts.length; i++) {
    if (!node || typeof node !== 'object') return undefined;
    const obj = node as Record<string, unknown>;
    if (parts[i] in obj) {
      node = obj[parts[i]];
      continue;
    }
    // Keys that contain dots themselves (e.g. permission names such as "orders.read").
    const rest = parts.slice(i).join('.');
    return typeof obj[rest] === 'string' ? (obj[rest] as string) : undefined;
  }
  return typeof node === 'string' ? node : undefined;
}

/** Fills {placeholders} in a translated text. */
export function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/**
 * Returns the translation for `key`. Missing Sinhala text falls back to English, and a missing
 * English key falls back to the key itself (and is reported once in development).
 */
export function translate(locale: Locale, key: TKey, vars?: Vars): string {
  const text = lookup(DICTIONARIES[locale], key) ?? lookup(en, key);
  if (text === undefined) {
    if (process.env.NODE_ENV !== 'production') reportMissing(key);
    return key;
  }
  return interpolate(text, vars);
}

export function createTranslator(locale: Locale): TFunction {
  return (key, vars) => translate(locale, key, vars);
}

const reported = new Set<string>();
function reportMissing(key: string) {
  if (reported.has(key)) return;
  reported.add(key);
  console.warn(`[i18n] Missing translation key: ${key}`);
}
