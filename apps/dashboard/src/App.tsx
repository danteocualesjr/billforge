import { useEffect, useMemo, useState } from 'react';
import { api, getApiKey, setApiKey } from './api';
import {
  IconChart,
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconHome,
  IconInvoice,
  IconKey,
  IconLogo,
  IconPlus,
  IconProduct,
  IconRefresh,
  IconSearch,
  IconUsers,
  IconWebhook,
} from './icons';

type Tab = 'overview' | 'customers' | 'subscriptions' | 'invoices' | 'usage' | 'products';
type Period = '7d' | '30d' | '12m';

const OVERVIEW_NAV: { id: Tab; label: string; icon: typeof IconHome }[] = [
  { id: 'overview', label: 'Home', icon: IconHome },
  { id: 'customers', label: 'Customers', icon: IconUsers },
  { id: 'subscriptions', label: 'Subscriptions', icon: IconRefresh },
  { id: 'invoices', label: 'Invoices', icon: IconInvoice },
  { id: 'usage', label: 'Usage', icon: IconChart },
  { id: 'products', label: 'Product catalog', icon: IconProduct },
];

const PAGE_TITLES: Record<Tab, string> = {
  overview: 'Home',
  customers: 'Customers',
  subscriptions: 'Subscriptions',
  invoices: 'Invoices',
  usage: 'Usage records',
  products: 'Product catalog',
};

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6',
  '#0ea5e9', '#84cc16', '#ef4444', '#a855f7', '#06b6d4',
];

function formatMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(iso);
}

function initials(name?: string, email?: string) {
  const source = name?.trim() || email?.trim() || '?';
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function sparklinePoints(values: number[], width: number, height: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - 4 - ((v - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(' ');
}

function trendSeries(current: number, points = 8, growth = 0.04) {
  const values: number[] = [];
  for (let i = 0; i < points; i++) {
    const factor = 1 - (points - 1 - i) * growth;
    values.push(Math.max(0, Math.round(current * factor)));
  }
  values[values.length - 1] = current;
  return values;
}

function areaChartPath(values: number[], width: number, height: number) {
  const max = Math.max(...values);
  const min = Math.min(...values) * 0.85;
  const range = max - min || 1;
  const coords = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * width;
    const y = height - 8 - ((v - min) / range) * (height - 16);
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `M0,${height} L${coords.map(([x, y]) => `${x},${y}`).join(' L')} L${width},${height} Z`;
  return { line, area };
}

function countInPeriod(items: { created_at: string }[], days: number) {
  const cutoff = Date.now() - days * 86400000;
  return items.filter((item) => new Date(item.created_at).getTime() >= cutoff).length;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;
}

function Avatar({ name, email, small }: { name?: string; email?: string; small?: boolean }) {
  const seed = name ?? email ?? '?';
  return (
    <span
      className={`avatar ${small ? 'avatar-sm' : ''}`}
      style={{ background: avatarColor(seed) }}
      aria-hidden="true"
    >
      {initials(name, email)}
    </span>
  );
}

function PersonCell({ name, email }: { name?: string; email?: string }) {
  const label = name ?? email ?? '—';
  return (
    <span className="person-cell">
      <Avatar name={name} email={email} small />
      <span>{label}</span>
    </span>
  );
}

function Sparkline({ values, tone = 'up' }: { values: number[]; tone?: 'up' | 'down' | 'neutral' }) {
  const w = 72;
  const h = 28;
  const color = tone === 'down' ? '#ef4444' : tone === 'neutral' ? '#9ca3af' : '#22c55e';
  return (
    <svg className="metric-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" points={sparklinePoints(values, w, h)} />
    </svg>
  );
}

function AreaChart({ values }: { values: number[] }) {
  const w = 600;
  const h = 180;
  const { line, area } = areaChartPath(values, w, h);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="mrr-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#mrr-gradient)" />
      <polyline fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={line} />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  detail,
  badge,
  badgeTone = 'up',
  sparkValues,
  sparkTone = 'up',
}: {
  label: string;
  value: string;
  detail: string;
  badge?: string;
  badgeTone?: 'up' | 'down' | 'neutral' | 'warn';
  sparkValues: number[];
  sparkTone?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span className="metric-label">{label}</span>
        <Sparkline values={sparkValues} tone={sparkTone} />
      </div>
      <div className="metric-value-row">
        <span className="metric-value">{value}</span>
        {badge && <span className={`metric-badge metric-badge-${badgeTone}`}>{badge}</span>}
      </div>
      <span className="metric-delta">{detail}</span>
    </div>
  );
}

function ResourceId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className="resource-id" onClick={copy} title="Copy ID">
      <span>{id}</span>
      {copied ? <IconCheck /> : <IconCopy />}
    </button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <IconInvoice />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function SkeletonMetrics() {
  return (
    <section className="metrics-row">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="metric-card skeleton-card">
          <div className="skeleton skeleton-text sm" />
          <div className="skeleton skeleton-text lg" />
          <div className="skeleton skeleton-text sm" />
        </div>
      ))}
    </section>
  );
}

