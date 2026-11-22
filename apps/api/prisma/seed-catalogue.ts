/**
 * Catalogue seed: the client's real brands and products (from docs/data/stock-report-by-brand.xlsx, converted
 * by prisma/tools/import_stock_report.py into catalogue-data.ts).
 *
 * Stock quantities are real. PRICES ARE DUMMY VALUES and product pictures are generated samples until the
 * client sends the price list and photos. Category photos are in prisma/seed-assets.
 */
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { ProductStatus } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BRANDS, PRODUCTS } from './catalogue-data';

export { BRANDS, PRODUCTS };

const ASSETS = join(__dirname, 'seed-assets');
const BUCKET = 'product-images';
const CONTENT_TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

type TileStyle = 'DARK' | 'NAVY' | 'LIGHT';

export interface SeedBrand {
  name: string; slug: string; wordmark?: string; wordmarkSub?: string; cardTag?: string; specialty: string;
  tagline?: string; description: string; featureTags: string[]; tileStyle: TileStyle; featured?: boolean;
  highlights?: string[]; partnerBadges?: string[];
}

/**
 * Brands, categories and products from earlier sample catalogues. Re-running the seed deletes them from
 * existing development databases.
 */
export const RETIRED = {
  brands: [
    'takara-belmont', 'parlux-professional', 'veloce-milano', 'babylisspro', 'dermashield-clinical', 'gamma-plus-scientific',
    'maletti-architecture', 'wahl-professional', 'opi-pro-spa',
    // Demo brands used before the client's real catalogue arrived
    'loreal-professionnel', 'kerastase-paris', 'wella-professionals', 'olaplex-pro', 'schwarzkopf-professional',
    'moroccanoil', 'fanola-professional', 'goldwell', 'opi-professional', 'dermalogica', 'olivia-garden-pro',
  ],
  categories: ['salon-equipment', 'bleach-peroxides', 'conditioners-masks', 'shampoos-backbar', 'scalp-serums', 'nail-care'],
  skus: [
    'VM-BW-100', 'PX-DR-2250', 'BP-CL-FX', 'VM-BW-JP', 'VM-SL-NERO', 'VM-SC-MOD', 'VM-RC-BEL', 'VM-PD-JET', 'VM-AC-NR',
    'VM-SP-MIX', 'VM-ST-GOLD', 'TOOL-100',
    'LP-MD-BB15', 'LP-MD-SH15', 'KP-FD-VC10', 'SP-BM-450', 'GW-DS-1000', 'WP-KP-DV20', 'OL-N2-2000', 'FN-NY-1000', 'KP-CH-500',
  ],
};

export const CATEGORIES: {
  slug: string; name: string; group: string; icon: string; short: string; description: string; badge: string; image: string;
  children?: { slug: string; name: string; icon: string; short: string }[];
}[] = [
  { slug: 'hair-care', name: 'Hair Care', group: 'Hair', icon: 'water_drop', short: 'Shampoos, Treatments & Oils', badge: 'Backbar & Retail', image: 'category-hair-care.jpg',
    description: 'Salon shampoos, conditioners, hair masks and treatments, straightening products, hair oils and tonics.',
    children: [
      { slug: 'shampoos', name: 'Shampoos', icon: 'sanitizer', short: 'Salon and backbar shampoos' },
      { slug: 'conditioners', name: 'Conditioners', icon: 'spa', short: 'Rinse-off, leave-on & detangling' },
      { slug: 'treatments-masks', name: 'Treatments & Masks', icon: 'science', short: 'Masks, keratin, protein & spa cream' },
      { slug: 'perm-straightening', name: 'Straightening & Perming', icon: 'waves', short: 'Straighteners, neutralizers & keratin' },
      { slug: 'oils-tonics', name: 'Oils, Tonics & Colognes', icon: 'vital_signs', short: 'Hair oils, tonics and colognes' },
    ] },
  { slug: 'hair-styling', name: 'Hair Styling', group: 'Hair', icon: 'content_cut', short: 'Sprays, Gels, Waxes & Mousse', badge: 'Finishing', image: 'category-hair-styling-salon.jpg',
    description: 'Hair sprays, gels, waxes, mousses and hair fibres for finishing salon services.',
    children: [
      { slug: 'styling-products', name: 'Styling Products', icon: 'brush', short: 'Sprays, gels, waxes, mousse' },
    ] },
  { slug: 'hair-color-technical', name: 'Hair Colour & Technical', group: 'Hair', icon: 'face', short: 'Colour, Developers & Bleach', badge: 'Colour Room', image: 'category-hair-color.jpg',
    description: 'Hair colour creams and boosters, developers and bleaching powders for the salon colour room.',
    children: [
      { slug: 'hair-colour', name: 'Hair Colour', icon: 'face', short: 'Colour creams, shades & boosters' },
      { slug: 'developers', name: 'Developers', icon: 'science', short: 'Oxidants 3%, 6%, 9%, 12%' },
      { slug: 'bleach-lighteners', name: 'Bleach & Lighteners', icon: 'bolt', short: 'Bleaching powders' },
    ] },
  { slug: 'skin-care', name: 'Skin Care', group: 'Skin & Grooming', icon: 'spa', short: 'Facials, Scrubs & Waxing', badge: 'Beauty Room', image: 'category-skin-care.jpg',
    description: 'Facial cleansers, scrubs, packs, toners, massage creams and waxing products for beauty services.' },
  { slug: 'barber-shaving', name: 'Barber & Shaving', group: 'Skin & Grooming', icon: 'content_cut', short: 'Shaving, Blades & After Shave', badge: 'Barber Station', image: 'blackfx-cordless-clipper.jpg',
    description: 'Shaving gel and foam, blades, razors, after shave, talc and clipper oil for barbers.' },
  { slug: 'accessories', name: 'Salon Supplies', group: 'Tools', icon: 'inventory_2', short: 'Foil, Gloves, Capes & Brushes', badge: 'Everyday Supplies', image: 'category-accessories.jpg',
    description: 'Foil, gloves, neck rolls, capes, towels, combs, brushes, clips, colour bowls and other daily salon supplies.' },
  { slug: 'electrical-tools', name: 'Salon Electricals', group: 'Tools', icon: 'bolt', short: 'Dryers, Irons & Trimmers', badge: 'Electrical', image: 'category-hair-styling.jpg',
    description: 'Hair dryers, straightening irons, curlers, trimmers and steamers for the salon floor.' },
];

