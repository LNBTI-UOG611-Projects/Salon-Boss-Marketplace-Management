'use client';

/**
 * Shared UI building blocks, styled with the Stitch "Commercial Salon Wholesale" tokens.
 * All three sections use these so the app looks consistent. Add new shared pieces here.
 */
import { VERIFICATION_STATUS_LABELS, type VerificationStatus } from '@bossone/shared';
import Link from 'next/link';
import { forwardRef, useId } from 'react';
import { Icon } from './icons';
import { Portal, useOverlay } from './overlay';

export { Icon };

/* ---------------- Buttons ---------------- */

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'brand' | 'gold';
const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary-container text-on-primary hover:brightness-110',
  accent: 'bg-secondary-container text-on-secondary-container hover:brightness-95 shadow-sm',
  secondary: 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container',
  ghost: 'text-on-surface hover:bg-surface-container',
  danger: 'bg-error text-on-error hover:brightness-95',
  brand: 'bg-brand-blue text-on-brand-blue hover:bg-brand-blue-hover shadow-[0_8px_20px_-10px_rgb(23_86_169/0.7)]',
  gold: 'bg-gold text-on-gold hover:brightness-95 shadow-[0_8px_20px_-10px_rgb(255_201_40/0.8)]',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
  loading?: boolean;
  full?: boolean;
}

export function Button({ variant = 'primary', icon, loading, full, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-label-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant]} ${full ? 'w-full' : ''} ${className}`}
    >
      {loading ? <Icon name="progress_activity" className="animate-spin" /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({ href, variant = 'primary', icon, children, className = '' }: { href: string; variant?: ButtonVariant; icon?: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-label-lg transition ${BUTTON_STYLES[variant]} ${className}`}>
      {icon && <Icon name={icon} />}
      {children}
    </Link>
  );
}

/* ---------------- Form fields ---------------- */

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
}

export function Field({ label, hint, error, required, children }: FieldShellProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-label-md text-on-surface">
        <span>
          {label}
          {required && <span className="text-error"> *</span>}
        </span>
        {hint && <span className="text-body-sm font-normal text-on-surface-variant">{hint}</span>}
      </label>
      {children(id)}
      {error && <p className="text-body-sm text-error">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-border bg-input px-3 py-2.5 text-body-md text-on-surface placeholder:text-text-muted transition-[border-color,box-shadow] focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/15 disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return <input ref={ref} {...props} className={`${inputClass} ${className}`} />;
  },
);

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-24 ${props.className ?? ''}`} />;
}

type SelectOption = string | { value: string; label: string };

export function Select({ options, placeholder, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: readonly SelectOption[]; placeholder?: string }) {
  return (
    <select {...props} className={`${inputClass} ${props.className ?? ''}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) =>
        typeof o === 'string' ? (
          <option key={o} value={o}>{o}</option>
        ) : (
          <option key={o.value} value={o.value}>{o.label}</option>
        ),
      )}
    </select>
  );
}

export function Checkbox({ label, description, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 hover:bg-surface-container-low">
      <input type="checkbox" {...props} className="mt-0.5 h-4 w-4 accent-primary-container" />
      <span>
        <span className="block text-label-lg">{label}</span>
        {description && <span className="block text-body-sm text-on-surface-variant">{description}</span>}
      </span>
    </label>
  );
}

/* ---------------- Layout pieces ---------------- */

export function Card({ title, subtitle, action, children, className = '' }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-space-lg shadow-[0_1px_4px_rgba(15,32,66,0.05)] ${className}`}>
      {(title || action) && (
        <div className="mb-space-md flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-headline-sm text-primary">{title}</h2>}
            {subtitle && <p className="mt-1 text-body-sm text-on-surface-variant">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-space-lg flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-label-sm uppercase text-secondary">{eyebrow}</p>}
        <h1 className="text-headline-lg-mobile text-primary md:text-headline-lg">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type AlertTone = 'info' | 'success' | 'warning' | 'error';
const ALERT_STYLES: Record<AlertTone, [string, string]> = {
  info: ['bg-primary-fixed/50 text-on-primary-fixed-variant', 'info'],
  success: ['bg-green-50 text-green-800', 'check_circle'],
  warning: ['bg-secondary-fixed/60 text-on-secondary-fixed-variant', 'warning'],
  error: ['bg-error-container text-on-error-container', 'error'],
};

export function Alert({ tone = 'info', title, children }: { tone?: AlertTone; title?: string; children?: React.ReactNode }) {
  const [style, icon] = ALERT_STYLES[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-lg p-3 text-body-md ${style}`}>
      <Icon name={icon} className="mt-0.5 shrink-0" />
      <div>
        {title && <p className="text-label-lg">{title}</p>}
        {children}
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<VerificationStatus, [string, string]> = {
  NOT_SUBMITTED: ['bg-surface-container-high text-on-surface-variant', 'draft'],
  PENDING_REVIEW: ['bg-secondary-fixed text-on-secondary-fixed-variant', 'hourglass_top'],
  VERIFIED: ['bg-green-100 text-green-800', 'verified'],
  CLARIFICATION_REQUIRED: ['bg-error-container text-on-error-container', 'report'],
  REJECTED: ['bg-error text-on-error', 'block'],
};

export function StatusBadge({ status }: { status: VerificationStatus }) {
  const [style, icon] = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm uppercase ${style}`}>
      <Icon name={icon} className="!text-[14px]" />
      {VERIFICATION_STATUS_LABELS[status]}
    </span>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`rounded-full px-3.5 py-1.5 text-label-md transition ${
            value === t.value ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 opacity-70">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant p-space-xl text-center">
      <Icon name={icon} className="!text-[40px] text-outline" />
      <p className="mt-3 text-title-md">{title}</p>
      <div className="mt-2 text-body-md text-on-surface-variant">{children}</div>
    </div>
  );
}

/**
 * Centred dialog. Rendered at the top level of the page (so nothing can cover or clip it),
 * closes with the X button, Escape or a click on the dimmed background.
 */
export function Modal({ open, title, children, onClose, wide = false }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  const titleId = useId();
  useOverlay(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-4">
        <button type="button" tabIndex={-1} aria-hidden className="overlay-in scrim absolute inset-0 cursor-default" onClick={onClose} />
        <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={`modal-in modal-card relative max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-surface-container-lowest p-6 shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hdr-btn absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant"
          >
            <Icon name="close" />
          </button>
          <h3 id={titleId} className="pr-10 font-display text-[22px] font-bold tracking-[-0.02em] text-on-surface">
            {title}
          </h3>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </Portal>
  );
}

export function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-on-surface-variant">
      <Icon name="progress_activity" className="animate-spin" /> {label}
    </div>
  );
}
