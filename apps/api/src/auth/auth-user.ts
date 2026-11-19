import type { Permission, Role, UserType } from '@bossone/shared';

/** The signed-in application user, attached to every authenticated request as `req.user`. */
export interface AuthUser {
  id: string;
  authUserId: string;
  email: string | null;
  userType: UserType;
  roles: Role[];
  permissions: Set<Permission>;
}

/** The verified Supabase access-token claims we rely on. */
export interface SupabaseClaims {
  sub: string;
  email?: string;
  phone?: string;
  role?: string;
  app_metadata?: { provider?: string; providers?: string[] };
  user_metadata?: { full_name?: string; name?: string };
}
