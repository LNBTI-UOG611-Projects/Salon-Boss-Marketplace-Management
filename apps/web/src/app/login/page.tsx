'use client';

import type { MeDto, RegistrationStatusDto } from '@bossone/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthShell, authInput } from '@/components/auth-shell';
import { Alert, Icon } from '@/components/ui';
import { useT } from '@/i18n/provider';
import { ApiError, apiFetch } from '@/lib/api';
import { destinationLabel, nextQuery, safeNext } from '@/lib/return-path';
import { createClient } from '@/lib/supabase';

interface LoginTokens {
  access_token: string;
  refresh_token: string;
}

/** A01 / L01 - Customer sign-in with a mobile number, email or username. */
function LoginForm() {
  const router = useRouter();
  const { t, locale, setLocale } = useT();
  const next = safeNext(useSearchParams().get('next'));
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const destination = destinationLabel(next, t);

  async function signIn(): Promise<string | null> {
    const supabase = createClient();
    const id = identifier.trim();
    if (id.includes('@')) {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: id, password });
      if (!authError) return null;
      if (authError.message.toLowerCase().includes('not confirmed')) return t('auth.errorUnconfirmed');
      if (authError.status === 400) return t('auth.errorInvalid');
      return authError.message;
    }
    // Mobile number or username: the API finds the account and returns a session.
    try {
      const tokens = await apiFetch<LoginTokens>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier: id, password }) });
      const { error: sessionError } = await supabase.auth.setSession(tokens);
      return sessionError ? sessionError.message : null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return e.message.includes('Verify your email') ? t('auth.errorUnconfirmed') : t('auth.errorInvalid');
      if (e instanceof ApiError) return e.message;
      return t('common.networkError');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) return setError(t('auth.errorRequired'));
    setBusy(true);
    setError(null);
    const problem = await signIn();
    setPassword('');
    if (problem) {
      setBusy(false);
      setError(problem);
      return;
    }
    try {
      const me = await apiFetch<MeDto>('/me'); // also creates the customer record on first sign-in
      // The Main Owner/Admin lands in the Owner workspace; other staff in the staff workspace.
      if (me.userType === 'STAFF') return router.push(staffLanding(me, next));
      // The account's language wins on sign-in (saved at registration or in settings).
      if (me.preferredLanguage && me.preferredLanguage !== locale) await setLocale(me.preferredLanguage, { save: false });
      // Customers who stopped part-way through registration continue where they left off.
      const status = await apiFetch<RegistrationStatusDto>('/account/registration');
      if (status.nextStep !== 'done') return router.push(`/register${nextQuery(next)}`);
      router.push(next ?? '/');
    } catch (err) {
      setBusy(false);
      setError((err as Error).message);
    }
  }

  async function staffGoogle() {
    const { error: authError } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/workspace` },
    });
    if (authError) setError(authError.message);
  }

  return (
    <AuthShell
      title={t('auth.welcome')}
      subtitle={t('auth.subtitle')}
      badge={
        next && (
          <p className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-soft px-3 py-1.5 text-label-md text-brand-blue">
            <Icon name="lock" className="!text-[16px]" />
            {destination ? t('auth.returningTo', { destination }) : t('auth.returningGeneric')}
          </p>
        )
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <label htmlFor="identifier" className="text-label-lg text-on-surface">{t('auth.identifier')}</label>
          <div className="relative mt-2">
            <Icon name="mail" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              id="identifier"
              autoComplete="username"
              inputMode="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t('auth.identifierPlaceholder')}
              aria-describedby="identifier-hint"
              className={`${authInput} pl-12`}
            />
          </div>
          <p id="identifier-hint" className="mt-2 text-body-sm text-on-surface-variant">{t('auth.identifierHint')}</p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className="text-label-lg text-on-surface">{t('auth.password')}</label>
            <Link href={`/forgot-password${nextQuery(next)}`} className="text-label-md text-brand-blue hover:underline">{t('auth.forgot')}</Link>
          </div>
          <div className="relative mt-2">
            <Icon name="lock" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              className={`${authInput} px-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="neu-icon absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-on-surface-variant"
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              aria-pressed={showPassword}
            >
              <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="!text-[18px]" />
            </button>
          </div>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <button
          type="submit"
          disabled={busy}
          className="btn-press btn-clay-navy flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-title-md text-white disabled:opacity-70"
        >
          {busy ? (
            <>
              <Icon name="progress_activity" className="animate-spin" /> {t('auth.signingIn')}
            </>
          ) : (
            <>
              <Icon name="login" /> {t('auth.signIn')} <Icon name="arrow_forward" className="btn-arrow" />
            </>
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4 text-label-md uppercase tracking-[0.08em] text-on-surface-variant">
        <span className="h-px flex-1 bg-border" /> {t('auth.newTo')} <span className="h-px flex-1 bg-border" />
      </div>
      <Link
        href={`/register${nextQuery(next)}`}
        className="btn-glass flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-title-md text-brand-blue"
      >
        <Icon name="person_add" /> {t('auth.createAccount')}
      </Link>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-body-sm text-on-surface-variant">
        <Icon name="shield" className="!text-[16px] text-brand-blue" /> {t('auth.secure')}
      </p>

      <details className="mt-6 border-t border-border pt-4 text-body-sm">
        <summary className="cursor-pointer text-label-md text-on-surface-variant">{t('auth.staff')}</summary>
        <button type="button" onClick={staffGoogle} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-label-lg text-on-surface hover:bg-surface-container">
          <Icon name="badge" /> {t('auth.staffGoogle')}
        </button>
      </details>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

/**
 * Where a staff account goes after signing in. A return path is used only when it is a page that
 * account may actually open; otherwise (for example "/" from the header's Sign in button) staff
 * would land on the shop, which they can't use. The Main Owner/Admin lands in the Owner
 * workspace, the Stock Manager in the warehouse workspace, Quality Control in the QC workspace,
 * and other staff in the staff workspace.
 */
function staffLanding(me: MeDto, next: string | null): string {
  const isOwner = me.permissions.includes('owner.oversight');
  const isWarehouse = !isOwner && me.permissions.includes('stock.count');
  const isQc = !isOwner && me.permissions.includes('qc.inspect');
  const home = isOwner ? '/owner' : isWarehouse ? '/stock' : isQc ? '/qc' : '/workspace';
  if (!next) return home;
  if (next.startsWith('/workspace')) return next;
  if (next.startsWith('/owner')) return isOwner ? next : home;
  if (next.startsWith('/stock')) return isWarehouse ? next : home;
  if (next.startsWith('/qc')) return isQc ? next : home;
  return home;
}
