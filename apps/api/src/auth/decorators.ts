import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Permission } from '@bossone/shared';
import type { AuthUser } from './auth-user';

export const IS_PUBLIC_KEY = 'isPublic';
export const PERMISSIONS_KEY = 'requiredPermissions';

/** Route can be called without logging in. If a valid token is sent, req.user is still set. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** The signed-in user must hold ALL of these permissions (see packages/shared/src/permissions.ts). */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Injects the signed-in user into a controller method. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    return ctx.switchToHttp().getRequest().user;
  },
);
