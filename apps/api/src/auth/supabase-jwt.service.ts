import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { loadEnv } from '../config/env';
import type { SupabaseClaims } from './auth-user';

/**
 * Verifies Supabase Auth access tokens.
 *
 * - Asymmetric tokens (RS256/ES256, Supabase "JWT signing keys") are verified against the
 *   project's public JWKS endpoint. No secret is needed. This is the recommended setup for cloud projects.
 * - HS256 tokens (legacy shared secret, still the default on some local CLI versions) are verified
 *   with SUPABASE_JWT_SECRET.
 */
@Injectable()
export class SupabaseJwtService {
  private readonly logger = new Logger(SupabaseJwtService.name);
  private readonly issuer: string;
  private readonly jwks: JWTVerifyGetKey;
  private readonly hsSecret?: Uint8Array;

  constructor() {
    const env = loadEnv();
    this.issuer = `${env.SUPABASE_URL}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
    if (env.SUPABASE_JWT_SECRET) {
      this.hsSecret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
    }
  }

  async verify(token: string): Promise<SupabaseClaims> {
    let alg: string | undefined;
    try {
      alg = decodeProtectedHeader(token).alg;
    } catch {
      throw new UnauthorizedException('Malformed access token');
    }

    const options = { issuer: this.issuer, audience: 'authenticated' };
    try {
      if (alg === 'HS256') {
        if (!this.hsSecret) {
          throw new UnauthorizedException(
            'HS256 token received but SUPABASE_JWT_SECRET is not configured',
          );
        }
        const { payload } = await jwtVerify(token, this.hsSecret, options);
        return payload as unknown as SupabaseClaims;
      }
      const { payload } = await jwtVerify(token, this.jwks, options);
      return payload as unknown as SupabaseClaims;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.debug(`Token rejected: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
