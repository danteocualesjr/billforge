import { useEffect, useState } from 'react';
import { api, getApiKey, setApiKey } from './api';

type Tab = 'overview' | 'customers' | 'subscriptions' | 'invoices' | 'usage';

function formatMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
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

  async function loadAll() {
    if (!apiKey) return;
    setLoading(true);
    setError('');
    try {
      const [c, p, pr, s, i, u] = await Promise.all([
        api.customers(), api.products(), api.prices(),
        api.subscriptions(), api.invoices(), api.usage(),
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

  useEffect(() => { loadAll(); }, [apiKey]);

  function saveKey() {
    setApiKey(apiKey);
    loadAll();
  }

  async function payInvoice(id: string) {
    await api.payInvoice(id);
    loadAll();
  }

  const openInvoices = invoices.filter((i) => i.status === 'open');
  const mrr = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => {
      const price = prices.find((p) => p.id === s.price_id);
      return sum + (price?.type === 'recurring' ? price.unit_amount : 0);
    }, 0);

  if (!getApiKey()) {
    return (
      <div className="app">
        <div className="login-card">
          <div className="logo">BillForge</div>
          <p className="subtitle">Stripe Billing-inspired learning platform</p>
          <label>API Key</label>
          <input value={apiKey} onChange={(e) => setApiKeyState(e.target.value)} placeholder="bf_test_..." />
          <button onClick={saveKey}>Connect</button>
          <p className="hint">Run <code>npm run seed</code> in the API workspace to get a test key.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="logo">BillForge</div>
          <span className="test-mode">Test mode</span>
        </div>
        <nav>
          {(['overview', 'customers', 'subscriptions', 'invoices', 'usage'] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
          ))}
        </nav>
      </header>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      {tab === 'overview' && (
        <section className="grid">
          <div className="card"><h3>MRR</h3><p className="metric">{formatMoney(mrr)}</p></div>
          <div className="card"><h3>Customers</h3><p className="metric">{customers.length}</p></div>
          <div className="card"><h3>Active Subs</h3><p className="metric">{subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing').length}</p></div>
          <div className="card"><h3>Open Invoices</h3><p className="metric">{openInvoices.length}</p></div>
          <div className="card wide">
            <h3>Products</h3>
            <ul>{products.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
          </div>
        </section>
      )}

      {tab === 'customers' && (
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Created</th></tr></thead>
          <tbody>{customers.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{new Date(c.created_at).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      )}

      {tab === 'subscriptions' && (
        <table>
          <thead><tr><th>ID</th><th>Customer</th><th>Status</th><th>Period End</th></tr></thead>
          <tbody>{subscriptions.map((s) => (
            <tr key={s.id}>
              <td><code>{s.id.slice(0, 18)}...</code></td>
              <td>{customers.find((c) => c.id === s.customer_id)?.name ?? s.customer_id}</td>
              <td><StatusBadge status={s.status} /></td>
              <td>{new Date(s.current_period_end).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {tab === 'invoices' && (
        <table>
          <thead><tr><th>ID</th><th>Status</th><th>Total</th><th>Period</th><th></th></tr></thead>
          <tbody>{invoices.map((inv) => (
            <tr key={inv.id}>
              <td><code>{inv.id.slice(0, 18)}...</code></td>
              <td><StatusBadge status={inv.status} /></td>
              <td>{formatMoney(inv.total, inv.currency)}</td>
              <td>{new Date(inv.period_start).toLocaleDateString()} – {new Date(inv.period_end).toLocaleDateString()}</td>
              <td>{inv.status === 'open' && <button onClick={() => payInvoice(inv.id)}>Pay</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {tab === 'usage' && (
        <table>
          <thead><tr><th>Subscription</th><th>Quantity</th><th>Timestamp</th></tr></thead>
          <tbody>{usage.map((u) => (
            <tr key={u.id}>
              <td><code>{u.subscription_id.slice(0, 18)}...</code></td>
              <td>{u.quantity}</td>
              <td>{new Date(u.timestamp).toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}
