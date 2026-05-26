'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { bearerHeader, tokenStorage } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

/* ── types ─────────────────────────────────────────────────── */
type Summary = {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  pendingProducts: number;
  grossRevenue?: number;
};

type OrdersApiResponse = {
  data: { totalAmount: number }[];
  total: number;
  totalPages: number;
};

type RawSaleRow = {
  createdAt: string;
  _count: { id?: number; _all?: number } | number;
  _sum: { totalAmount: number | null } | null;
};

type SaleEntry = { date: string; orders: number; revenue: number };

type RawTopProduct = {
  productId: string;
  _sum: { quantity: number | null } | null;
};

type TopProduct = {
  productId: string;
  quantity: number;
  name: string;
};

/* ── utils ──────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n));

const fmtRevenue = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M XOF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K XOF`;
  return `${fmt(n)} XOF`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

function normalizeSales(raw: RawSaleRow[]): SaleEntry[] {
  const map = new Map<string, { orders: number; revenue: number }>();
  for (const row of raw) {
    const date = row.createdAt.slice(0, 10);
    let orders = 0;
    if (typeof row._count === 'number') {
      orders = row._count;
    } else if (row._count && typeof row._count === 'object') {
      orders = (row._count as Record<string, number>).id ?? (row._count as Record<string, number>)._all ?? 0;
    }
    const revenue =
      row._sum && typeof row._sum === 'object'
        ? (row._sum.totalAmount ?? 0)
        : 0;
    const prev = map.get(date) ?? { orders: 0, revenue: 0 };
    map.set(date, { orders: prev.orders + orders, revenue: prev.revenue + revenue });
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ── animation helper ───────────────────────────────────────── */
function Appear({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(18px)',
      transition: 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {children}
    </div>
  );
}

/* ── KPI card ───────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, icon, color, loading,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; color: string; loading: boolean;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid var(--bem-gray-100)',
      padding: '22px 24px',
      display: 'flex', alignItems: 'flex-start', gap: 16,
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${color}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: 6 }}>
          {label}
        </p>
        {loading ? (
          <div style={{ height: 28, width: 80, borderRadius: 6, background: 'var(--bem-gray-100)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ) : (
          <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--bem-black)', lineHeight: 1 }}>
            {value}
          </p>
        )}
        {sub && !loading && (
          <p style={{ fontSize: 11, color: 'var(--bem-gray-400)', marginTop: 4 }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ── bar chart ──────────────────────────────────────────────── */
