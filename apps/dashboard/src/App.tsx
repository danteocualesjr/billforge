import { useEffect, useState } from 'react';
import { api, getApiKey, setApiKey } from './api';
import {
  IconChart,
  IconCheck,
  IconCopy,
  IconDollar,
  IconHome,
  IconInvoice,
  IconLogo,
  IconLogout,
  IconProduct,
  IconRefresh,
  IconSearch,
  IconUsers,
} from './icons';

type Tab = 'overview' | 'customers' | 'subscriptions' | 'invoices' | 'usage' | 'products';

const NAV: { id: Tab; label: string; icon: typeof IconHome }[] = [
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

function formatMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;
}

function initials(name?: string, email?: string) {
  const source = name?.trim() || email?.trim() || '?';
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function Avatar({ name, email }: { name?: string; email?: string }) {
  return (
    <span className="avatar" aria-hidden="true">
      {initials(name, email)}
    </span>
  );
}

function PersonCell({ name, email }: { name?: string; email?: string }) {
  const label = name ?? email ?? '—';
  return (
    <span className="person-cell">
      <Avatar name={name} email={email} />
      <span>{label}</span>
    </span>
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

export default function App() {
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [tab, setTab] = useState<Tab>('overview');
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
  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');
  const mrr = activeSubs.reduce((sum, s) => {
    const price = prices.find((p) => p.id === s.price_id);
    return sum + (price?.type === 'recurring' ? price.unit_amount : 0);
  }, 0);
  const totalUsage = usage.reduce((sum, u) => sum + u.quantity, 0);

  const navCounts: Partial<Record<Tab, number>> = {
    customers: customers.length,
    subscriptions: subscriptions.length,
    invoices: invoices.length,
    usage: usage.length,
    products: products.length,
  };

  if (!getApiKey()) {
    return (
      <div className="login-layout">
        <div className="login-left">
          <IconLogo className="login-logo" />
          <h1>BillForge</h1>
          <p>Developer-first billing infrastructure. Subscriptions, invoicing, and usage metering — inspired by Stripe Billing.</p>
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
            <button className="btn btn-primary btn-full" onClick={saveKey}>
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
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`sidebar-link ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon className="sidebar-icon" />
              <span className="sidebar-link-label">{label}</span>
              {navCounts[id] != null && navCounts[id]! > 0 && (
                <span className="sidebar-count">{navCounts[id]}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="dev-mode-badge">Developers</div>
          <button className="sidebar-signout" onClick={signOut}>
            <IconLogout className="sidebar-icon" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <span className="test-mode-pill">Test mode</span>
            <div className="search-box">
              <IconSearch className="search-icon" />
              <input placeholder="Search" disabled />
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost" onClick={loadAll} disabled={loading}>
              Refresh
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
            {tab !== 'overview' && !loading && (
              <span className="record-count">
                {tab === 'customers' && `${customers.length} total`}
                {tab === 'subscriptions' && `${subscriptions.length} total`}
                {tab === 'invoices' && `${invoices.length} total`}
                {tab === 'usage' && `${usage.length} records`}
                {tab === 'products' && `${products.length} products`}
              </span>
            )}
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
                <section className="panel"><SkeletonTable rows={4} cols={4} /></section>
                <section className="panel"><SkeletonTable rows={4} cols={3} /></section>
              </div>
            </>
          )}

          {tab === 'overview' && !(loading && customers.length === 0) && (
            <>
              <section className="metrics-row">
                <div className="metric-card metric-card-accent-purple">
                  <div className="metric-card-top">
                    <span className="metric-label">Monthly recurring revenue</span>
                    <span className="metric-icon"><IconDollar /></span>
                  </div>
                  <span className="metric-value">{formatMoney(mrr)}</span>
                  <span className="metric-delta">From {activeSubs.length} active subscriptions</span>
                </div>
                <div className="metric-card metric-card-accent-blue">
                  <div className="metric-card-top">
                    <span className="metric-label">Customers</span>
                    <span className="metric-icon"><IconUsers /></span>
                  </div>
                  <span className="metric-value">{customers.length}</span>
                  <span className="metric-delta">Total registered</span>
                </div>
                <div className="metric-card metric-card-accent-amber">
                  <div className="metric-card-top">
                    <span className="metric-label">Open invoices</span>
                    <span className="metric-icon"><IconInvoice /></span>
                  </div>
                  <span className="metric-value">{openInvoices.length}</span>
                  <span className="metric-delta">
                    {openInvoices.length > 0
                      ? formatMoney(openInvoices.reduce((s, i) => s + i.total, 0))
                      : 'All caught up'}
                  </span>
                </div>
                <div className="metric-card metric-card-accent-teal">
                  <div className="metric-card-top">
                    <span className="metric-label">Usage reported</span>
                    <span className="metric-icon"><IconChart /></span>
                  </div>
                  <span className="metric-value">{totalUsage.toLocaleString()}</span>
                  <span className="metric-delta">Units this period</span>
                </div>
              </section>

              <div className="split-panels">
                <section className="panel">
                  <div className="panel-header">
                    <h2>Recent invoices</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTab('invoices')}>
                      View all
                    </button>
                  </div>
                  {invoices.length === 0 ? (
                    <EmptyState title="No invoices yet" description="Invoices are generated at the end of each billing period." />
                  ) : (
                    <DataTable>
                      <thead>
                        <tr>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Customer</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.slice(0, 5).map((inv) => (
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
                              <span className="date-cell">
                                {formatDate(inv.created_at)}
                                <span className="date-relative">{formatRelative(inv.created_at)}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  )}
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <h2>Active subscriptions</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTab('subscriptions')}>
                      View all
                    </button>
                  </div>
                  {activeSubs.length === 0 ? (
                    <EmptyState title="No subscriptions" description="Create a subscription via the API to get started." />
                  ) : (
                    <DataTable>
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Status</th>
                          <th>Renews</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSubs.slice(0, 5).map((s) => {
                          const customer = customers.find((c) => c.id === s.customer_id);
                          return (
                          <tr key={s.id}>
                            <td><PersonCell name={customer?.name} email={customer?.email} /></td>
                            <td><StatusBadge status={s.status} /></td>
                            <td className="muted-cell">{formatDate(s.current_period_end)}</td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </DataTable>
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
                          <button className="btn btn-primary btn-sm" onClick={() => payInvoice(inv.id)}>
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
