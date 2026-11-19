import type { Role } from './roles';

/**
 * Fine-grained permissions. The backend checks permissions, never roles directly,
 * so a role's abilities can change in one place (ROLE_PERMISSIONS below).
 *
 * Add new permissions here as each module is built. Format: `<area>.<action>`.
 */
export const PERMISSIONS = [
  // Customer self-service (own profile, salons, addresses, verification uploads)
  'account.self',

  // Users and staff
  'users.read',
  'staff.manage',
  'audit.read',

  // Catalogue
  'products.read_all',
  'products.create',
  'products.update',
  'products.submit',
  'products.approve',
  'products.discontinue',

  // Pricing
  'pricing.manage',

  // Inventory (Member 02)
  'inventory.read',
  'inventory.adjust',
  'inventory.availability',

  // Customer verification (Member 01 / Owner / Accountant)
  'verification.review',

  // Support (Member 01)
  'support.handle',

  // Quality control
  'qc.inspect',

  // Delivery (Member 02)
  'delivery.read_assigned',
  'delivery.update',

  // Payments (Member 03)
  'payments.verify',
  'payments.reconcile',

  // Orders (Section C): see every order, cancel orders
  'orders.read',
  'orders.cancel',

  // Customer cancellation requests: approve (stock released) or reject
  'cancellations.decide',
  // Credit notes against orders (e.g. after a damage report)
  'credit_notes.issue',
  // Accountant: decide a customer return — the financial outcome and whether the goods come back
  'returns.decide',
  // Loyalty earning rule, level thresholds and benefits
  'loyalty.manage',
  // Order chat internal notes (never shown to customers)
  'orders.internal_notes',

  // Owner workspace (see packages/shared/src/owner.ts)
  // Business-wide oversight: dashboard, department workloads, risks, finance results
  'owner.oversight',
  // Wholesale settings: unit/pack price, pack size, MOQ override, order step, customer visibility
  'wholesale.manage',
  // Operating expenses (Owner and Accountant)
  'expenses.manage',
  // Stock locations (warehouses, store rooms)
  'locations.manage',
  // Approve, reject or return physical stock counts and proposed stock corrections
  'stock.decide',
  // Record a physical stock count, receive stock, mark damaged / quarantined (Stock Manager work)
  'stock.count',
  // Service Manager: write and submit banners and Help Centre articles
  'content.submit',
  // Owner: approve, reject, request changes and publish banners and Help Centre articles
  'content.review',
  // Record a business exception for oversight (any department)
  'exceptions.raise',
  // Decide on business exceptions that need the Owner
  'exceptions.decide',
  // Accountant: prepare and submit the daily financial closing
  'finance.close',
  // Create, assign, change and close staff and team goals
  'goals.manage',
  // See one's own assigned goals (every staff role)
  'goals.self',
  // Export audit records (Excel-compatible CSV / PDF)
  'audit.export',
  // System health monitoring (no secrets are ever shown)
  'system.health',
  // Owner: read every customer conversation (including internal notes) and reassign it
  'support.oversee',
  // Owner: suspend or reactivate customer accounts
  'customers.manage',
  // Record a deliverer violation for the Owner to decide (it carries no points until confirmed)
  'deliverers.report',
  // Owner: demerit rules, standing levels and decisions on violations and appeals
  'deliverers.discipline',
  // Deliverer: appeal a confirmed violation on their own record
  'demerits.appeal',
  // Owner: shop payment limits, delivery fee and operation targets
  'settings.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  CUSTOMER: ['account.self'],
  SERVICE_MANAGER: [
    'users.read',
    'support.handle',
    'orders.read',
    'orders.cancel',
    'orders.internal_notes',
    'content.submit',
    'exceptions.raise',
    'deliverers.report',
    'goals.self',
  ],
  STOCK_MANAGER: [
    'products.read_all',
    'products.create',
    'products.update',
    'products.submit',
    'products.discontinue',
    'inventory.read',
    'inventory.adjust',
    'orders.read',
    'stock.count',
    'exceptions.raise',
    'deliverers.report',
    'goals.self',
  ],
  QUALITY_CONTROLLER: ['products.read_all', 'qc.inspect', 'orders.read', 'exceptions.raise', 'deliverers.report', 'goals.self'],
  DELIVERER: ['delivery.read_assigned', 'delivery.update', 'orders.read', 'exceptions.raise', 'demerits.appeal', 'goals.self'],
  ACCOUNTANT: [
    'users.read',
    'products.read_all',
    'pricing.manage',
    'inventory.read',
    'inventory.availability',
    'verification.review',
    'payments.verify',
    'payments.reconcile',
    'orders.read',
    'cancellations.decide',
    'credit_notes.issue',
    'returns.decide',
    'orders.internal_notes',
    'finance.close',
    'expenses.manage',
    'exceptions.raise',
    'deliverers.report',
    'goals.self',
  ],
  /**
   * The Owner oversees, configures, reviews and decides. Daily department work (stock adjustments,
   * QC, delivery, payment verification, refunds, support replies, order cancellation) belongs to
   * the departments, so those permissions are deliberately not granted here.
   */
  OWNER_ADMIN: [
    'users.read',
    'staff.manage',
    'audit.read',
    'products.read_all',
    'products.approve',
    'products.discontinue',
    'inventory.read',
    'verification.review',
    'orders.read',
    'loyalty.manage',
    'orders.internal_notes',
    'owner.oversight',
    'wholesale.manage',
    'locations.manage',
    'stock.decide',
    'content.review',
    'exceptions.decide',
    'goals.manage',
    'audit.export',
    'system.health',
    'support.oversee',
    'customers.manage',
    'deliverers.report',
    'deliverers.discipline',
    'settings.manage',
    'expenses.manage',
  ],
};

/** Returns every permission granted by any of the given roles. */
export function permissionsForRoles(roles: readonly Role[]): Set<Permission> {
  const result = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      result.add(permission);
    }
  }
  return result;
}

export function hasPermissions(roles: readonly Role[], required: readonly Permission[]): boolean {
  const granted = permissionsForRoles(roles);
  return required.every((p) => granted.has(p));
}
