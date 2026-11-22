/**
 * Development seed data. Run with `pnpm db:seed` (after `pnpm db:migrate`).
 *
 * Creates:
 *  - one local test account per role, in both Supabase Auth and the users table
 *  - the catalogue from the client's stock report - see seed-catalogue.ts and docs/catalogue.md
 *  - sample salons, shopping preferences and two orders for customer@bossone.test
 *
 * Test accounts are created ONLY when SUPABASE_URL points at a local Supabase (127.0.0.1 / localhost).
 * Never run this against production with test passwords.
 */
import { PrismaClient, RoleCode, UserType, VerificationStatus } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { seedCatalogue } from './seed-catalogue';

const prisma = new PrismaClient();

/** Local test logins. Staff get employee numbers like the Owner's Staff & Accounts list shows. */
const TEST_ACCOUNTS: { email: string; fullName: string; role: RoleCode }[] = [
  { email: 'owner@bossone.test', fullName: 'Test Owner', role: RoleCode.OWNER_ADMIN },
  { email: 'accountant@bossone.test', fullName: 'Test Accountant', role: RoleCode.ACCOUNTANT },
  { email: 'stock@bossone.test', fullName: 'Test Stock Manager', role: RoleCode.STOCK_MANAGER },
  { email: 'qc@bossone.test', fullName: 'Test Quality Controller', role: RoleCode.QUALITY_CONTROLLER },
  { email: 'deliverer@bossone.test', fullName: 'Test Deliverer', role: RoleCode.DELIVERER },
  { email: 'service@bossone.test', fullName: 'Test Service Manager', role: RoleCode.SERVICE_MANAGER },
  { email: 'customer@bossone.test', fullName: 'Test Salon Customer', role: RoleCode.CUSTOMER },
];

function staffCode(account: { role: RoleCode }): string | null {
  const i = TEST_ACCOUNTS.filter((a) => a.role !== RoleCode.CUSTOMER).findIndex((a) => a.role === account.role);
  return i < 0 ? null : `EMP-${String(i + 1).padStart(3, '0')}`;
}

function isLocal(url: string | undefined): boolean {
  return !!url && /(127\.0\.0\.1|localhost)/.test(url);
}

async function ensureAuthUser(email: string, password: string): Promise<string | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) return created.data.user.id;

  // Already exists: look it up.
  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list.data.users.find((u) => u.email === email);
  return existing?.id ?? null;
}

async function seedUsers(): Promise<string> {
  const local = isLocal(process.env.SUPABASE_URL);
  const password = process.env.SEED_TEST_PASSWORD ?? 'Password123!';
  let ownerId: string | null = null;

  if (local) {
    for (const account of TEST_ACCOUNTS) {
      const authUserId = await ensureAuthUser(account.email, password);
      const user = await prisma.user.upsert({
        where: { email: account.email },
        update: { authUserId: authUserId ?? undefined, fullName: account.fullName, employeeCode: staffCode(account) },
        create: {
          email: account.email,
          fullName: account.fullName,
          authUserId,
          employeeCode: staffCode(account),
          userType: account.role === RoleCode.CUSTOMER ? UserType.CUSTOMER : UserType.STAFF,
          roles: { create: { role: account.role } },
        },
      });
      if (account.role === RoleCode.OWNER_ADMIN) ownerId = user.id;
      console.log(`  ${account.role.padEnd(20)} ${account.email}${authUserId ? '' : '  (no Supabase login: set SUPABASE_SERVICE_ROLE_KEY)'}`);
    }
  }

  // Staging/production: pre-create the first Owner/Admin record. They sign in with Google;
  // the API links their Supabase account by email on first sign-in.
  const ownerEmail = process.env.SEED_OWNER_EMAIL;
  if (ownerEmail) {
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        userType: UserType.STAFF,
        roles: { create: { role: RoleCode.OWNER_ADMIN } },
      },
    });
    ownerId = ownerId ?? owner.id;
    console.log(`  OWNER_ADMIN record    ${ownerEmail}`);
  }

  if (!ownerId) {
    throw new Error('No Owner/Admin created. Use a local SUPABASE_URL or set SEED_OWNER_EMAIL.');
  }
  return ownerId;
}

async function seedShop(ownerId: string) {
  const find = (email: string) => prisma.user.findUnique({ where: { email } });
  const stock = await find('stock@bossone.test');
  const accountant = await find('accountant@bossone.test');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  await seedCatalogue(prisma, supabase, {
    ownerId,
    stockManagerId: stock?.id ?? ownerId,
    accountantId: accountant?.id ?? ownerId,
  });
}

