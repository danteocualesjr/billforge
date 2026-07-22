export const DEMO_API_KEY = 'bf_test_demo00000000000000000001';
export const DEMO_MERCHANT_ID = 'mer_demo000000000001';

export const DEMO_STATS = {
  customers: 1284,
  newCustomersThisMonth: 48,
  subscriptions: 214,
  openInvoices: 20,
  pastDueInvoices: 3,
  outstandingCents: 1_840_000,
  mrrCents: 4_825_000,
  usageUnits: 1_240_000,
  products: 6,
  planMrrCents: {
    Enterprise: 1_890_000,
    Scale: 1_465_000,
    Growth: 985_000,
    Starter: 485_000,
  },
} as const;

const FEATURED_CUSTOMERS = [
  { name: 'Globex Corp', email: 'billing@globex.io' },
  { name: 'Acme Cloud', email: 'finance@acmecloud.com' },
  { name: 'NovaTech', email: 'accounts@novatech.dev' },
  { name: 'Pixel Labs', email: 'ap@pixellabs.co' },
  { name: 'Horizon AI', email: 'billing@horizon.ai' },
  { name: 'Stellar Systems', email: 'payables@stellar.io' },
  { name: 'Northwind Digital', email: 'billing@northwind.dev' },
  { name: 'BluePeak Analytics', email: 'finance@bluepeak.com' },
  { name: 'Cascade Software', email: 'ap@cascade.io' },
  { name: 'Vertex Labs', email: 'billing@vertexlabs.co' },
  { name: 'Summit Health', email: 'finance@summithealth.org' },
  { name: 'Orbit Media', email: 'accounts@orbitmedia.tv' },
  { name: 'Forge Robotics', email: 'billing@forgerobotics.com' },
  { name: 'Lumen Data', email: 'ap@lumendata.io' },
  { name: 'Atlas Commerce', email: 'billing@atlascommerce.com' },
  { name: 'Prism Design', email: 'finance@prismdesign.co' },
  { name: 'Echo Networks', email: 'payables@echonetworks.net' },
  { name: 'Quanta Bio', email: 'billing@quantabio.com' },
  { name: 'Relay Financial', email: 'ap@relay.financial' },
  { name: 'Nimbus Works', email: 'billing@nimbus.works' },
];

const COMPANY_SUFFIXES = ['Labs', 'Cloud', 'Systems', 'Digital', 'Works', 'AI', 'Data', 'Health', 'Media', 'Commerce'];

