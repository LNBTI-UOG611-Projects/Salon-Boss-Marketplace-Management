/** Must match the `ProductStatus` enum in apps/api/prisma/schema.prisma. */
export const PRODUCT_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'REJECTED',
  'DISCONTINUED',
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export type ProductAction = 'submit' | 'approve' | 'reject' | 'discontinue' | 'edit';

/**
 * Product lifecycle (Workflow 02):
 * Stock Manager creates DRAFT -> submits -> Owner/Admin approves or rejects.
 * Rejected products can be edited and resubmitted. Discontinued products are archived, never deleted.
 */
const TRANSITIONS: Record<Exclude<ProductAction, 'edit'>, { from: ProductStatus[]; to: ProductStatus }> = {
  submit: { from: ['DRAFT', 'REJECTED'], to: 'PENDING_APPROVAL' },
  approve: { from: ['PENDING_APPROVAL'], to: 'ACTIVE' },
  reject: { from: ['PENDING_APPROVAL'], to: 'REJECTED' },
  discontinue: { from: ['ACTIVE', 'DRAFT', 'REJECTED'], to: 'DISCONTINUED' },
};

/** Statuses in which the product details may still be edited by the Stock Manager. */
export const EDITABLE_PRODUCT_STATUSES: readonly ProductStatus[] = ['DRAFT', 'REJECTED'];

export function nextProductStatus(
  current: ProductStatus,
  action: Exclude<ProductAction, 'edit'>,
): ProductStatus | null {
  const rule = TRANSITIONS[action];
  return rule.from.includes(current) ? rule.to : null;
}

export function canEditProduct(status: ProductStatus): boolean {
  return EDITABLE_PRODUCT_STATUSES.includes(status);
}

/* ---------- API contract types (what the API returns) ---------- */

export interface PriceTierDto {
  minQty: number;
  /** LKR per unit from minQty, decimal string e.g. "228000.00". */
  unitPrice: string;
  label: string | null;
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  name: string;
  /** Base selling price in LKR as a decimal string, e.g. "1250.00". Null until the Accountant sets it. */
  price: string | null;
  attributes: Record<string, string>;
  /** Minimum order quantity, in sale units (packs when unitsPerPack is set). 0 = no minimum. */
  moq: number;
  /** Allowed quantities go up in these steps from the MOQ (1 = any quantity). */
  orderIncrement: number;
  /** Size or pack description, e.g. "1500ml Backbar", "10 x 12ml Box". */
  packLabel: string | null;
  /** Units inside one pack when the variant is sold by the pack; null when sold per unit. */
  unitsPerPack: number | null;
  /** Customer-facing available quantity. */
  available: number;
  inStock: boolean;
  restockNote: string | null;
  /** Volume tiers, lowest minQty first. */
  tiers: PriceTierDto[];
}

export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  summary: string | null;
  description: string | null;
  status: ProductStatus;
  typeLabel: string | null;
  dispatchNote: string | null;
  featured: boolean;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  imageUrls: string[];
  variants: ProductVariantDto[];
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/* ---------- Shop All filters (design H15) ---------- */

/** A variant with this many sale units or fewer left counts as "low stock". */
export const LOW_STOCK_QTY = 10;

export const STOCK_FILTERS = ['in', 'low', 'out'] as const;
export type StockFilter = (typeof STOCK_FILTERS)[number];

/** Counts for the Shop All sidebar. Each count applies every other active filter. */
export interface ProductFacetsDto {
  categories: { slug: string; name: string; icon: string | null; count: number }[];
  brands: { slug: string; name: string; count: number }[];
  stock: { all: number; in: number; low: number; out: number };
  /** Lowest and highest wholesale price in the whole catalogue (for the price inputs). */
  price: { min: number; max: number };
}