export interface SeedProduct {
  /** brand slug; missing for salon supplies and items whose brand still needs confirming */
  sku: string; name: string; sourceName?: string; brand?: string; category: string; summary: string; image: string;
  price: number; moq: number; increment?: number; available: number; pack?: string; unitsPerPack?: number; typeLabel?: string; dispatchNote?: string;
  restockNote?: string; featured?: boolean; tiers?: { minQty: number; unitPrice: number; label?: string }[];
}

/** Deletes sample rows that are no longer part of the catalogue (see RETIRED). Safe to run repeatedly. */
async function retireRemovedSampleData(prisma: PrismaClient) {
  const products = await prisma.product.deleteMany({ where: { sku: { in: RETIRED.skus } } });
  // A retired brand or category is only deleted when nothing else still uses it.
  let brands = 0;
  for (const slug of RETIRED.brands) {
    const brand = await prisma.brand.findUnique({ where: { slug }, include: { _count: { select: { products: true } } } });
    if (brand && brand._count.products === 0) {
      await prisma.brand.delete({ where: { id: brand.id } });
      brands++;
    }
  }
  let categories = 0;
  for (const slug of RETIRED.categories) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (category && category._count.products === 0 && category._count.children === 0) {
      await prisma.category.delete({ where: { id: category.id } });
      categories++;
    }
  }
  if (products.count || brands || categories) {
    console.log(`  Removed old sample data: ${products.count} products, ${brands} brands, ${categories} categories`);
  }
}

async function upload(supabase: SupabaseClient | null, file: string): Promise<string> {
  const path = `seed/${file}`;
  if (!supabase) return path; // without a service key the image row is created but the file is missing
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, readFileSync(join(ASSETS, file)), { contentType: CONTENT_TYPES[extname(file).toLowerCase()] ?? 'image/jpeg', upsert: true });
  if (error) throw new Error(`Upload ${file} failed: ${error.message}`);
  return path;
}

