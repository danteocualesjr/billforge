# BillForge

A Stripe Billing-inspired learning platform for subscriptions, invoicing, usage metering, and webhooks.

## Stack

- **API**: Hono + SQLite + TypeScript
- **Dashboard**: React + Vite
- **Billing engine**: `@billforge/billing-core` (pure TypeScript, testable)

## Quick start

```bash
npm install
npm run seed          # prints test API key
npm run dev:api       # http://localhost:3001
npm run dev:dashboard # http://localhost:5173
```

Paste the API key from `npm run seed` into the dashboard login screen.

## API examples

```bash
export API_KEY="bf_test_..."

# Create a subscription with 14-day trial
curl -X POST http://localhost:3001/v1/subscriptions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"customer":"cus_...","price":"price_...","trial_days":14}'

# Report usage
curl -X POST http://localhost:3001/v1/usage_records \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"subscription":"sub_...","quantity":5000}'

# Pay an invoice (simulated)
curl -X POST http://localhost:3001/v1/invoices/inv_.../pay \
  -H "Authorization: Bearer $API_KEY"
```

## Project structure

```
billforge/
├── apps/
│   ├── api/          # REST API
│   └── dashboard/    # Merchant UI
└── packages/
    ├── shared/       # Types + Zod schemas
    └── billing-core/ # Subscription, invoice, proration logic
```

## Phases implemented

- [x] Products, Prices, Customers catalog
- [x] Subscription lifecycle (trial, cancel)
- [x] Period-end invoice generation
- [x] Usage metering
- [x] Proration on plan changes
- [x] Signed webhooks
- [x] Merchant dashboard

## License

MIT
