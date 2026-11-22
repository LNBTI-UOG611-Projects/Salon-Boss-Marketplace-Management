import type { TFunction } from '@/i18n/translate';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-contact'];

/**
 * Validates a ?next= return path. Only same-site paths are allowed ("/brands/x", not "//evil.com"
 * or "https://..."), and never an auth page (that would loop back to sign-in).
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 300) return null;
  let path: string;
  try {
    path = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || /[\u0000-\u001f]/.test(path)) return null;
  if (AUTH_PAGES.some((p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`))) return null;
  return path;
}

/** "?next=..." to carry the return path on to the next auth page, or "" when there is none. */
export function nextQuery(next: string | null): string {
  return next ? `?next=${encodeURIComponent(next)}` : '';
}

/** Friendly name of where the customer will return to, for the "Returning to …" note. */
export function destinationLabel(next: string | null, t: TFunction): string | null {
  if (!next) return null;
  if (next.startsWith('/brands')) return t('nav.brands');
  if (next.startsWith('/categories')) return t('nav.categories');
  if (next.startsWith('/products')) return t('product.breadcrumbProducts');
  if (next.startsWith('/account')) return t('nav.myAccount');
  if (next.startsWith('/help-desk')) return t('nav.support');
  if (next === '/') return t('nav.home');
  return null;
}