/**
 * Section A sample data for customer@bossone.test: identity under review, three salons in
 * different states, and a default delivery address. Section C (checkout) can build on this.
 * NIC and documents are fake; no files are uploaded.
 */
async function seedCustomer(ownerId: string) {
  if (!isLocal(process.env.SUPABASE_URL)) return;
  const customer = await prisma.user.findUnique({ where: { email: 'customer@bossone.test' } });
  if (!customer) return;
  if (await prisma.salon.count({ where: { ownerId: customer.id } })) return; // already seeded

  await prisma.user.update({
    where: { id: customer.id },
    data: { phone: '+94770000001', phoneVerifiedAt: new Date() },
  });

  const flagship = await prisma.salon.create({
    data: {
      ownerId: customer.id,
      tradeName: 'Aura Luxury Salon & Spa',
      branchTag: 'Flagship',
      phone: '+94112345678',
      invoiceEmail: 'accounts@aura.test',
      street: 'No. 48/2, Ward Place',
      city: 'Colombo 07',
      district: 'Colombo',
      province: 'Western',
      postalCode: '00700',
      latitude: 6.9147,
      longitude: 79.8668,
      groundFloorBay: true,
      status: VerificationStatus.VERIFIED,
      submittedAt: new Date(),
      reviewedAt: new Date(),
      reviewedById: ownerId,
    },
  });
  await prisma.salon.create({
    data: {
      ownerId: customer.id,
      tradeName: 'Aura Aesthetic Studio',
      branchTag: 'Kandy',
      phone: '+94812234490',
      street: '18/2 Peradeniya Road',
      city: 'Kandy',
      district: 'Kandy',
      province: 'Central',
      postalCode: '20000',
      status: VerificationStatus.PENDING_REVIEW,
      submittedAt: new Date(),
    },
  });
  const galle = await prisma.salon.create({
    data: {
      ownerId: customer.id,
      tradeName: 'Aura Express Nail Bar',
      branchTag: 'Galle',
      phone: '+94912248812',
      street: '56 Church Street, Galle Fort',
      city: 'Galle',
      district: 'Galle',
      province: 'Southern',
      postalCode: '80000',
      status: VerificationStatus.CLARIFICATION_REQUIRED,
      submittedAt: new Date(),
      reviewedAt: new Date(),
      reviewedById: ownerId,
    },
  });
  await prisma.verificationEvent.create({
    data: {
      customerId: customer.id,
      salonId: galle.id,
      actorId: ownerId,
      type: 'CLARIFICATION_REQUESTED',
      message: 'Please upload a clearer salon front photo showing the trade name board.',
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      fullLegalName: 'Test Salon Customer',
      nicNumber: '199012345678',
      designation: 'Salon Director',
      identityStatus: VerificationStatus.PENDING_REVIEW,
      identitySubmittedAt: new Date(),
      activeSalonId: flagship.id,
    },
  });

  await prisma.address.create({
    data: {
      userId: customer.id,
      salonId: flagship.id,
      label: 'Ward Place salon',
      recipientName: 'Front desk',
      phone: '+94112345678',
      line1: 'No. 48/2, Ward Place',
      city: 'Colombo 07',
      district: 'Colombo',
      province: 'Western',
      postalCode: '00700',
      driverNotes: 'Use the side entrance for deliveries.',
      isDefault: true,
    },
  });
  console.log('  customer@bossone.test: 3 salons (verified, pending, clarification) + 1 address');
}

/**
 * Section C sample data for customer@bossone.test: shopping preferences (so the personalised home has
 * content and sign-in does not send them back to registration) and two orders to try tracking with.
 */
