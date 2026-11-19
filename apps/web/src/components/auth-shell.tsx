'use client';
/* eslint-disable @next/next/no-img-element */
import { useT } from '@/i18n/provider';
import { Logo } from './logo';
import { Icon } from './ui';

/**
 * Sign-in layout from the L01 design: a salon photo panel with a frosted-glass promise card,
 * and the form card beside it. Also used by password recovery. On phones only the form shows.
 */
export function AuthShell({
  badge,
  title,
  subtitle,
  children,
}: {
  badge?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { t } = useT();
  return (
    <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-8 md:px-6 lg:grid-cols-[1fr_minmax(0,560px)] lg:py-10">
      <aside className="relative hidden min-h-[680px] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-30px_rgb(15_32_66/0.55)] lg:block">
        <img src="/storefront/login-salon.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f2042]/80" />
        <span className="absolute left-8 top-8 inline-flex items-center gap-2 rounded-full bg-[#1756a9] px-3 py-1.5 text-label-md text-white shadow-lg">
          <span className="h-2 w-2 rounded-full bg-gold" /> {t('auth.panelDelivery')}
        </span>
        <div className="glass-panel absolute inset-x-8 bottom-8 rounded-2xl p-6">
          <p className="flex items-center gap-2 text-label-md uppercase tracking-[0.1em] text-brand-blue">
            <Icon name="verified" className="!text-[18px] text-gold" /> {t('auth.panelNetwork')}
          </p>
          <p className="mt-3 font-display text-[26px] font-bold leading-tight text-on-surface">{t('auth.panelTitle')}</p>
          <p className="font-display text-[26px] font-bold italic leading-tight text-brand-blue">{t('auth.panelTitle2')}</p>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {[
              { icon: 'sell', title: t('auth.panelPoint1'), body: t('auth.panelPoint1Body') },
              { icon: 'bolt', title: t('auth.panelPoint2'), body: t('auth.panelPoint2Body') },
            ].map((p) => (
              <li key={p.icon} className="flex gap-2 rounded-xl bg-surface-container-lowest/70 p-3">
                <Icon name={p.icon} className="mt-0.5 text-brand-blue" />
                <span>
                  <span className="block text-label-lg text-on-surface">{p.title}</span>
                  <span className="block text-body-sm text-on-surface-variant">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="step-panel rounded-[24px] border border-border bg-surface-container-lowest p-6 shadow-[0_24px_60px_-34px_rgb(15_32_66/0.45)] md:p-10">
        <div className="flex items-center justify-between gap-3">
          <Logo className="h-14 w-auto" />
          <span className="rounded-full bg-brand-blue-soft px-3 py-1 text-label-sm uppercase tracking-[0.08em] text-brand-blue">{t('common.wholesaleB2b')}</span>
        </div>
        {badge && <div className="mt-5">{badge}</div>}
        <h1 className="mt-4 font-display text-[30px] font-bold leading-tight text-on-surface">{title}</h1>
        {subtitle && <p className="mt-2 text-body-lg text-on-surface-variant">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

/** Shared input look for the auth and registration forms (soft blue surface, 48px tall). */
export const authInput =
  'h-12 w-full rounded-xl border border-border bg-input px-4 text-body-lg text-on-surface placeholder:text-text-muted transition-[border-color,box-shadow] focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/15 disabled:opacity-60 aria-[invalid=true]:border-error';
