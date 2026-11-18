import { ForbiddenException, Injectable } from '@nestjs/common';
import { permissionsForRoles, type Role } from '@bossone/shared';
import { Prisma, RoleCode, UserStatus, UserType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser, SupabaseClaims } from './auth-user';

const withRoles = { roles: true } satisfies Prisma.UserInclude;
type UserWithRoles = Prisma.UserGetPayload<{ include: typeof withRoles }>;

/**
 * Turns a verified Supabase identity into an application user.
 *
 * Rules (security review item "staff sign-in"):
 * 1. Known Supabase account -> that user.
 * 2. Unknown account whose email matches a staff record the Owner/Admin created -> link and continue.
 * 3. Unknown account that signed in with Google -> REJECTED. Google sign-in is for authorized staff only.
 * 4. Unknown account that signed up with email/phone -> new CUSTOMER.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(claims: SupabaseClaims): Promise<AuthUser> {
    let user = await this.prisma.user.findUnique({
      where: { authUserId: claims.sub },
      include: withRoles,
    });

    if (!user) {
      user = await this.linkOrCreate(claims);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account has been deactivated');
    }

    const roles = user.roles.map((r) => r.role as Role);
    return {
      id: user.id,
      authUserId: claims.sub,
      email: user.email,
      userType: user.userType,
      roles,
      permissions: permissionsForRoles(roles),
    };
  }

  private async linkOrCreate(claims: SupabaseClaims): Promise<UserWithRoles> {
    const email = claims.email?.toLowerCase() || null;

    if (email) {
      const staff = await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' }, authUserId: null },
        include: withRoles,
      });
      if (staff) {
        return this.prisma.user.update({
          where: { id: staff.id },
          data: { authUserId: claims.sub },
          include: withRoles,
        });
      }
    }

    const provider = claims.app_metadata?.provider;
    if (provider === 'google') {
      throw new ForbiddenException(
        'This Google account is not an authorized BOSSONE.LK staff account. Ask the Owner/Admin to add you.',
      );
    }

    try {
      return await this.prisma.user.create({
        data: {
          authUserId: claims.sub,
          email,
          phone: claims.phone || null,
          fullName: claims.user_metadata?.full_name ?? claims.user_metadata?.name ?? null,
          userType: UserType.CUSTOMER,
          roles: { create: { role: RoleCode.CUSTOMER } },
        },
        include: withRoles,
      });
    } catch (err) {
      // Two parallel first requests from the same new user: the other one won, use its record.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing = await this.prisma.user.findUnique({
          where: { authUserId: claims.sub },
          include: withRoles,
        });
        if (existing) return existing;
        throw new ForbiddenException('An account with this email or phone already exists');
      }
      throw err;
    }
  }
}
