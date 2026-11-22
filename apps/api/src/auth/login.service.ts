import { HttpException, HttpStatus, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { normalizeSriLankanPhone, normalizeUsername } from '@bossone/shared';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
/** One message for every failure, so the response never reveals whether an account exists. */
const GENERIC = 'Incorrect login details. Check your mobile number, email or username and your password.';

export interface LoginTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Sign-in with a mobile number or username (email sign-in goes straight from the browser to Supabase).
 *
 * Supabase signs in by email, so the API looks up the account's email from its verified mobile
 * number or username, signs in on the customer's behalf and hands the session back. The email is
 * never sent to the browser. Attempts are limited per identifier.
 */
@Injectable()
export class LoginService {
  private readonly attempts = new Map<string, { count: number; since: number }>();

  constructor(private readonly prisma: PrismaService) {}

  async login(identifier: string, password: string): Promise<LoginTokens> {
    const key = identifier.trim().toLowerCase();
    this.throttle(key);

    const email = await this.resolveEmail(identifier);
    if (!email) {
      this.fail(key);
      throw new UnauthorizedException(GENERIC);
    }

    const env = loadEnv();
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new ServiceUnavailableException('Sign-in with a mobile number is not configured on this server');
    }
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      this.fail(key);
      if (error?.message?.toLowerCase().includes('not confirmed')) {
        throw new UnauthorizedException('Verify your email address first. Check your inbox for the code.');
      }
      throw new UnauthorizedException(GENERIC);
    }
    this.attempts.delete(key);
    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    };
  }

  private async resolveEmail(identifier: string): Promise<string | null> {
    const value = identifier.trim();
    if (value.includes('@')) return value.toLowerCase();
    const phone = normalizeSriLankanPhone(value);
    if (phone) {
      const user = await this.prisma.user.findFirst({
        where: { phone, phoneVerifiedAt: { not: null }, userType: 'CUSTOMER', status: 'ACTIVE' },
        select: { email: true },
      });
      if (user?.email) return user.email;
    }
    const username = normalizeUsername(value);
    if (username) {
      const profile = await this.prisma.customerProfile.findUnique({
        where: { username },
        select: { user: { select: { email: true, status: true } } },
      });
      if (profile?.user.email && profile.user.status === 'ACTIVE') return profile.user.email;
    }
    return null;
  }

  private throttle(key: string) {
    const entry = this.attempts.get(key);
    if (!entry) return;
    if (Date.now() - entry.since > WINDOW_MS) {
      this.attempts.delete(key);
      return;
    }
    if (entry.count >= MAX_ATTEMPTS) {
      throw new HttpException('Too many attempts. Wait 15 minutes or reset your password.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private fail(key: string) {
    const entry = this.attempts.get(key);
    if (!entry || Date.now() - entry.since > WINDOW_MS) this.attempts.set(key, { count: 1, since: Date.now() });
    else entry.count += 1;
  }
}