async function seedCustomerShopping() {
  if (!isLocal(process.env.SUPABASE_URL)) return;
  const customer = await prisma.user.findUnique({ where: { email: 'customer@bossone.test' } });
  if (!customer) return;

  await prisma.customerProfile.update({
    where: { userId: customer.id },
    data: { onboardingCompletedAt: new Date(), username: 'aura_salon', termsAcceptedAt: new Date(), privacyAcceptedAt: new Date() },
  });

  const categories = await prisma.category.findMany({ where: { slug: { in: ['hair-care', 'hair-color-technical', 'skin-care'] } } });
  for (const c of categories) {
    await prisma.customerInterest.upsert({
      where: { userId_categoryId: { userId: customer.id, categoryId: c.id } },
      update: {},
      create: { userId: customer.id, categoryId: c.id },
    });
  }
  const brands = await prisma.brand.findMany({ where: { slug: { in: ['bellose', 'keune', 'dreamron', 'evon'] } } });
  for (const b of brands) {
    await prisma.customerPreferredBrand.upsert({
      where: { userId_brandId: { userId: customer.id, brandId: b.id } },
      update: {},
      create: { userId: customer.id, brandId: b.id },
    });
  }
  const regular = await prisma.product.findMany({
    where: { sku: { in: ['BEL-003', 'BEL-001', 'KEU-053', 'DRE-003'] } },
    include: { variants: { include: { priceTiers: true } }, brand: true, images: { take: 1 } },
  });
  for (const [i, p] of regular.entries()) {
    // Usual order quantities for My Regular Products (null = the minimum order).
    const moq = p.variants[0]?.moq ?? 1;
    const quantity = i % 2 === 0 ? moq * 2 : null;
    await prisma.regularProduct.upsert({
      where: { userId_productId: { userId: customer.id, productId: p.id } },
      update: {},
      create: { userId: customer.id, productId: p.id, quantity },
    });
  }

  if (await prisma.order.count({ where: { userId: customer.id } })) return; // orders already seeded
  const address = await prisma.address.findFirst({ where: { userId: customer.id, deletedAt: null }, orderBy: { isDefault: 'desc' } });
  if (!address || regular.length < 3) return;
  const staff = await prisma.user.findUnique({ where: { email: 'stock@bossone.test' } });

  const makeOrder = async (
    lines: { product: (typeof regular)[number]; qty: number }[],
    steps: ('PLACED' | 'PICKED' | 'QC_PASSED' | 'OUT_FOR_DELIVERY' | 'DELIVERED')[],
    paid: boolean,
    hoursAgo: number,
  ) => {
    const placedAt = new Date(Date.now() - hoursAgo * 3600_000);
    const priced = lines.map((l) => {
      const v = l.product.variants[0];
      const unit = Number(v.price ?? 0);
      return { ...l, v, unit, total: Math.round(unit * l.qty * 100) / 100 };
    });
    const subtotal = priced.reduce((sum, l) => sum + l.total, 0);
    const deliveryFee = subtotal >= 50000 ? 0 : 750;
    const status = steps[steps.length - 1];
    await prisma.order.create({
      data: {
        userId: customer.id,
        checkoutToken: crypto.randomUUID(),
        status,
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: paid ? 'PAID' : 'PENDING',
        paidAt: paid ? new Date(placedAt.getTime() + steps.length * 3600_000) : null,
        // Cash on delivery is PAID only when the full amount was collected.
        codCollected: paid ? subtotal + deliveryFee : 0,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        itemCount: priced.length,
        unitCount: priced.reduce((sum, l) => sum + l.qty, 0),
        addressId: address.id,
        shipLabel: address.label,
        shipName: address.recipientName,
        shipPhone: address.phone,
        shipLine1: address.line1,
        shipLine2: address.line2,
        shipCity: address.city,
        shipDistrict: address.district,
        shipProvince: address.province,
        shipPostal: address.postalCode,
        notes: address.driverNotes,
        placedAt,
        deliveredAt: status === 'DELIVERED' ? new Date(placedAt.getTime() + 5 * 3600_000) : null,
        items: {
          create: priced.map((l) => ({
            productId: l.product.id,
            variantId: l.v.id,
            sku: l.v.sku,
            productName: l.product.name,
            brandName: l.product.brand?.name ?? null,
            variantName: l.v.name,
            packLabel: l.v.packLabel,
            unitsPerPack: l.v.unitsPerPack,
            imagePath: l.product.images[0]?.storagePath ?? null,
            quantity: l.qty,
            unitPrice: l.unit,
            lineTotal: l.total,
          })),
        },
        events: {
          create: steps.map((st, i) => ({
            status: st,
            actorId: i === 0 ? customer.id : (staff?.id ?? null),
            createdAt: new Date(placedAt.getTime() + i * 75 * 60_000),
          })),
        },
      },
    });
  };

  await makeOrder([{ product: regular[0], qty: 12 }, { product: regular[1], qty: 4 }], ['PLACED', 'PICKED', 'QC_PASSED', 'OUT_FOR_DELIVERY', 'DELIVERED'], true, 24 * 9);
  await makeOrder([{ product: regular[1], qty: 6 }, { product: regular[2], qty: 4 }, { product: regular[3] ?? regular[0], qty: 2 }], ['PLACED', 'PICKED', 'QC_PASSED', 'OUT_FOR_DELIVERY'], false, 5);
  console.log('  customer@bossone.test: shopping preferences + 2 sample orders');
}

