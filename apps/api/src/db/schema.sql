CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  webhook_secret TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  name TEXT NOT NULL,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  nickname TEXT NOT NULL,
  unit_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  type TEXT NOT NULL,
  interval TEXT,
  interval_count INTEGER NOT NULL DEFAULT 1,
  included_units INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  price_id TEXT NOT NULL REFERENCES prices(id),
  status TEXT NOT NULL,
  trial_end TEXT,
  current_period_start TEXT NOT NULL,
  current_period_end TEXT NOT NULL,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  canceled_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  status TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  total INTEGER NOT NULL,
  currency TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  paid_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_amount INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_records (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  quantity REAL NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TEXT NOT NULL
);
