import { createClient } from './supabase';

/**
 * The browser talks to the API through this website's own /api gateway (app/api/[...path]/route.ts),
 * so the real API address is never exposed to visitors.
 */
export const API_URL = '/api';

/** Requests give up after this long, so a slow or stopped API never leaves the page hanging. */
const TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** status 0: the API could not be reached (offline, API stopped, timed out). */
export const isNetworkError = (e: unknown) => e instanceof ApiError && e.status === 0;

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`;
    try {
      const body = JSON.parse(text);
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
    } catch {
      // not JSON
    }
    if (res.status >= 500) message = 'Something went wrong on our side. Please try again in a moment.';
    throw new ApiError(res.status, message);
  }
  // Empty replies (204, or an endpoint that returns nothing) are fine.
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

async function send(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  // Respect a caller's own abort signal too.
  init.signal?.addEventListener('abort', () => controller.abort());
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (init.signal?.aborted) throw e;
    throw new ApiError(0, 'Cannot reach BOSSONE.LK right now. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Browser-side fetch that sends the Supabase access token.
 * The API verifies the token and checks permissions - the UI never decides access on its own.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token: string | undefined;
  try {
    const { data } = await createClient().auth.getSession();
    token = data.session?.access_token;
  } catch {
    // Supabase not configured or storage unavailable: call as a guest.
  }
  const call = (bearer: string | undefined) =>
    send(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...init.headers,
      },
    });
  let res = await call(token);
  // A tab left open for a long time can hold an expired access token: refresh it once and retry,
  // so the page keeps working without a manual reload.
  if (res.status === 401 && token) {
    const fresh = await refreshedToken();
    if (fresh && fresh !== token) res = await call(fresh);
  }
  return parse<T>(res);
}

/** Asks Supabase for a new access token; null when the session cannot be refreshed (signed out). */
async function refreshedToken(): Promise<string | null> {
  try {
    const { data } = await createClient().auth.refreshSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Downloads a file the API generates (PDF invoice, data export) with the user's token and saves it
 * with the name the server gives. Nothing is printed by the browser: the file comes from the server.
 */
export async function apiDownload(path: string, fallbackName: string): Promise<void> {
  let token: string | undefined;
  try {
    const { data } = await createClient().auth.getSession();
    token = data.session?.access_token;
  } catch {
    // not signed in
  }
  const res = await send(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) await parse(res);
  const blob = await res.blob();
  const match = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = match?.[1] ?? fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