function daysAgo(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFromNow(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function monthsAgo(months: number, from = new Date()) {
  const d = new Date(from);
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

type SubSpec = {
  customerIndex: number;
  priceId: string;
  status: 'active' | 'trialing';
  periodEndDaysFromNow: number;
  createdDaysAgo: number;
};

export function buildDemoDataset(now = new Date()) {
  const customers = Array.from({ length: DEMO_STATS.customers }, (_, i) => {
    const featured = FEATURED_CUSTOMERS[i];
    const name = featured?.name ?? `${COMPANY_SUFFIXES[i % COMPANY_SUFFIXES.length]} Co ${i + 1}`;
    const email = featured?.email ?? `billing+${i + 1}@${slugify(name)}.io`;
    const createdDaysAgo = i < DEMO_STATS.newCustomersThisMonth
      ? (i % 28) + 1
      : 30 + ((i * 17) % 540);

    return {
      id: `cus_${String(i + 1).padStart(4, '0')}`,
      merchant_id: DEMO_MERCHANT_ID,
      object: 'customer' as const,
      name,
      email,
      created_at: daysAgo(createdDaysAgo, now),
    };
  });

  const products = [
    { id: 'prod_platform', name: 'BillForge Platform', description: 'Core subscription billing and invoicing' },
    { id: 'prod_gateway', name: 'API Gateway', description: 'Managed API gateway with rate limiting' },
    { id: 'prod_analytics', name: 'Analytics Suite', description: 'Usage analytics and revenue reporting' },
    { id: 'prod_sso', name: 'SSO & Security', description: 'Enterprise SSO, audit logs, and RBAC' },
    { id: 'prod_portal', name: 'White-label Portal', description: 'Branded customer billing portal' },
    { id: 'prod_support', name: 'Priority Support', description: '24/7 priority support and SLA' },
  ].map((p) => ({
    ...p,
    merchant_id: DEMO_MERCHANT_ID,
    object: 'product' as const,
    active: true,
    created_at: monthsAgo(12, now),
  }));

  const prices = [
    { id: 'price_starter', nickname: 'Starter', unit_amount: 4900, type: 'recurring', interval: 'month', product_id: 'prod_platform' },
    { id: 'price_starter_alt', nickname: 'Starter', unit_amount: 4800, type: 'recurring', interval: 'month', product_id: 'prod_platform' },
    { id: 'price_growth', nickname: 'Growth', unit_amount: 29900, type: 'recurring', interval: 'month', product_id: 'prod_platform' },
    { id: 'price_growth_alt', nickname: 'Growth', unit_amount: 28200, type: 'recurring', interval: 'month', product_id: 'prod_platform' },
    { id: 'price_scale', nickname: 'Scale', unit_amount: 89900, type: 'recurring', interval: 'month', product_id: 'prod_platform' },
    { id: 'price_scale_alt', nickname: 'Scale', unit_amount: 26600, type: 'recurring', interval: 'month', product_id: 'prod_platform' },
    { id: 'price_enterprise', nickname: 'Enterprise', unit_amount: 450000, type: 'recurring', interval: 'month', product_id: 'prod_platform' },
    { id: 'price_enterprise_alt', nickname: 'Enterprise', unit_amount: 90000, type: 'recurring', interval: 'month', product_id: 'prod_platform' },
    { id: 'price_trial', nickname: 'Growth', unit_amount: 0, type: 'recurring', interval: 'month', product_id: 'prod_platform' },
    { id: 'price_api_calls', nickname: 'API Calls', unit_amount: 20, type: 'metered', interval: null, product_id: 'prod_platform', included_units: 1000 },
    { id: 'price_gateway', nickname: 'Standard', unit_amount: 9900, type: 'recurring', interval: 'month', product_id: 'prod_gateway' },
    { id: 'price_analytics', nickname: 'Standard', unit_amount: 14900, type: 'recurring', interval: 'month', product_id: 'prod_analytics' },
    { id: 'price_sso', nickname: 'Standard', unit_amount: 7900, type: 'recurring', interval: 'month', product_id: 'prod_sso' },
    { id: 'price_portal', nickname: 'Standard', unit_amount: 19900, type: 'recurring', interval: 'month', product_id: 'prod_portal' },
    { id: 'price_support', nickname: 'Standard', unit_amount: 4900, type: 'recurring', interval: 'month', product_id: 'prod_support' },
  ].map((p) => ({
    id: p.id,
    merchant_id: DEMO_MERCHANT_ID,
    product_id: p.product_id,
    object: 'price' as const,
    nickname: p.nickname,
    unit_amount: p.unit_amount,
    currency: 'usd',
    type: p.type,
    interval: p.interval,
    interval_count: 1,
    included_units: p.included_units ?? 0,
    active: true,
    created_at: monthsAgo(12, now),
  }));

  const payingSpecs: SubSpec[] = [
    { customerIndex: 0, priceId: 'price_enterprise', status: 'active', periodEndDaysFromNow: 28, createdDaysAgo: 400 },
    { customerIndex: 1, priceId: 'price_scale', status: 'active', periodEndDaysFromNow: 12, createdDaysAgo: 360 },
    { customerIndex: 2, priceId: 'price_growth', status: 'active', periodEndDaysFromNow: 22, createdDaysAgo: 300 },
    { customerIndex: 3, priceId: 'price_growth', status: 'active', periodEndDaysFromNow: 8, createdDaysAgo: 220 },
    { customerIndex: 4, priceId: 'price_starter', status: 'active', periodEndDaysFromNow: 25, createdDaysAgo: 180 },
    ...Array.from({ length: 3 }, (_, i) => ({
      customerIndex: 5 + i,
      priceId: 'price_enterprise',
      status: 'active' as const,
      periodEndDaysFromNow: 14 + i,
      createdDaysAgo: 150 - i * 8,
    })),
    { customerIndex: 8, priceId: 'price_enterprise_alt', status: 'active', periodEndDaysFromNow: 19, createdDaysAgo: 120 },
    ...Array.from({ length: 15 }, (_, i) => ({
      customerIndex: 9 + i,
      priceId: 'price_scale',
      status: 'active' as const,
      periodEndDaysFromNow: 6 + (i % 20),
      createdDaysAgo: 110 - i,
    })),
    { customerIndex: 24, priceId: 'price_scale_alt', status: 'active', periodEndDaysFromNow: 11, createdDaysAgo: 95 },
    ...Array.from({ length: 30 }, (_, i) => ({
      customerIndex: 25 + i,
      priceId: 'price_growth',
      status: 'active' as const,
      periodEndDaysFromNow: 5 + (i % 24),
      createdDaysAgo: 90 - (i % 60),
    })),
    { customerIndex: 55, priceId: 'price_growth_alt', status: 'active', periodEndDaysFromNow: 9, createdDaysAgo: 60 },
    ...Array.from({ length: 97 }, (_, i) => ({
      customerIndex: 56 + i,
      priceId: 'price_starter',
      status: 'active' as const,
      periodEndDaysFromNow: 3 + (i % 28),
      createdDaysAgo: 80 - (i % 70),
    })),
    { customerIndex: 153, priceId: 'price_starter_alt', status: 'active', periodEndDaysFromNow: 16, createdDaysAgo: 45 },
  ];

  const trialSpecs: SubSpec[] = Array.from({ length: 60 }, (_, i) => ({
    customerIndex: 154 + i,
    priceId: 'price_trial',
    status: 'trialing' as const,
    periodEndDaysFromNow: 10 + (i % 20),
    createdDaysAgo: 14 - (i % 10),
  }));

  const subscriptions = [...payingSpecs, ...trialSpecs].map((sub, index) => {
    const createdAt = daysAgo(Math.max(sub.createdDaysAgo, 1), now);
    const periodStart = daysAgo(Math.max(sub.createdDaysAgo + 28, 30), now);
    const periodEnd = daysFromNow(sub.periodEndDaysFromNow, now);

    return {
      id: `sub_${String(index + 1).padStart(4, '0')}`,
      merchant_id: DEMO_MERCHANT_ID,
      customer_id: customers[sub.customerIndex].id,
      price_id: sub.priceId,
      object: 'subscription' as const,
      status: sub.status,
      trial_end: sub.status === 'trialing' ? periodEnd : null,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: createdAt,
    };
  });

  const openAmounts = Array.from({ length: DEMO_STATS.openInvoices }, () => 70_000);
  const pastDueAmounts = [150_000, 145_000, 145_000];

  const featuredInvoices = [
    { customerIndex: 0, subIndex: 0, status: 'paid', total: 450_000, createdDaysAgo: 35 },
    { customerIndex: 1, subIndex: 1, status: 'paid', total: 89_900, createdDaysAgo: 32 },
    { customerIndex: 2, subIndex: 2, status: 'paid', total: 29_900, createdDaysAgo: 8 },
    { customerIndex: 3, subIndex: 3, status: 'paid', total: 29_900, createdDaysAgo: 28 },
    { customerIndex: 4, subIndex: 4, status: 'paid', total: 4900, createdDaysAgo: 25 },
  ];

  const openInvoices = openAmounts.map((total, i) => ({
    customerIndex: 10 + i,
    subIndex: 5 + (i % 120),
    status: 'open' as const,
    total,
    createdDaysAgo: 1 + (i % 12),
  }));

  const pastDueInvoices = pastDueAmounts.map((total, i) => ({
    customerIndex: 31 + i,
    subIndex: 30 + i,
    status: 'past_due' as const,
    total,
    createdDaysAgo: 14 + i,
  }));

  const paidInvoices = Array.from({ length: 35 }, (_, i) => ({
    customerIndex: 40 + (i % 200),
    subIndex: 10 + (i % 140),
    status: 'paid' as const,
    total: [450_000, 89_900, 29_900, 4900][i % 4],
    createdDaysAgo: 20 + i * 4,
  }));

  const invoiceSpecs = [...featuredInvoices, ...openInvoices, ...pastDueInvoices, ...paidInvoices];

  const invoices = invoiceSpecs.map((inv, index) => {
    const createdAt = daysAgo(inv.createdDaysAgo, now);
    const periodStart = daysAgo(inv.createdDaysAgo + 30, now);
    const periodEnd = daysAgo(inv.createdDaysAgo, now);

    return {
      id: `inv_${String(index + 1).padStart(4, '0')}`,
      merchant_id: DEMO_MERCHANT_ID,
      customer_id: customers[inv.customerIndex].id,
      subscription_id: subscriptions[inv.subIndex].id,
      object: 'invoice' as const,
      status: inv.status,
      subtotal: inv.total,
      total: inv.total,
      currency: 'usd',
      period_start: periodStart,
      period_end: periodEnd,
      paid_at: inv.status === 'paid' ? createdAt : null,
      created_at: createdAt,
      line_items: [],
    };
  });

  const usageWeights = [0.18, 0.14, 0.12, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.04];
  const usageSubs = [0, 1, 2, 3, 5, 6, 8, 9, 11, 14, 16, 17];
  const usage = usageSubs.map((subIndex, i) => {
    const quantity = Math.round(DEMO_STATS.usageUnits * usageWeights[i]);
    const ts = daysAgo((i % 6) + 1, now);
    return {
      id: `ur_${String(i + 1).padStart(4, '0')}`,
      merchant_id: DEMO_MERCHANT_ID,
      subscription_id: subscriptions[subIndex].id,
      quantity,
      timestamp: ts,
      created_at: ts,
    };
  });

  return {
    customers,
    products,
    prices,
    subscriptions,
    invoices,
    usage,
    stats: DEMO_STATS,
  };
}
