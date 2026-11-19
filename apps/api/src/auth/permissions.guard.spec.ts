import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { permissionsForRoles, type Role } from '@bossone/shared';
import { extractBearer } from './auth.guard';
import type { AuthUser } from './auth-user';
import { PERMISSIONS_KEY } from './decorators';
import { PermissionsGuard } from './permissions.guard';

function contextFor(user: AuthUser | undefined, required: string[] | undefined): ExecutionContext {
  const handler = () => undefined;
  if (required) Reflect.defineMetadata(PERMISSIONS_KEY, required, handler);
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function userWith(...roles: Role[]): AuthUser {
  return {
    id: 'u1',
    authUserId: 'a1',
    email: 'x@test',
    userType: roles.includes('CUSTOMER') ? 'CUSTOMER' : 'STAFF',
    roles,
    permissions: permissionsForRoles(roles),
  };
}

describe('PermissionsGuard', () => {
  const guard = new PermissionsGuard(new Reflector());

  it('allows routes without required permissions', () => {
    expect(guard.canActivate(contextFor(userWith('CUSTOMER'), undefined))).toBe(true);
  });

  it('allows a Stock Manager to create products', () => {
    expect(guard.canActivate(contextFor(userWith('STOCK_MANAGER'), ['products.create']))).toBe(true);
  });

  it('blocks a Stock Manager from approving products', () => {
    expect(() =>
      guard.canActivate(contextFor(userWith('STOCK_MANAGER'), ['products.approve'])),
    ).toThrow(ForbiddenException);
  });

  it('blocks a customer from staff routes', () => {
    expect(() =>
      guard.canActivate(contextFor(userWith('CUSTOMER'), ['products.read_all'])),
    ).toThrow(ForbiddenException);
  });

  it('only lets the Accountant set prices', () => {
    expect(guard.canActivate(contextFor(userWith('ACCOUNTANT'), ['pricing.manage']))).toBe(true);
    expect(() =>
      guard.canActivate(contextFor(userWith('OWNER_ADMIN'), ['pricing.manage'])),
    ).toThrow(ForbiddenException);
  });

  it('blocks anonymous users on protected routes', () => {
    expect(() => guard.canActivate(contextFor(undefined, ['products.read_all']))).toThrow(
      ForbiddenException,
    );
  });
});

describe('extractBearer', () => {
  it('reads a bearer token', () => {
    expect(extractBearer('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(extractBearer('bearer abc')).toBe('abc');
  });

  it('rejects other formats', () => {
    expect(extractBearer(undefined)).toBeNull();
    expect(extractBearer('Basic abc')).toBeNull();
    expect(extractBearer('Bearer')).toBeNull();
  });
});
