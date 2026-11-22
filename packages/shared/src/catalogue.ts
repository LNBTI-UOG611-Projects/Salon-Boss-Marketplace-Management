import type { PriceTierDto, ProductDto, ProductVariantDto } from './products';

/* ================= Pricing ================= */

/** LKR amounts are passed around as decimal strings ("14200.00") and converted only for display/maths. */
export function toAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
}

/** "LKR 14,200" (no decimals when whole, like the designs). */
export function formatLkr(value: string | number | null | undefined, prefix: 'LKR' | 'Rs.' = 'LKR'): string {
  const n = toAmount(value);
  const hasCents = Math.round(n * 100) % 100 !== 0;
  return `${prefix} ${n.toLocaleString('en-LK', { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })}`;
}

/** Tiers sorted by minQty, lowest first. */
export function sortedTiers(tiers: readonly PriceTierDto[]): PriceTierDto[] {
  return [...tiers].sort((a, b) => a.minQty - b.minQty);
}

/**
 * Unit price for a quantity: the best tier whose minQty <= quantity, otherwise the base price.
 * A tier is only used if it is cheaper than the base price.
 */
export function unitPriceFor(basePrice: string | number, tiers: readonly PriceTierDto[], quantity: number): number {
  const base = toAmount(basePrice);
  let price = base;
  for (const t of sortedTiers(tiers)) {
    if (quantity >= t.minQty && toAmount(t.unitPrice) < price) price = toAmount(t.unitPrice);
  }
  return price;
}

export function lineTotal(basePrice: string | number, tiers: readonly PriceTierDto[], quantity: number): number {
  return Math.round(unitPriceFor(basePrice, tiers, quantity) * quantity * 100) / 100;
}

/** Whole-number discount of a tier against the base price, e.g. 5 for "5% Off". */
export function discountPercent(basePrice: string | number, tierPrice: string | number): number {
  const base = toAmount(basePrice);
  if (base <= 0) return 0;
  return Math.round(((base - toAmount(tierPrice)) / base) * 100);
}

/** The first (best-known) volume tier, used on cards. */
export function firstTier(variant: Pick<ProductVariantDto, 'tiers'>): PriceTierDto | null {
  return sortedTiers(variant.tiers)[0] ?? null;
}

/** Quantity range before the first tier, e.g. "1–2 units" when MOQ 1 and tier at 3. */
export function baseRangeLabel(moq: number, tier: PriceTierDto | null): string {
  if (!tier || tier.minQty - 1 <= moq) return tier ? `${moq} unit${moq === 1 ? '' : 's'}` : `From ${moq}`;
  return `${moq}–${tier.minQty - 1} units`;
}

/**
 * Wholesale quantity rules (all counted in sale units: single items, or packs when unitsPerPack is set).
 * - MOQ 0 means "no minimum" — it never means out of stock.
 * - The order increment is the step between allowed quantities (e.g. 6 = 6, 12, 18 ...).
 *   Allowed quantities start at the MOQ (or at one increment when there is no MOQ).
 */
export function minimumQuantity(moq: number, increment = 1): number {
  const step = Math.max(1, Math.floor(increment || 1));
  return moq > 0 ? moq : step;
}

export function orderStep(increment: number | null | undefined): number {
  return Math.max(1, Math.floor(increment || 1));
}

/** True when the quantity sits on the MOQ + increment ladder. */
export function onQuantityStep(quantity: number, moq: number, increment = 1): boolean {
  const min = minimumQuantity(moq, increment);
  return quantity >= min && (quantity - min) % orderStep(increment) === 0;
}

/** Nearest allowed quantity at or above the one given. */
export function roundUpToStep(quantity: number, moq: number, increment = 1): number {
  const min = minimumQuantity(moq, increment);
  if (!Number.isFinite(quantity) || quantity <= min) return min;
  const step = orderStep(increment);
  return min + Math.ceil((Math.floor(quantity) - min) / step) * step;
}

/** Largest allowed quantity that the available stock covers (0 when even the minimum is not covered). */
export function maxOrderable(available: number, moq: number, increment = 1): number {
  const min = minimumQuantity(moq, increment);
  if (available < min) return 0;
  const step = orderStep(increment);
  return min + Math.floor((available - min) / step) * step;
}

/** One stepper press: moves along the ladder, never below the minimum. */
export function stepQuantity(quantity: number, direction: 1 | -1, moq: number, increment = 1): number {
  const min = minimumQuantity(moq, increment);
  const step = orderStep(increment);
  const base = onQuantityStep(quantity, moq, increment) ? quantity : roundUpToStep(quantity, moq, increment) - (direction > 0 ? step : 0);
  return Math.max(min, base + direction * step);
}

/** Quantity is valid when it is a whole number on the MOQ/increment ladder and within the available stock. */
export function quantityProblem(quantity: number, moq: number, available: number, increment = 1): string | null {
  if (!Number.isInteger(quantity) || quantity < 1) return 'Enter a whole number';
  const min = minimumQuantity(moq, increment);
  if (moq > 0 && quantity < moq) return `Minimum order is ${moq} unit${moq === 1 ? '' : 's'}`;
  const step = orderStep(increment);
  if (!onQuantityStep(quantity, moq, increment)) {
    return moq > 0 && step > 1 ? `Order ${moq}, then steps of ${step}` : `Order in steps of ${step}`;
  }
  if (quantity > available) return available >= min ? `Only ${available} available` : 'Out of stock';
  return null;
}

/** The variant shown on product cards: the first priced, active one. */
export function primaryVariant(product: Pick<ProductDto, 'variants'>): ProductVariantDto | null {
  return product.variants.find((v) => v.price !== null) ?? product.variants[0] ?? null;
}

