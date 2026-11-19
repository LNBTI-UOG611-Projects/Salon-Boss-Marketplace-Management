/**
 * Reads and validates environment variables once at startup.
 * The API refuses to start if a required variable is missing.
 */
export interface Env {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  CORS_ORIGINS: string[];
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_JWT_SECRET?: string;
  /** Public address of the website, used for payment return links. */
  WEB_URL: string;
  /** Public address of this API (with /api), used for the payment notification link. */
  API_PUBLIC_URL: string;
  /** PayHere card payments. Card payment is offered only when both are set. */
  PAYHERE_MERCHANT_ID?: string;
  PAYHERE_MERCHANT_SECRET?: string;
  /** true = PayHere sandbox (test cards). Default true outside production. */
  PAYHERE_SANDBOX: boolean;
  /** Seller details printed on invoice, receipt and credit note PDFs. Each is printed only when set. */
  COMPANY_NAME: string;
  COMPANY_ADDRESS?: string;
  COMPANY_EMAIL?: string;
  COMPANY_PHONE?: string;
  COMPANY_REG_NO?: string;
  COMPANY_VAT_NO?: string;
  COMPANY_SVAT_NO?: string;
}

let cached: Env | null = null;

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable ${name}. See apps/api/.env.example.`);
  }
  return value.trim();
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function loadEnv(): Env {
  if (cached) return cached;

  const nodeEnv = (process.env.NODE_ENV ?? 'development') as Env['NODE_ENV'];
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  cached = {
    NODE_ENV: nodeEnv,
    PORT: port,
    CORS_ORIGINS: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    DATABASE_URL: required('DATABASE_URL'),
    SUPABASE_URL: required('SUPABASE_URL').replace(/\/$/, ''),
    SUPABASE_SERVICE_ROLE_KEY: optional('SUPABASE_SERVICE_ROLE_KEY'),
    SUPABASE_JWT_SECRET: optional('SUPABASE_JWT_SECRET'),
    WEB_URL: (optional('WEB_URL') ?? 'http://localhost:3000').replace(/\/$/, ''),
    API_PUBLIC_URL: (optional('API_PUBLIC_URL') ?? `http://localhost:${port}/api`).replace(/\/$/, ''),
    PAYHERE_MERCHANT_ID: optional('PAYHERE_MERCHANT_ID'),
    PAYHERE_MERCHANT_SECRET: optional('PAYHERE_MERCHANT_SECRET'),
    PAYHERE_SANDBOX: (optional('PAYHERE_SANDBOX') ?? (nodeEnv === 'production' ? 'false' : 'true')) === 'true',
    COMPANY_NAME: optional('COMPANY_NAME') ?? 'BOSSONE.LK',
    COMPANY_ADDRESS: optional('COMPANY_ADDRESS'),
    COMPANY_EMAIL: optional('COMPANY_EMAIL'),
    COMPANY_PHONE: optional('COMPANY_PHONE'),
    COMPANY_REG_NO: optional('COMPANY_REG_NO'),
    COMPANY_VAT_NO: optional('COMPANY_VAT_NO'),
    COMPANY_SVAT_NO: optional('COMPANY_SVAT_NO'),
  };
  // Live PayHere credentials must never be used by a development or test server.
  if (cached.NODE_ENV !== 'production' && cached.PAYHERE_MERCHANT_ID && !cached.PAYHERE_SANDBOX) {
    const env = cached;
    cached = null;
    throw new Error(`PAYHERE_SANDBOX must be true when NODE_ENV is ${env.NODE_ENV}. Live payment credentials are for production only.`);
  }
  return cached;
}

/** Test helper: forget the cached values. */
export function resetEnvCache() {
  cached = null;
}
