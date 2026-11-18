/**
 * Application roles. These must match the `RoleCode` enum in apps/api/prisma/schema.prisma.
 *
 * QUALITY_CONTROLLER is a separate role from STOCK_MANAGER. The same person must not
 * prepare and QC-pass the same order (enforced in the QC module when it is built).
 */
export const ROLES = [
  'CUSTOMER',
  'SERVICE_MANAGER',
  'STOCK_MANAGER',
  'QUALITY_CONTROLLER',
  'DELIVERER',
  'ACCOUNTANT',
  'OWNER_ADMIN',
] as const;

export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: readonly Role[] = ROLES.filter((r) => r !== 'CUSTOMER');

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: 'Customer',
  SERVICE_MANAGER: 'Service Manager',
  STOCK_MANAGER: 'Stock Manager',
  QUALITY_CONTROLLER: 'Quality Controller',
  DELIVERER: 'Deliverer',
  ACCOUNTANT: 'Accountant',
  OWNER_ADMIN: 'Owner / Admin',
};

export function isStaffRole(role: Role): boolean {
  return role !== 'CUSTOMER';
}