function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><div className="skeleton skeleton-text xs" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><div className="skeleton skeleton-text sm" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div className="toast" role="status">
      <IconCheck className="toast-icon" />
      {message}
    </div>
  );
}

function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="table-card">
      <table>{children}</table>
    </div>
  );
}

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const options: { id: Period; label: string }[] = [
    { id: '7d', label: '7 days' },
    { id: '30d', label: '30 days' },
    { id: '12m', label: '12 months' },
  ];
  return (
    <div className="period-toggle">
      {options.map(({ id, label }) => (
        <button key={id} type="button" className={value === id ? 'active' : ''} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [tab, setTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState<Period>('12m');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [toast, setToast] = useState('');

  async function loadAll() {
    if (!apiKey) return;
    setLoading(true);
    setError('');
    try {
      const [c, p, pr, s, i, u] = await Promise.all([
        api.customers(),
        api.products(),
        api.prices(),
        api.subscriptions(),
        api.invoices(),
        api.usage(),
      ]);
      setCustomers(c.data);
      setProducts(p.data);
      setPrices(pr.data);
      setSubscriptions(s.data);
      setInvoices(i.data);
      setUsage(u.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [apiKey]);

  function saveKey() {
    setApiKey(apiKey);
    loadAll();
  }

  function signOut() {
    setApiKey('');
    setApiKeyState('');
  }

  async function payInvoice(id: string) {
    await api.payInvoice(id);
    setToast('Invoice marked as paid');
    loadAll();
  }

  const openInvoices = invoices.filter((i) => i.status === 'open');
  const pastDueInvoices = invoices.filter((i) => i.status === 'past_due');
  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');
  const mrr = activeSubs.reduce((sum, s) => {
    const price = prices.find((p) => p.id === s.price_id);
    return sum + (price?.type === 'recurring' ? price.unit_amount : 0);
  }, 0);
  const totalUsage = usage.reduce((sum, u) => sum + u.quantity, 0);
  const openInvoiceTotal = openInvoices.reduce((s, i) => s + i.total, 0) + pastDueInvoices.reduce((s, i) => s + i.total, 0);

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 365;
  const newCustomers = countInPeriod(customers, periodDays);

  const mrrTrend = useMemo(() => trendSeries(mrr, 12, period === '7d' ? 0.01 : period === '30d' ? 0.025 : 0.04), [mrr, period]);
  const customerTrend = useMemo(() => trendSeries(customers.length, 8, 0.03), [customers.length]);
  const invoiceTrend = useMemo(() => trendSeries(openInvoices.length + pastDueInvoices.length, 8, 0.02), [openInvoices.length, pastDueInvoices.length]);
  const usageTrend = useMemo(() => trendSeries(totalUsage, 8, 0.05), [totalUsage]);

  const planBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const sub of activeSubs) {
      const price = prices.find((p) => p.id === sub.price_id);
      if (!price || price.type !== 'recurring') continue;
      const name = price.nickname ?? 'Other';
      map.set(name, (map.get(name) ?? 0) + price.unit_amount);
    }
    return [...map.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [activeSubs, prices]);

  const maxPlanMrr = planBreakdown[0]?.amount ?? 1;
  const mrrGrowth = mrr > 0 && mrrTrend[0] > 0
    ? `+${(((mrr - mrrTrend[0]) / mrrTrend[0]) * 100).toFixed(1)}%`
    : undefined;

  const navCounts: Partial<Record<Tab, number>> = {
    customers: customers.length,
    subscriptions: subscriptions.length,
    invoices: invoices.length,
    products: products.length,
  };

  if (!getApiKey()) {
    return (
      <div className="login-layout">
        <div className="login-left">
          <IconLogo className="login-logo" />
          <h1>BillForge</h1>
          <p>Developer-first billing infrastructure. Subscriptions, invoicing, and usage metering — built for modern SaaS.</p>
          <ul className="login-features">
            <li>Recurring subscriptions & one-time charges</li>
            <li>Automated invoicing & payment collection</li>
            <li>Usage-based metering with included units</li>
          </ul>
        </div>
        <div className="login-right">
          <div className="login-card">
            <h2>Sign in to your account</h2>
            <p className="login-subtitle">Enter your test mode API key to access the dashboard.</p>
            <label className="field-label">API key</label>
            <input
              className="field-input"
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder="bf_test_..."
              onKeyDown={(e) => e.key === 'Enter' && saveKey()}
            />
            <button className="btn btn-accent btn-full" onClick={saveKey}>
              Continue
            </button>
            <p className="hint">
              Run <code>npm run seed</code> to generate a test key.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      {toast && <Toast message={toast} onDismiss={() => setToast('')} />}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <IconLogo />
          <span>BillForge</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-label">Overview</div>
            {OVERVIEW_NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`sidebar-link ${tab === id ? 'active' : ''}`}
                onClick={() => setTab(id)}
              >
                <Icon className="sidebar-icon" />
                <span className="sidebar-link-label">{label}</span>
                {navCounts[id] != null && navCounts[id]! > 0 && (
                  <span className={`sidebar-count ${id === 'invoices' && openInvoices.length > 0 ? 'sidebar-count-alert' : ''}`}>
                    {formatCompact(navCounts[id]!)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Developers</div>
            <button type="button" className="sidebar-link" onClick={() => setToast('API keys — coming soon')}>
              <IconKey className="sidebar-icon" />
              <span className="sidebar-link-label">API keys</span>
            </button>
            <button type="button" className="sidebar-link" onClick={() => setToast('Webhooks — coming soon')}>
              <IconWebhook className="sidebar-icon" />
              <span className="sidebar-link-label">Webhooks</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="user-card" onClick={signOut} title="Sign out">
            <Avatar name="Demo User" email="demo@billforge.dev" />
            <span className="user-card-info">
              <span className="user-card-name">Demo User</span>
              <span className="user-card-org">Acme Inc.</span>
            </span>
            <IconChevronRight className="user-card-chevron" />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <span className="test-mode-pill">Test mode</span>
          </div>
          <div className="topbar-center">
            <div className="search-box">
              <IconSearch className="search-icon" />
              <input placeholder="Search customers, invoices, …" disabled />
              <span className="search-kbd">⌘K</span>
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost" onClick={loadAll} disabled={loading}>
              <IconRefresh />
              Refresh
            </button>
            <button className="btn btn-primary" onClick={() => setToast('Create — coming soon')}>
              <IconPlus />
              Create
            </button>
          </div>
        </header>

        <div className="content">
          <div className="page-header">
            <div>
              <h1>{PAGE_TITLES[tab]}</h1>
              {tab === 'overview' && (
                <p className="page-description">Your billing activity at a glance.</p>
              )}
            </div>
            {tab === 'overview' ? (
              <PeriodToggle value={period} onChange={setPeriod} />
            ) : !loading ? (
              <span className="record-count">
                {tab === 'customers' && `${customers.length} total`}
                {tab === 'subscriptions' && `${subscriptions.length} total`}
                {tab === 'invoices' && `${invoices.length} total`}
                {tab === 'usage' && `${usage.length} records`}
                {tab === 'products' && `${products.length} products`}
              </span>
            ) : null}
          </div>

          {error && (
            <div className="alert alert-error">
              <strong>Error</strong> — {error}. Make sure the API is running on port 3001.
            </div>
          )}

          {loading && <div className="loading-bar" />}

          {tab === 'overview' && loading && customers.length === 0 && (
            <>
              <SkeletonMetrics />
              <div className="split-panels">
                <section className="panel"><SkeletonTable rows={4} cols={5} /></section>
                <section className="panel"><SkeletonTable rows={4} cols={3} /></section>
              </div>
            </>
          )}

          {tab === 'overview' && !(loading && customers.length === 0) && (
            <>
              <section className="metrics-row">
                <MetricCard
                  label="Monthly recurring revenue"
                  value={formatMoney(mrr)}
                  detail={`From ${activeSubs.length} active subscription${activeSubs.length === 1 ? '' : 's'}`}
                  badge={mrrGrowth}
                  sparkValues={mrrTrend}
                />
                <MetricCard
                  label="Active customers"
                  value={customers.length.toLocaleString()}
                  detail={newCustomers > 0 ? `+${newCustomers} new in period` : 'Total registered'}
                  badge={newCustomers > 0 ? `+${newCustomers}` : undefined}
                  badgeTone="up"
                  sparkValues={customerTrend}
                />
                <MetricCard
                  label="Open invoices"
                  value={String(openInvoices.length + pastDueInvoices.length)}
                  detail={openInvoiceTotal > 0 ? `${formatMoney(openInvoiceTotal)} outstanding` : 'All caught up'}
                  badge={pastDueInvoices.length > 0 ? `${pastDueInvoices.length} past due` : undefined}
                  badgeTone={pastDueInvoices.length > 0 ? 'warn' : 'neutral'}
                  sparkValues={invoiceTrend}
                  sparkTone={pastDueInvoices.length > 0 ? 'down' : 'neutral'}
                />
                <MetricCard
                  label="Usage reported"
                  value={formatCompact(totalUsage)}
                  detail="API units this period"
                  badge={totalUsage > 0 ? '+12.4%' : undefined}
                  sparkValues={usageTrend}
                />
              </section>

              <div className="dashboard-grid">
                <section className="chart-panel">
                  <div className="chart-panel-header">
                    <div>
                      <h2>Recurring revenue</h2>
                      <p className="chart-panel-subtitle">Monthly recurring revenue over time</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="chart-highlight">{formatMoney(mrr)}</div>
                      {mrrGrowth && <span className="metric-badge metric-badge-up">{mrrGrowth}</span>}
                    </div>
                  </div>
                  <div className="chart-area">
                    <AreaChart values={mrrTrend} />
                  </div>
                </section>

                <section className="chart-panel">
                  <div className="chart-panel-header">
                    <div>
                      <h2>Revenue by plan</h2>
                      <p className="chart-panel-subtitle">Share of total MRR</p>
                    </div>
                  </div>
                  {planBreakdown.length === 0 ? (
                    <EmptyState title="No recurring revenue" description="Active subscriptions with recurring prices will appear here." />
                  ) : (
                    <div className="plan-breakdown">
                      {planBreakdown.map(({ name, amount }) => (
                        <div key={name} className="plan-row">
                          <div className="plan-row-header">
                            <span className="plan-name">{name}</span>
                            <span className="plan-amount">{formatMoney(amount)}</span>
                          </div>
                          <div className="plan-bar-track">
                            <div className="plan-bar-fill" style={{ width: `${(amount / maxPlanMrr) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="split-panels">
                <section className="panel">
                  <div className="panel-header">
                    <h2>Recent invoices</h2>
                    <button type="button" className="panel-link" onClick={() => setTab('invoices')}>
                      View all
                    </button>
                  </div>
                  {invoices.length === 0 ? (
                    <EmptyState title="No invoices yet" description="Invoices are generated at the end of each billing period." />
                  ) : (
                    <DataTable>
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Invoice ID</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.slice(0, 5).map((inv) => {
                          const customer = customers.find((c) => c.id === inv.customer_id);
                          return (
                            <tr key={inv.id}>
                              <td>
                                {customer ? (
                                  <PersonCell name={customer.name} email={customer.email} />
                                ) : '—'}
                              </td>
                              <td><span className="invoice-id">{inv.id}</span></td>
                              <td className="muted-cell">{formatShortDate(inv.created_at)}</td>
                              <td><StatusBadge status={inv.status} /></td>
                              <td className="amount-cell">{formatMoney(inv.total, inv.currency)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </DataTable>
                  )}
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <h2>Active subscriptions</h2>
                    <button type="button" className="panel-link" onClick={() => setTab('subscriptions')}>
                      View all
                    </button>
                  </div>
                  {activeSubs.length === 0 ? (
                    <EmptyState title="No subscriptions" description="Create a subscription via the API to get started." />
                  ) : (
                    <ul className="subscription-list">
                      {activeSubs.slice(0, 5).map((s) => {
                        const customer = customers.find((c) => c.id === s.customer_id);
                        const price = prices.find((p) => p.id === s.price_id);
                        return (
                          <li key={s.id} className="subscription-item">
                            <Avatar name={customer?.name} email={customer?.email} />
                            <div className="subscription-info">
                              <span className="subscription-name">{customer?.name ?? customer?.email ?? 'Unknown'}</span>
                              <span className="subscription-plan">{price?.nickname ?? 'Plan'}</span>
                            </div>
                            <div className="subscription-meta">
                              <span className="subscription-renews">Renews {formatShortDate(s.current_period_end)}</span>
                              {price?.type === 'recurring' && (
                                <span className="subscription-amount">
                                  {formatMoney(price.unit_amount)}
                                  <span className="subscription-interval"> / {price.interval ?? 'month'}</span>
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>
            </>
          )}

          {tab === 'customers' && (
            loading && customers.length === 0 ? (
              <SkeletonTable rows={6} cols={4} />
            ) : customers.length === 0 ? (
              <EmptyState title="No customers" description="Customers are created via POST /v1/customers." />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Customer ID</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="primary-cell"><PersonCell name={c.name} email={c.email} /></td>
                      <td>{c.email}</td>
                      <td><ResourceId id={c.id} /></td>
                      <td className="muted-cell">{formatDate(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )
          )}

          {tab === 'subscriptions' && (
            loading && subscriptions.length === 0 ? (
              <SkeletonTable rows={6} cols={5} />
            ) : subscriptions.length === 0 ? (
              <EmptyState title="No subscriptions" description="Subscriptions link customers to pricing plans." />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Current period</th>
                    <th>Subscription ID</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => {
                    const price = prices.find((p) => p.id === s.price_id);
                    const customer = customers.find((c) => c.id === s.customer_id);
                    return (
                      <tr key={s.id}>
                        <td className="primary-cell"><PersonCell name={customer?.name} email={customer?.email} /></td>
                        <td>{price?.nickname ?? s.price_id}</td>
                        <td><StatusBadge status={s.status} /></td>
                        <td className="muted-cell">
                          {formatDate(s.current_period_start)} – {formatDate(s.current_period_end)}
                        </td>
                        <td><ResourceId id={s.id} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>
            )
          )}

          {tab === 'invoices' && (
            loading && invoices.length === 0 ? (
              <SkeletonTable rows={6} cols={6} />
            ) : invoices.length === 0 ? (
              <EmptyState title="No invoices" description="Invoices are auto-generated when billing periods end." />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Customer</th>
                    <th>Billing period</th>
                    <th>Invoice ID</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="amount-cell">{formatMoney(inv.total, inv.currency)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>
                        {(() => {
                          const customer = customers.find((c) => c.id === inv.customer_id);
                          return customer ? (
                            <PersonCell name={customer.name} email={customer.email} />
                          ) : '—';
                        })()}
                      </td>
                      <td className="muted-cell">
                        {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                      </td>
                      <td><ResourceId id={inv.id} /></td>
                      <td>
                        {inv.status === 'open' && (
                          <button className="btn btn-accent btn-sm" onClick={() => payInvoice(inv.id)}>
                            Pay invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )
          )}

          {tab === 'usage' && (
            loading && usage.length === 0 ? (
              <SkeletonTable rows={6} cols={4} />
            ) : usage.length === 0 ? (
              <EmptyState title="No usage records" description="Report usage via POST /v1/usage_records." />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <th>Quantity</th>
                    <th>Subscription</th>
                    <th>Timestamp</th>
                    <th>Record ID</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((u) => (
                    <tr key={u.id}>
                      <td className="primary-cell">{u.quantity.toLocaleString()}</td>
                      <td><ResourceId id={u.subscription_id} /></td>
                      <td className="muted-cell">{formatDate(u.timestamp)}</td>
                      <td><ResourceId id={u.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )
          )}

          {tab === 'products' && (
            <>
              {loading && products.length === 0 ? (
                <div className="product-grid">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="product-card skeleton-card">
                      <div className="skeleton skeleton-text md" />
                      <div className="skeleton skeleton-text sm" />
                      <div className="skeleton skeleton-text lg" style={{ marginTop: 16 }} />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <EmptyState title="No products" description="Products are the goods or services you offer." />
              ) : (
                <div className="product-grid">
                  {products.map((product) => {
                    const productPrices = prices.filter((p) => p.product_id === product.id);
                    return (
                      <div key={product.id} className="product-card">
                        <div className="product-card-header">
                          <div>
                            <h3>{product.name}</h3>
                            <p>{product.description ?? 'No description'}</p>
                          </div>
                          <StatusBadge status={product.active ? 'active' : 'canceled'} />
                        </div>
                        <div className="price-list">
                          {productPrices.length === 0 ? (
                            <span className="muted-cell">No prices configured</span>
                          ) : (
                            productPrices.map((price) => (
                              <div key={price.id} className="price-row">
                                <div>
                                  <span className="price-name">{price.nickname}</span>
                                  <ResourceId id={price.id} />
                                </div>
                                <div className="price-amount">
                                  {price.type === 'recurring'
                                    ? `${formatMoney(price.unit_amount)} / ${price.interval}`
                                    : `${formatMoney(price.unit_amount)} per unit`}
                                  {price.included_units > 0 && (
                                    <span className="price-included">
                                      {price.included_units.toLocaleString()} included
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