export async function seedCatalogue(
  prisma: PrismaClient,
  supabase: SupabaseClient | null,
  ids: { ownerId: string; stockManagerId: string; accountantId: string },
) {
  // Remove retired sample products first (their brands and categories go once they are empty)
  await retireRemovedSampleData(prisma);

  // Brands
  const brandIds = new Map<string, string>();
  for (const [i, b] of BRANDS.entries()) {
    const data = {
      name: b.name, wordmark: b.wordmark ?? null, wordmarkSub: b.wordmarkSub ?? null, cardTag: b.cardTag ?? null,
      specialty: b.specialty, tagline: b.tagline ?? null, description: b.description, featureTags: b.featureTags,
      tileStyle: b.tileStyle, featured: !!b.featured, sortOrder: i, highlights: b.highlights ?? [], partnerBadges: b.partnerBadges ?? [],
    };
    const row = await prisma.brand.upsert({ where: { slug: b.slug }, update: data, create: { slug: b.slug, ...data } });
    brandIds.set(b.slug, row.id);
  }

  // Categories (+ subcategories). Customers see professional hair products only; other
  // categories stay in the database for staff but hidden from the storefront.
  const isHairGroup = (group: string) => group === 'Hair';
  const categoryIds = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const imagePath = await upload(supabase, c.image);
    const data = { name: c.name, groupName: c.group, icon: c.icon, shortDescription: c.short, description: c.description, badge: c.badge, imagePath, sortOrder: i, parentId: null, customerVisible: isHairGroup(c.group) };
    const row = await prisma.category.upsert({ where: { slug: c.slug }, update: data, create: { slug: c.slug, ...data } });
    categoryIds.set(c.slug, row.id);
    for (const [j, child] of (c.children ?? []).entries()) {
      const childData = { name: child.name, icon: child.icon, shortDescription: child.short, sortOrder: j, parentId: row.id, groupName: c.group, customerVisible: isHairGroup(c.group) };
      const sub = await prisma.category.upsert({ where: { slug: child.slug }, update: childData, create: { slug: child.slug, ...childData } });
      categoryIds.set(child.slug, sub.id);
    }
  }

  // Products (skipped if the SKU already exists, so re-running the seed is safe)
  let created = 0;
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (existing && supabase) {
      await upload(supabase, p.image);
    }

    if (existing) {
      // Keep products in step with the catalogue (name clean-up, category, brand, featured flag).
      await prisma.product.update({
        where: { id: existing.id },
        data: { name: p.name, categoryId: categoryIds.get(p.category)!, brandId: p.brand ? brandIds.get(p.brand)! : null, featured: !!p.featured },
      });
      continue;
    }
    const imagePath = await upload(supabase, p.image);
    await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        summary: p.summary,
        typeLabel: p.typeLabel,
        dispatchNote: p.dispatchNote,
        featured: !!p.featured,
        listPrice: p.price,
        minMoq: p.moq,
        inStock: p.available > 0,
        status: ProductStatus.ACTIVE,
        brandId: p.brand ? brandIds.get(p.brand)! : null,
        categoryId: categoryIds.get(p.category)!,
        createdById: ids.stockManagerId,
        reviewedById: ids.ownerId,
        reviewedAt: new Date(),
        images: { create: [{ storagePath: imagePath, sortOrder: 0 }] },
        variants: {
          create: [{
            sku: `${p.sku}-STD`,
            name: p.pack ?? 'Standard',
            price: p.price,
            moq: p.moq,
            orderIncrement: p.increment ?? 1,
            packLabel: p.pack,
            unitsPerPack: p.unitsPerPack ?? null,
            availableQty: p.available,
            restockNote: p.restockNote,
            priceTiers: { create: (p.tiers ?? []).map((t) => ({ minQty: t.minQty, unitPrice: t.unitPrice, label: t.label })) },
            priceHistory: { create: [{ newPrice: p.price, changedById: ids.accountantId, reason: 'Dummy price (seed) – replace with the client price list' }] },
          }],
        },
      },
    });
    created++;
  }

  // Two products in the approval workflow (not visible to customers), used in the README walkthrough.
  const workflow = [
    { sku: 'STYLE-100', name: 'Strong Hold Finishing Spray 500ml', status: ProductStatus.PENDING_APPROVAL, brand: 'la-fresh', category: 'styling-products' },
    { sku: 'SKIN-020', name: 'Facial Cleansing Gel', status: ProductStatus.DRAFT, brand: 'evon', category: 'skin-care' },
  ];
  for (const w of workflow) {
    const found = await prisma.product.findUnique({ where: { sku: w.sku } });
    if (found) {
      await prisma.product.update({ where: { id: found.id }, data: { brandId: brandIds.get(w.brand)!, categoryId: categoryIds.get(w.category)! } });
      continue;
    }
    await prisma.product.create({
      data: {
        sku: w.sku, name: w.name, status: w.status, brandId: brandIds.get(w.brand)!, categoryId: categoryIds.get(w.category)!,
        createdById: ids.stockManagerId,
        variants: { create: [{ sku: `${w.sku}-1`, name: 'Standard', moq: 1, availableQty: 10 }] },
      },
    });
  }

  // Categories emptied by the move (e.g. the old "Conditioners & Masks") can now be removed.
  await retireRemovedSampleData(prisma);

  // Opening stock: products from the stock report get their physical quantity in the inventory
  // module, with a ledger entry saying where it came from. Products that already have an inventory
  // record are left alone, so re-running the seed never overwrites counted stock.
  const untracked = await prisma.productVariant.findMany({
    where: { inventory: null, product: { sku: { in: PRODUCTS.map((p) => p.sku) } } },
    select: { id: true, availableQty: true },
  });
  for (const v of untracked) {
    await prisma.$transaction([
      prisma.inventoryLevel.create({ data: { variantId: v.id, physicalQty: v.availableQty } }),
      prisma.stockMovement.create({
        data: { variantId: v.id, kind: 'RECEIVED', physicalDelta: v.availableQty, reason: 'Opening balance from the stock report (docs/data/stock-report-by-brand.xlsx)', actorId: ids.stockManagerId },
      }),
    ]);
  }
  if (untracked.length) console.log(`  opening stock recorded for ${untracked.length} products`);

  console.log(`  ${BRANDS.length} brands, ${categoryIds.size} categories, ${created} new products${supabase ? '' : ' (images NOT uploaded: set SUPABASE_SERVICE_ROLE_KEY)'}`);
}