function SalesBarChart({ data, metric }: { data: SaleEntry[]; metric: 'revenue' | 'orders' }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  if (!data.length) {
    return (
      <div style={{
        height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--bem-gray-400)', fontSize: 13,
      }}>
        Aucune donnée sur cette période.
      </div>
    );
  }

  const values = data.map((d) => metric === 'revenue' ? d.revenue : d.orders);
  const maxVal = Math.max(...values, 1);

  // Limit to last 30 entries for readability
  const visible = data.slice(-30);
  const visibleValues = visible.map((d) => metric === 'revenue' ? d.revenue : d.orders);

  return (
    <div style={{ position: 'relative' }}>
      {/* Y-axis labels */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 0 8px' }}>
        {/* Y labels */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 180, marginRight: 8 }}>
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
            <span key={ratio} style={{ fontSize: 10, color: 'var(--bem-gray-400)', lineHeight: 1 }}>
              {metric === 'revenue'
                ? fmtRevenue(maxVal * ratio)
                : fmt(Math.round(maxVal * ratio))}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Grid lines */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <div key={ratio} style={{
                position: 'absolute', left: 0, right: 0,
                top: `${(1 - ratio) * 100}%`,
                height: 1,
                background: ratio === 0 ? 'var(--bem-gray-100)' : 'rgba(0,0,0,0.04)',
                transform: ratio === 0 ? 'none' : 'translateY(-50%)',
              }} />
            ))}
          </div>

          {/* Bars */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 3,
            height: 180, paddingBottom: 1,
          }}>
            {visible.map((entry, i) => {
              const val = visibleValues[i];
              const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
              const isHov = hovered === i;

              return (
                <div
                  key={entry.date}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', cursor: 'pointer', position: 'relative' }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Tooltip */}
                  {isHov && (
                    <div ref={tooltipRef} style={{
                      position: 'absolute', bottom: `calc(${heightPct}% + 8px)`,
                      left: '50%', transform: 'translateX(-50%)',
                      background: 'var(--bem-black)', color: '#fff',
                      fontSize: 11, fontWeight: 600, padding: '6px 10px',
                      borderRadius: 8, whiteSpace: 'nowrap', zIndex: 10,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                      pointerEvents: 'none',
                    }}>
                      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, marginBottom: 2 }}>{fmtDate(entry.date)}</p>
                      {metric === 'revenue'
                        ? <p>{fmt(entry.revenue)} XOF</p>
                        : <p>{entry.orders} commande{entry.orders > 1 ? 's' : ''}</p>}
                    </div>
                  )}
                  {/* Bar */}
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    height: `${heightPct}%`,
                    minHeight: val > 0 ? 3 : 0,
                    background: isHov
                      ? 'var(--bem-red)'
                      : 'linear-gradient(180deg, rgba(204,31,39,0.85) 0%, rgba(204,31,39,0.5) 100%)',
                    transition: 'background 0.15s, height 0.4s cubic-bezier(0.22,1,0.36,1)',
                  }} />
                </div>
              );
            })}
          </div>

          {/* X-axis dates (show ~6 labels) */}
          <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
            {visible.map((entry, i) => {
              const step = Math.max(1, Math.floor(visible.length / 6));
              const show = i === 0 || i === visible.length - 1 || i % step === 0;
              return (
                <div key={entry.date} style={{ flex: 1, textAlign: 'center' }}>
                  {show && (
                    <span style={{ fontSize: 9, color: 'var(--bem-gray-400)', whiteSpace: 'nowrap' }}>
                      {fmtDate(entry.date)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── top products chart ─────────────────────────────────────── */
function TopProductsChart({ products, loading }: { products: TopProduct[]; loading: boolean }) {
  const maxQty = products.length ? Math.max(...products.map((p) => p.quantity), 1) : 1;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            height: 48, borderRadius: 10, background: 'var(--bem-gray-100)',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <p style={{ color: 'var(--bem-gray-400)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
        Aucun produit vendu sur cette période.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {products.map((p, i) => {
        const pct = (p.quantity / maxQty) * 100;
        return (
          <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Rank */}
            <span style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: i < 3 ? 'var(--bem-red)' : 'var(--bem-gray-100)',
              color: i < 3 ? '#fff' : 'var(--bem-gray-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800,
            }}>
              {i + 1}
            </span>

            {/* Bar + label */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--bem-black)' }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--bem-red)' }}>
                  {fmt(p.quantity)} unité{p.quantity > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'var(--bem-gray-100)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${pct}%`,
                  background: i === 0
                    ? 'var(--bem-red)'
                    : i === 1
                      ? 'rgba(204,31,39,0.7)'
                      : i === 2
                        ? 'rgba(204,31,39,0.5)'
                        : 'var(--bem-gray-400)',
                  transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── main page ──────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [sales, setSales]         = useState<SaleEntry[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [grossRevenue, setGrossRevenue]     = useState<number | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingSales, setLoadingSales]     = useState(true);
  const [loadingTop, setLoadingTop]         = useState(true);
  const [days, setDays]           = useState(30);
  const [metric, setMetric]       = useState<'revenue' | 'orders'>('revenue');
  const [error, setError]         = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const headers = { ...bearerHeader(), 'Content-Type': 'application/json' };

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API}/analytics/summary`, { headers });
      if (!res.ok) throw new Error(`${res.status}`);
      setSummary(await res.json());
    } catch {
      setError('Impossible de charger le résumé. Vérifiez votre connexion.');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchGrossRevenue = useCallback(async () => {
    try {
      // Première page pour connaître le nombre total de pages
      const first = await fetch(`${API}/orders?page=1&limit=500`, { headers });
      if (!first.ok) return;
      const json: OrdersApiResponse = await first.json();

      let total = json.data.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

      // Si plusieurs pages, on les récupère toutes en parallèle
      if (json.totalPages > 1) {
        const pages = Array.from({ length: json.totalPages - 1 }, (_, i) => i + 2);
        const results = await Promise.all(
          pages.map((p) =>
            fetch(`${API}/orders?page=${p}&limit=500`, { headers })
              .then((r) => (r.ok ? r.json() as Promise<OrdersApiResponse> : null))
          )
        );
        for (const r of results) {
          if (r) total += r.data.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
        }
      }

      setGrossRevenue(total);
    } catch {
      // silencieux : on garde null si le calcul échoue
    }
  }, []);

  const fetchSales = useCallback(async (d: number) => {
    setLoadingSales(true);
    try {
      const res = await fetch(`${API}/analytics/sales?days=${d}`, { headers });
      if (!res.ok) throw new Error(`${res.status}`);
      const raw: RawSaleRow[] = await res.json();
      setSales(normalizeSales(raw));
    } catch {
      setSales([]);
    } finally {
      setLoadingSales(false);
    }
  }, []);

  const fetchTopProducts = useCallback(async () => {
    setLoadingTop(true);
    try {
      const res = await fetch(`${API}/analytics/top-products?limit=10`, { headers });
      if (!res.ok) throw new Error(`${res.status}`);
      const raw: RawTopProduct[] = await res.json();

      // Fetch product names in parallel
      const enriched = await Promise.all(
        raw.map(async (item) => {
          const quantity =
            item._sum && typeof item._sum === 'object'
              ? (item._sum.quantity ?? 0)
              : 0;
          try {
            const pRes = await fetch(`${API}/products/${item.productId}`, { headers });
            const product = pRes.ok ? await pRes.json() : null;
            return {
              productId: item.productId,
              quantity,
              name: product?.name ?? `Produit ${item.productId.slice(0, 8)}…`,
            };
          } catch {
            return {
              productId: item.productId,
              quantity,
              name: `Produit ${item.productId.slice(0, 8)}…`,
            };
          }
        })
      );

      setTopProducts(enriched.filter((p) => p.quantity > 0));
    } catch {
      setTopProducts([]);
    } finally {
      setLoadingTop(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchSales(days);
    fetchTopProducts();
    fetchGrossRevenue();
  }, []);

  useEffect(() => {
    fetchSales(days);
  }, [days]);

  const handleRefresh = () => {
    setError(null);
    setLastRefresh(new Date());
    fetchSummary();
    fetchSales(days);
    fetchTopProducts();
    fetchGrossRevenue();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = tokenStorage.getAccess();
      const res = await fetch(`${API}/analytics/export/orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Export échoué');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes-bem-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors de l\'export. Réessayez.');
    } finally {
      setExporting(false);
    }
  };

  /* ── KPI data ── */
  const kpis = [
    {
      label: 'Commandes',
      value: summary ? fmt(summary.totalOrders) : '—',
      sub: 'Total toutes périodes',
      color: '#2563eb',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
    },
    {
      label: 'CA Brut',
      value: grossRevenue !== null
        ? fmtRevenue(grossRevenue)
        : summary
          ? fmtRevenue(summary.totalRevenue)
          : '—',
      sub: 'Toutes commandes confondues',
      color: '#16a34a',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label: 'Utilisateurs',
      value: summary ? fmt(summary.totalUsers) : '—',
      sub: 'Comptes enregistrés',
      color: '#7c3aed',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Produits en attente',
      value: summary ? fmt(summary.pendingProducts) : '—',
      sub: 'Approbation requise',
      color: summary?.pendingProducts ? 'var(--bem-red)' : '#16a34a',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
    },
  ];

  /* ── Summary stats for period ── */
  const periodRevenue = sales.reduce((s, d) => s + d.revenue, 0);
  const periodOrders  = sales.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="admin-content">

      {/* ── Page header ── */}
      <Appear>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 6 }}>
              Tableau de bord
            </p>
            <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--bem-black)', lineHeight: 1.2 }}>
              Analytics
            </h1>
            <p style={{ color: 'var(--bem-gray-400)', fontSize: 13, marginTop: 6 }}>
              Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Refresh */}
            <button onClick={handleRefresh} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0 18px', height: 40, borderRadius: 10,
              border: '1.5px solid var(--bem-gray-100)',
              background: '#fff', color: 'var(--bem-gray-700)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--bem-black)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--bem-gray-100)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Actualiser
            </button>

            {/* Export CSV */}
            <button onClick={handleExport} disabled={exporting} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0 18px', height: 40, borderRadius: 10,
              border: 'none',
              background: exporting ? 'var(--bem-gray-400)' : 'var(--bem-black)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: exporting ? 'wait' : 'pointer',
              boxShadow: exporting ? 'none' : '0 2px 12px rgba(13,13,13,0.18)',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}>
              {exporting ? (
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              {exporting ? 'Export…' : 'Exporter CSV'}
            </button>
          </div>
        </div>
      </Appear>

      {/* ── Error banner ── */}
      {error && (
        <Appear>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px', borderRadius: 12, marginBottom: 24,
            background: 'rgba(204,31,39,0.07)', border: '1px solid rgba(204,31,39,0.2)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bem-red)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 13, color: 'var(--bem-red)' }}>{error}</p>
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bem-red)', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        </Appear>
      )}

      {/* ── KPI cards ── */}
      <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
        {kpis.map((kpi, i) => (
          <Appear key={kpi.label} delay={i * 60}>
            <KpiCard {...kpi} loading={loadingSummary} />
          </Appear>
        ))}
      </div>

      {/* ── Sales chart card ── */}
      <Appear delay={280}>
        <div style={{
          background: '#fff', borderRadius: 20, border: '1px solid var(--bem-gray-100)',
          padding: '24px 28px', marginBottom: '1.5rem',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--bem-black)' }}>
                Évolution des ventes
              </h2>
              {!loadingSales && (
                <p style={{ fontSize: 12, color: 'var(--bem-gray-400)', marginTop: 3 }}>
                  {metric === 'revenue'
                    ? `${fmtRevenue(periodRevenue)} sur ${days} jours`
                    : `${fmt(periodOrders)} commande${periodOrders > 1 ? 's' : ''} sur ${days} jours`}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Metric toggle */}
              <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bem-gray-50)', borderRadius: 8 }}>
                {(['revenue', 'orders'] as const).map((m) => (
                  <button key={m} onClick={() => setMetric(m)} style={{
                    padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    background: metric === m ? '#fff' : 'transparent',
                    color: metric === m ? 'var(--bem-black)' : 'var(--bem-gray-400)',
                    boxShadow: metric === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                    {m === 'revenue' ? 'CA' : 'Commandes'}
                  </button>
                ))}
              </div>

              {/* Period tabs */}
              <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bem-gray-50)', borderRadius: 8 }}>
                {[7, 30, 90].map((d) => (
                  <button key={d} onClick={() => setDays(d)} style={{
                    padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    background: days === d ? 'var(--bem-black)' : 'transparent',
                    color: days === d ? '#fff' : 'var(--bem-gray-400)',
                    transition: 'all 0.15s',
                  }}>
                    {d}j
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          {loadingSales ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '3px solid var(--bem-gray-100)',
                borderTopColor: 'var(--bem-red)',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : (
            <SalesBarChart data={sales} metric={metric} />
          )}
        </div>
      </Appear>

      {/* ── Bottom row: top products + quick stats ── */}
      <div className="analytics-bottom-grid">

        {/* Top products */}
        <Appear delay={380}>
          <div style={{
            background: '#fff', borderRadius: 20, border: '1px solid var(--bem-gray-100)',
            padding: '24px 28px',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--bem-black)', marginBottom: 4 }}>
              Top produits vendus
            </h2>
            <p style={{ fontSize: 12, color: 'var(--bem-gray-400)', marginBottom: 20 }}>
              Par quantité commandée (toutes périodes)
            </p>
            <TopProductsChart products={topProducts} loading={loadingTop} />
          </div>
        </Appear>

        {/* Quick info panel */}
        <Appear delay={440}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Period summary */}
            <div style={{
              background: 'var(--bem-black)', borderRadius: 20,
              padding: '24px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -40, right: -40,
                width: 130, height: 130, borderRadius: '50%',
                background: 'rgba(204,31,39,0.15)', pointerEvents: 'none',
              }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 12 }}>
                Période sélectionnée
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>CA brut (période)</p>
              {loadingSales ? (
                <div style={{ height: 24, width: 100, borderRadius: 6, background: 'rgba(255,255,255,0.1)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ) : (
                <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                  {fmtRevenue(periodRevenue)}
                </p>
              )}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Commandes</p>
              {loadingSales ? (
                <div style={{ height: 20, width: 60, borderRadius: 6, background: 'rgba(255,255,255,0.1)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ) : (
                <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                  {fmt(periodOrders)}
                </p>
              )}
            </div>

            {/* Avg order value */}
            <div style={{
              background: '#fff', borderRadius: 20, border: '1px solid var(--bem-gray-100)',
              padding: '20px 24px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: 8 }}>
                Panier moyen
              </p>
              {loadingSales ? (
                <div style={{ height: 24, width: 80, borderRadius: 6, background: 'var(--bem-gray-100)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ) : (
                <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--bem-black)' }}>
                  {periodOrders > 0
                    ? fmtRevenue(Math.round(periodRevenue / periodOrders))
                    : '—'}
                </p>
              )}
              <p style={{ fontSize: 11, color: 'var(--bem-gray-400)', marginTop: 4 }}>
                CA ÷ nombre de commandes
              </p>
            </div>

            {/* Endpoints reference */}
            <div style={{
              background: '#fff', borderRadius: 20, border: '1px solid var(--bem-gray-100)',
              padding: '20px 24px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: 12 }}>
                Endpoints utilisés
              </p>
              {[
                { method: 'GET', path: '/analytics/summary' },
                { method: 'GET', path: `/analytics/sales?days=${days}` },
                { method: 'GET', path: '/analytics/top-products' },
                { method: 'GET', path: '/analytics/export/orders' },
              ].map((ep) => (
                <div key={ep.path} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(37,99,235,0.1)', color: '#2563eb',
                    letterSpacing: '0.06em', flexShrink: 0,
                  }}>
                    {ep.method}
                  </span>
                  <code style={{ fontSize: 11, color: 'var(--bem-gray-700)', wordBreak: 'break-all' }}>
                    {ep.path}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </Appear>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