/* ================= Listing filters ================= */

export const PRODUCT_SORTS = [
  { value: 'featured', label: 'Featured Salon Picks' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'moq_asc', label: 'Lowest MOQ First' },
  { value: 'newest', label: 'Newest Arrival' },
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number]['value'];

/** Price brackets in LKR. `max` is exclusive. */
export const PRICE_BRACKETS = [
  { value: 'under_10k', label: 'Under LKR 10,000', min: 0, max: 10_000 },
  { value: '10k_25k', label: 'LKR 10,000 - 25,000', min: 10_000, max: 25_000 },
  { value: '25k_50k', label: 'LKR 25,000 - 50,000', min: 25_000, max: 50_000 },
  { value: '50k_200k', label: 'LKR 50,000 - 200,000', min: 50_000, max: 200_000 },
  { value: 'over_200k', label: 'LKR 200,000+', min: 200_000, max: null },
] as const;
export type PriceBracket = (typeof PRICE_BRACKETS)[number]['value'];

export interface ProductQuery {
  q?: string;
  category?: string; // category slug (includes its subcategories)
  brand?: string; // brand slug
  price?: PriceBracket;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

/* ================= Catalogue DTOs ================= */

export interface CategorySummaryDto {
  id: string;
  name: string;
  slug: string;
  groupName: string | null;
  icon: string | null;
  shortDescription: string | null;
  description: string | null;
  badge: string | null;
  imageUrl: string | null;
  /** Active, priced products in this category and its subcategories. */
  productCount: number;
  /** Top brands by product count, e.g. ["L'Oréal Professionnel", "Goldwell"]. */
  topBrands: string[];
}

export interface CategoryDetailDto extends CategorySummaryDto {
  parent: { name: string; slug: string } | null;
  subcategories: { name: string; slug: string; icon: string | null; productCount: number }[];
  /** Brands that have products in this category (for the brand filter). */
  brands: { name: string; slug: string; productCount: number }[];
}

export interface BrandSummaryDto {
  id: string;
  name: string;
  slug: string;
  monogram: string;
  wordmark: string;
  wordmarkSub: string;
  specialty: string | null;
  cardTag: string | null;
  tagline: string | null;
  description: string | null;
  featureTags: string[];
  tileStyle: 'DARK' | 'NAVY' | 'LIGHT';
  featured: boolean;
  productCount: number;
  /** Official logo (public URL) when uploaded; otherwise show the wordmark. */
  logoUrl: string | null;
  /** First partner badge, e.g. "Authorised Importer". */
  partnerBadge: string | null;
  /** Top-level categories this brand has products in, e.g. ["Hair Care", "Hair Styling"]. */
  categories: string[];
}

export interface BrandDetailDto extends BrandSummaryDto {
  highlights: string[];
  partnerBadges: string[];
  specSheetUrl: string | null;
  specSheetNote: string | null;
}

export interface BrandListDto {
  items: BrandSummaryDto[];
  /** First letters that have at least one brand, e.g. ["A","B","G"]. */
  letters: string[];
  /** Brand specialties for the category chips. */
  specialties: string[];
  /** Top-level categories with how many brands sell in each (Explore Brands chips). */
  categories: { name: string; slug: string; icon: string | null; brandCount: number }[];
  total: number;
}

export interface HomeDto {
  categories: CategorySummaryDto[];
  featuredBrands: BrandSummaryDto[];
  featuredProducts: ProductDto[];
  /** Newest approved, priced products. */
  newArrivals: ProductDto[];
  /** Live counts for the home banner: products customers can buy and brands that have them. */
  stats?: { products: number; brands: number };
}

/* ================= Cart & wishlist DTOs ================= */

export interface CartLineDto {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  problem: string | null;
  product: { id: string; name: string; brandName: string | null; imageUrl: string | null };
  variant: Pick<ProductVariantDto, 'id' | 'sku' | 'name' | 'price' | 'moq' | 'orderIncrement' | 'available' | 'packLabel' | 'unitsPerPack' | 'tiers'>;
}

export interface CartDto {
  items: CartLineDto[];
  /** Number of lines (shown on the cart badge). */
  count: number;
  units: number;
  subtotal: string;
  /** False when any line has a problem (MOQ, stock, unavailable). */
  ready: boolean;
}

export interface WishlistDto {
  productIds: string[];
  items: ProductDto[];
}

/* ================= Helpers ================= */

/** "Takara Belmont" -> "TB", "Gamma+ Scientific" -> "G+". */
export function brandMonogram(name: string): string {
  const words = name.replace(/['’]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const first = words[0];
  if (/\+$/.test(first)) return (first[0] + '+').toUpperCase();
  return (first[0] + words[1][0]).toUpperCase();
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** First letter for the A–Z brand filter (accents removed). */
export function brandLetter(name: string): string {
  return slugify(name).charAt(0).toUpperCase();
}

/** One saved product on the My Wishlist page (H17). */
export interface WishlistEntryDto {
  product: ProductDto;
  addedAt: string;
  /** Price of the main variant when it was saved; null for items saved before prices were recorded. */
  savedPrice: string | null;
  priceChanged: 'up' | 'down' | null;
  /** Approved, priced and in stock for the minimum order. */
  available: boolean;
  /** The customer asked to be told when it is back in stock. */
  notifyRestock: boolean;
}

export interface WishlistPageDto {
  items: WishlistEntryDto[];
}

/** Product comparison (H16). */
export const MAX_COMPARE = 3;
