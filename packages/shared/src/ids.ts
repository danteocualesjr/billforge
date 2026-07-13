const PREFIXES = {
  merchant: 'mer', customer: 'cus', product: 'prod', price: 'price',
  subscription: 'sub', invoice: 'inv', line_item: 'li', usage: 'ur',
  webhook: 'we', event: 'evt',
} as const;
type Prefix = keyof typeof PREFIXES;
export function generateId(prefix: Prefix): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `${PREFIXES[prefix]}_${random}`;
}
