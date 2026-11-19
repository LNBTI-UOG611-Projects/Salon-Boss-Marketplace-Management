import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators';
import { SupabaseJwtService } from './supabase-jwt.service';
import { UsersService } from './users.service';

/**
 * Global guard: every route requires a valid Supabase access token unless marked @Public().
 * Never trust roles sent by the frontend - roles always come from our database.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: SupabaseJwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = extractBearer(request.headers?.authorization);

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const claims = await this.jwt.verify(token);
      request.user = await this.users.resolve(claims);
      return true;
    } catch (err) {
      // On public routes a bad token is ignored (treated as anonymous).
      if (isPublic) return true;
      throw err;
    }
  }
}

export function extractBearer(header: unknown): string | null {
  if (typeof header !== 'string') return null;
  const [scheme, value] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && value ? value : null;
}