/** Sample order chat and support requests for the test customer (designs H08 and H10). */
async function seedSupport() {
  if (!isLocal(process.env.SUPABASE_URL)) return;
  const customer = await prisma.user.findUnique({ where: { email: 'customer@bossone.test' } });
  const agent = await prisma.user.findUnique({ where: { email: 'service@bossone.test' } });
  if (!customer || !agent) return;
  if (await prisma.supportThread.count({ where: { customerId: customer.id } })) return; // already seeded

  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
  const active = await prisma.order.findFirst({ where: { userId: customer.id, status: 'OUT_FOR_DELIVERY' } });
  if (active) {
    const t = await prisma.supportThread.create({
      data: {
        kind: 'ORDER',
        customerId: customer.id,
        orderId: active.id,
        subject: `BO-${active.placedAt.getFullYear()}-${String(active.number).padStart(5, '0')}`,
        status: 'WAITING_CUSTOMER',
        assignedToId: agent.id,
        lastMessageAt: minutesAgo(4),
        customerReadAt: minutesAgo(30),
        staffReadAt: minutesAgo(4),
      },
    });
    await prisma.supportMessage.createMany({
      data: [
        { threadId: t.id, author: 'SYSTEM', authorId: customer.id, body: '', event: 'CHAT_STARTED', createdAt: minutesAgo(48) },
        { threadId: t.id, author: 'CUSTOMER', authorId: customer.id, body: 'Hi, we have client appointments from 2 PM. Will this order reach the salon before then?', createdAt: minutesAgo(47) },
        { threadId: t.id, author: 'STAFF', authorId: agent.id, body: 'Good morning! Your order has passed quality check and left our Colombo hub. The driver is on the way now.', createdAt: minutesAgo(40) },
        { threadId: t.id, author: 'SYSTEM', body: 'OUT_FOR_DELIVERY', event: 'ORDER_STATUS', createdAt: minutesAgo(39) },
        { threadId: t.id, author: 'STAFF', authorId: agent.id, body: 'The driver expects to reach you around 12:30 PM. We will message you here if anything changes.', createdAt: minutesAgo(4) },
      ],
    });
  }

  const open = await prisma.supportThread.create({
    data: {
      kind: 'SUPPORT',
      customerId: customer.id,
      subject: 'Update the phone number for our salon',
      topic: 'ACCOUNT',
      status: 'WAITING_CUSTOMER',
      assignedToId: agent.id,
      lastMessageAt: minutesAgo(25),
      customerReadAt: minutesAgo(90),
      staffReadAt: minutesAgo(25),
    },
  });
  await prisma.supportMessage.createMany({
    data: [
      { threadId: open.id, author: 'SYSTEM', body: '', event: 'REQUEST_CREATED', createdAt: minutesAgo(95) },
      { threadId: open.id, author: 'CUSTOMER', authorId: customer.id, body: 'We changed our salon manager. Please update the contact number on our account to the new manager\'s number.', createdAt: minutesAgo(95) },
      { threadId: open.id, author: 'STAFF', authorId: agent.id, body: 'Thank you! You can change the salon phone number yourself under My Account > My Salons. If you would like us to do it, please reply with the new number and the salon name.', createdAt: minutesAgo(25) },
    ],
  });

  const closed = await prisma.supportThread.create({
    data: {
      kind: 'SUPPORT',
      customerId: customer.id,
      subject: 'Which payment methods can we use?',
      topic: 'PAYMENTS',
      status: 'RESOLVED',
      assignedToId: agent.id,
      lastMessageAt: minutesAgo(60 * 24 * 6),
      customerReadAt: minutesAgo(60 * 24 * 6),
      staffReadAt: minutesAgo(60 * 24 * 6),
      resolvedAt: minutesAgo(60 * 24 * 6),
    },
  });
  await prisma.supportMessage.createMany({
    data: [
      { threadId: closed.id, author: 'SYSTEM', body: '', event: 'REQUEST_CREATED', createdAt: minutesAgo(60 * 24 * 7) },
      { threadId: closed.id, author: 'CUSTOMER', authorId: customer.id, body: 'Can we pay by card for large orders?', createdAt: minutesAgo(60 * 24 * 7) },
      { threadId: closed.id, author: 'STAFF', authorId: agent.id, body: 'Yes. At checkout you can choose cash on delivery or online card payment. Bank transfers are not accepted.', createdAt: minutesAgo(60 * 24 * 6 + 5) },
      { threadId: closed.id, author: 'SYSTEM', authorId: agent.id, body: '', event: 'RESOLVED', createdAt: minutesAgo(60 * 24 * 6) },
    ],
  });
  console.log('  customer@bossone.test: 1 order chat + 2 support requests');
}

