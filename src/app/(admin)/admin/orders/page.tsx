'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { bearerHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

type Order = {
  id: string;
  email: string;
  status: OrderStatus;
  amount: number;
  provider: string;
  payment_status: string;
  created_at: string;
};

const STATUS_LIST: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: 'rgba(245,158,11,0.12)',  text: '#b45309', label: 'En attente' },
  CONFIRMED: { bg: 'rgba(37,99,235,0.12)',   text: '#1d4ed8', label: 'Confirmée' },
  SHIPPED:   { bg: 'rgba(124,58,237,0.12)',  text: '#6d28d9', label: 'Expédiée' },
  DELIVERED: { bg: 'rgba(22,163,74,0.12)',   text: '#15803d', label: 'Livrée' },
  CANCELLED: { bg: 'rgba(107,114,128,0.12)', text: '#4b5563', label: 'Annulée' },
};

const PAGE_SIZE = 20;

function fmtAmount(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' XOF';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function parseCSV(text: string): Order[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const rows = lines.slice(1);
  return rows
    .filter((line) => line.trim())
    .map((line) => {
      const cols = line.split(',');
      return {
        id:             cols[0]?.trim() ?? '',
        email:          cols[1]?.trim() ?? '',
        status:         (cols[2]?.trim() ?? 'PENDING') as OrderStatus,
        amount:         parseFloat(cols[3]?.trim() ?? '0') || 0,
        provider:       cols[4]?.trim() ?? '',
        payment_status: cols[5]?.trim() ?? '',
        created_at:     cols[6]?.trim() ?? '',
      };
    })
    .filter((o) => o.id);
}

function Appear({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(18px)', transition: 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.text,
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
            <td key={j} style={{ padding: '14px 16px' }}>
              <div style={{
                height: 14, borderRadius: 6,
                background: 'var(--bem-gray-100)',
                width: j === 2 ? '80%' : j === 8 ? '60%' : '70%',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.08}s`,
              }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function OrdersPage() {
  const [allOrders, setAllOrders]     = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [page, setPage]               = useState(1);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);

  const headers = { ...bearerHeader(), 'Content-Type': 'application/json' };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/analytics/export/orders`, { headers: bearerHeader() });
      if (!res.ok) throw new Error(`${res.status}`);
      const text = await res.text();
      setAllOrders(parseCSV(text));
    } catch {
      setError('Impossible de charger les commandes. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = allOrders.filter((o) => {
    const matchSearch = !search || o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleStatusFilter = (s: OrderStatus | 'ALL') => { setStatusFilter(s); setPage(1); };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API}/orders/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setAllOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    } catch {
      alert('Erreur lors de la mise à jour du statut.');
    } finally {
      setUpdatingId(null);
    }
  };

  const tabAll: (OrderStatus | 'ALL')[] = ['ALL', ...STATUS_LIST];

  return (
    <div style={{ padding: '2rem', minHeight: '100%' }}>

      <Appear>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 6 }}>
              Gestion
            </p>
            <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--bem-black)', lineHeight: 1.2 }}>
              Commandes
            </h1>
            {!loading && (
              <p style={{ color: 'var(--bem-gray-400)', fontSize: 13, marginTop: 6 }}>
                {filtered.length} commande{filtered.length !== 1 ? 's' : ''}
                {statusFilter !== 'ALL' || search ? ' (filtrées)' : ' au total'}
              </p>
            )}
          </div>

          <button
            onClick={fetchOrders}
            style={{
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
        </div>
      </Appear>

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
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bem-red)', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </Appear>
      )}

      <Appear delay={80}>
        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid var(--bem-gray-100)',
          overflow: 'hidden',
        }}>
          {/* Toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bem-gray-100)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="2"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher par email…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 36, paddingRight: 12,
                  height: 38, borderRadius: 9, border: '1.5px solid var(--bem-gray-100)',
                  fontSize: 13, color: 'var(--bem-black)', outline: 'none',
                  background: 'var(--bem-gray-50)', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--bem-black)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bem-gray-100)')}
              />
            </div>

            {/* Status tabs */}
            <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bem-gray-50)', borderRadius: 10, flexWrap: 'wrap' }}>
              {tabAll.map((s) => {
                const active = statusFilter === s;
                const label = s === 'ALL' ? 'Tous' : STATUS_COLORS[s].label;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusFilter(s)}
                    style={{
                      padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600,
                      background: active ? '#fff' : 'transparent',
                      color: active ? 'var(--bem-black)' : 'var(--bem-gray-400)',
                      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bem-gray-100)' }}>
                  {['ID', 'Email', 'Statut', 'Montant', 'Prestataire', 'Paiement', 'Date', 'Action'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--bem-gray-400)',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--bem-gray-400)', fontSize: 14 }}>
                      {search || statusFilter !== 'ALL'
                        ? 'Aucune commande ne correspond à votre recherche.'
                        : 'Aucune commande trouvée.'}
                    </td>
                  </tr>
                ) : (
                  pageItems.map((order) => (
                    <tr
                      key={order.id}
                      style={{ borderBottom: '1px solid var(--bem-gray-100)', transition: 'background 0.12s' }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bem-gray-50)'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                    >
                      <td style={{ padding: '14px 16px', fontSize: 12, fontFamily: 'monospace', color: 'var(--bem-gray-700)', whiteSpace: 'nowrap' }}>
                        {order.id.slice(0, 8)}…
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--bem-black)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.email}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: 'var(--bem-black)', whiteSpace: 'nowrap' }}>
                        {fmtAmount(order.amount)}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--bem-gray-700)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {order.provider || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 99,
                          fontSize: 11, fontWeight: 700,
                          background: order.payment_status?.toLowerCase() === 'success'
                            ? 'rgba(22,163,74,0.12)' : 'rgba(107,114,128,0.12)',
                          color: order.payment_status?.toLowerCase() === 'success'
                            ? '#15803d' : '#4b5563',
                        }}>
                          {order.payment_status || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--bem-gray-700)', whiteSpace: 'nowrap' }}>
                        {order.created_at ? fmtDate(order.created_at) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          style={{
                            padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--bem-gray-100)',
                            fontSize: 12, fontWeight: 600, color: 'var(--bem-black)',
                            background: updatingId === order.id ? 'var(--bem-gray-50)' : '#fff',
                            cursor: updatingId === order.id ? 'wait' : 'pointer',
                            outline: 'none',
                          }}
                        >
                          {STATUS_LIST.map((s) => (
                            <option key={s} value={s}>{STATUS_COLORS[s].label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderTop: '1px solid var(--bem-gray-100)',
              gap: 12,
            }}>
              <p style={{ fontSize: 13, color: 'var(--bem-gray-400)' }}>
                Page {safePage} sur {totalPages} — {filtered.length} résultats
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  style={{
                    padding: '6px 16px', borderRadius: 8, border: '1.5px solid var(--bem-gray-100)',
                    fontSize: 13, fontWeight: 600, cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                    background: '#fff', color: safePage <= 1 ? 'var(--bem-gray-400)' : 'var(--bem-black)',
                    opacity: safePage <= 1 ? 0.5 : 1, transition: 'all 0.15s',
                  }}
                >
                  ← Préc.
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  style={{
                    padding: '6px 16px', borderRadius: 8, border: '1.5px solid var(--bem-gray-100)',
                    fontSize: 13, fontWeight: 600, cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                    background: '#fff', color: safePage >= totalPages ? 'var(--bem-gray-400)' : 'var(--bem-black)',
                    opacity: safePage >= totalPages ? 0.5 : 1, transition: 'all 0.15s',
                  }}
                >
                  Suiv. →
                </button>
              </div>
            </div>
          )}
        </div>
      </Appear>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