/** Sample wishlist and notifications for the test customer (designs H17 and H18). */
async function seedNotificationsAndWishlist() {
  if (!isLocal(process.env.SUPABASE_URL)) return;
  const customer = await prisma.user.findUnique({ where: { email: 'customer@bossone.test' } });
  if (!customer) return;

  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', listPrice: { not: null } },
    include: { variants: { where: { isActive: true, price: { not: null } }, orderBy: { createdAt: 'asc' } } },
    orderBy: { name: 'asc' },
    take: 6,
  });
  for (const [i, p] of products.entries()) {
    const price = p.variants[0]?.price ?? null;
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: customer.id, productId: p.id } },
      update: {},
      create: {
        userId: customer.id,
        productId: p.id,
        // One saved at an older price, so "Price updated" shows.
        savedPrice: price && i === 2 ? price.mul(0.92).toDecimalPlaces(2) : price,
        addedAt: new Date(Date.now() - (i * 9 + 1) * 86_400_000),
      },
    });
  }

  if (await prisma.notification.count({ where: { userId: customer.id } })) return;
  const orders = await prisma.order.findMany({ where: { userId: customer.id }, orderBy: { placedAt: 'asc' } });
  const ago = (h: number) => new Date(Date.now() - h * 3600_000);
  const rows: { kind: string; category: 'ORDERS' | 'PAYMENTS' | 'DELIVERY' | 'SUPPORT' | 'PRODUCTS' | 'ACCOUNT'; params: Record<string, string>; priority?: boolean; read?: boolean; at: Date }[] = [];
  const num = (o: (typeof orders)[number]) => `BO-${o.placedAt.getUTCFullYear()}-${String(o.number).padStart(5, '0')}`;
  const [delivered, open] = orders;
  if (delivered) {
    rows.push({ kind: 'ORDER_PLACED', category: 'ORDERS', params: { orderId: delivered.id, orderNumber: num(delivered), total: delivered.total.toFixed(2) }, read: true, at: delivered.placedAt });
    rows.push({ kind: 'ORDER_DELIVERED', category: 'DELIVERY', params: { orderId: delivered.id, orderNumber: num(delivered) }, read: true, at: ago(24 * 9 - 5) });
    rows.push({ kind: 'PAYMENT_CONFIRMED', category: 'PAYMENTS', params: { orderId: delivered.id, orderNumber: num(delivered), total: delivered.total.toFixed(2) }, read: true, at: ago(24 * 9 - 6) });
  }
  if (open) {
    rows.push({ kind: 'ORDER_PLACED', category: 'ORDERS', params: { orderId: open.id, orderNumber: num(open), total: open.total.toFixed(2) }, read: true, at: open.placedAt });
    rows.push({ kind: 'ORDER_QC_PASSED', category: 'ORDERS', params: { orderId: open.id, orderNumber: num(open) }, at: ago(3) });
    rows.push({ kind: 'ORDER_OUT_FOR_DELIVERY', category: 'DELIVERY', params: { orderId: open.id, orderNumber: num(open) }, priority: true, at: ago(1) });
  }
  if (products[0]) rows.push({ kind: 'PRODUCT_BACK_IN_STOCK', category: 'PRODUCTS', params: { productId: products[0].id, productName: products[0].name, price: products[0].listPrice?.toFixed(2) ?? '' }, at: ago(6) });
  const salon = await prisma.salon.findFirst({ where: { ownerId: customer.id, status: 'VERIFIED' } });
  if (salon) rows.push({ kind: 'SALON_VERIFIED', category: 'ACCOUNT', params: { salonId: salon.id, salonName: salon.tradeName }, read: true, at: ago(24 * 14) });
  await prisma.notification.createMany({
    data: rows.map((r) => ({ userId: customer.id, kind: r.kind, category: r.category, params: r.params, priority: !!r.priority, readAt: r.read ? r.at : null, createdAt: r.at })),
  });
  console.log(`  customer@bossone.test: ${products.length} wishlist items + ${rows.length} notifications`);
}

async function main() {
  console.log('Seeding BOSSONE.LK development data...');
  const ownerId = await seedUsers();
  await seedShop(ownerId);
  await seedCustomer(ownerId);
  await seedCustomerShopping();
  await seedSupport();
  await seedNotificationsAndWishlist();
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
