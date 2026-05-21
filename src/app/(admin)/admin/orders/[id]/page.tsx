'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { bearerHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    imageUrls?: string[];
    price: number;
  };
};

type OrderDetail = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryType: string;
  address?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  payment?: {
    provider: string;
    status: string;
    amount: number;
  } | null;
};

const STATUS_LIST: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string; label: string }> = {
  PENDING:   { bg: 'rgba(245,158,11,0.1)',  text: '#b45309', border: 'rgba(245,158,11,0.3)', label: 'En attente' },
  CONFIRMED: { bg: 'rgba(37,99,235,0.1)',   text: '#1d4ed8', border: 'rgba(37,99,235,0.3)',  label: 'Confirmée' },
  SHIPPED:   { bg: 'rgba(124,58,237,0.1)',  text: '#6d28d9', border: 'rgba(124,58,237,0.3)', label: 'Expédiée' },
  DELIVERED: { bg: 'rgba(22,163,74,0.1)',   text: '#15803d', border: 'rgba(22,163,74,0.3)',  label: 'Livrée' },
  CANCELLED: { bg: 'rgba(107,114,128,0.1)', text: '#4b5563', border: 'rgba(107,114,128,0.3)', label: 'Annulée' },
};

const STATUS_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

function fmtAmount(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' XOF';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function Appear({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 14px', borderRadius: 99,
      fontSize: 12, fontWeight: 700,
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
}

function SkeletonBlock({ h = 120, radius = 16 }: { h?: number; radius?: number }) {
  return (
    <div style={{
      height: h, borderRadius: radius,
      background: 'var(--bem-gray-100)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid var(--bem-gray-100)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{
      padding: '18px 24px',
      borderBottom: '1px solid var(--bem-gray-100)',
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--bem-black)' }}>{title}</p>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--bem-gray-400)', marginTop: 2 }}>{subtitle}</p>}
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 24px',
      borderBottom: '1px solid var(--bem-gray-50)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--bem-gray-400)', fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: 13, color: 'var(--bem-black)', fontWeight: 600,
        fontFamily: mono ? 'monospace' : 'inherit',
        textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all',
      }}>
        {value}
      </span>
    </div>
  );
}

function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') return null;
  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div style={{ padding: '20px 24px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 16, left: 16, right: 16, height: 2,
          background: 'var(--bem-gray-100)',
        }} />
        <div style={{
          position: 'absolute', top: 16, left: 16, height: 2,
          width: currentIdx === 0 ? 0 : `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%`,
          background: 'var(--bem-red)',
          transition: 'width 0.5s ease',
        }} />

        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--bem-red)' : '#fff',
                border: `2px solid ${done ? 'var(--bem-red)' : 'var(--bem-gray-100)'}`,
                transition: 'all 0.3s',
                boxShadow: current ? '0 0 0 4px rgba(204,31,39,0.15)' : 'none',
              }}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bem-gray-100)' }} />
                )}
              </div>
              <p style={{
                fontSize: 10, fontWeight: done ? 700 : 500,
                color: done ? 'var(--bem-black)' : 'var(--bem-gray-400)',
                textAlign: 'center', letterSpacing: '0.04em',
              }}>
                {STATUS_COLORS[step].label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/orders/admin/${orderId}`, { headers: bearerHeader() });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setOrder(data);
    } catch {
      setError('Impossible de charger les détails de la commande.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order || updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { ...bearerHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setOrder((prev) => prev ? { ...prev, status } : prev);
      showToast('Statut mis à jour avec succès');
    } catch {
      showToast('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdating(false);
    }
  };

  const subtotal = order?.items?.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0) ?? 0;

  return (
    <div className="admin-content">

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: 'var(--bem-black)', color: '#fff',
          padding: '12px 20px', borderRadius: 12,
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <Appear>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/admin/orders" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: 'var(--bem-gray-400)', fontSize: 12, fontWeight: 600,
              transition: 'color 0.15s',
            }}
              onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.color = 'var(--bem-black)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.color = 'var(--bem-gray-400)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Retour aux commandes
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 6 }}>
                Commande
              </p>
              <h1 style={{
                fontFamily: 'monospace',
                fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)', fontWeight: 800,
                color: 'var(--bem-black)', lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}>
                #{orderId?.slice(0, 8).toUpperCase()}…
              </h1>
              {order && (
                <p style={{ color: 'var(--bem-gray-400)', fontSize: 12, marginTop: 4 }}>
                  {fmtDate(order.createdAt)}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {order && <StatusBadge status={order.status} />}
              <button
                onClick={fetchOrder}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0 16px', height: 36, borderRadius: 10,
                  border: '1.5px solid var(--bem-gray-100)',
                  background: '#fff', color: 'var(--bem-gray-700)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </Appear>

      {/* Error */}
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
            <button onClick={fetchOrder} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bem-red)', fontSize: 12, fontWeight: 600 }}>
              Réessayer
            </button>
          </div>
        </Appear>
      )}

      {loading ? (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 340px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonBlock h={160} />
            <SkeletonBlock h={260} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonBlock h={180} />
            <SkeletonBlock h={140} />
          </div>
        </div>
      ) : order ? (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0,1fr) 340px' }} className="order-detail-grid">

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status tracker */}
            <Appear delay={60}>
              <Card>
                <CardHeader
                  title="Progression de la commande"
                  subtitle={order.status === 'CANCELLED' ? 'Cette commande a été annulée' : undefined}
                />
                {order.status === 'CANCELLED' ? (
                  <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'rgba(107,114,128,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--bem-gray-400)' }}>
                      Cette commande a été annulée et ne peut plus être traitée.
                    </p>
                  </div>
                ) : (
                  <OrderProgress status={order.status} />
                )}
              </Card>
            </Appear>

            {/* Items */}
            <Appear delay={120}>
              <Card>
                <CardHeader
                  title="Articles commandés"
                  subtitle={`${order.items.length} article${order.items.length !== 1 ? 's' : ''}`}
                />
                {order.items.length > 0 ? (
                  <>
                    <div>
                      {order.items.map((item, i) => (
                        <div key={item.id} style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 24px',
                          borderBottom: i < order.items.length - 1 ? '1px solid var(--bem-gray-50)' : 'none',
                        }}>
                          <div style={{
                            width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                            background: 'var(--bem-gray-50)',
                            border: '1px solid var(--bem-gray-100)',
                            overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {item.product.imageUrls?.[0] ? (
                              <img
                                src={item.product.imageUrls[0]}
                                alt={item.product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="3"/>
                                <polyline points="3 9 7 5 11 9 15 5 19 9"/>
                                <polyline points="3 15 7 19 11 15 15 19 19 15"/>
                              </svg>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--bem-black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.product.name}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--bem-gray-400)', marginTop: 2 }}>
                              Qté : {item.quantity} × {fmtAmount(Number(item.unitPrice))}
                            </p>
                          </div>

                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--bem-black)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {fmtAmount(Number(item.unitPrice) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      padding: '14px 24px',
                      background: 'var(--bem-gray-50)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--bem-black)' }}>Total</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--bem-black)' }}>
                        {fmtAmount(Number(order.totalAmount) || subtotal)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '28px 24px', textAlign: 'center', color: 'var(--bem-gray-400)', fontSize: 13 }}>
                    Aucun article disponible pour cette commande.
                  </div>
                )}
              </Card>
            </Appear>

            {/* Full ID */}
            <Appear delay={160}>
              <Card style={{ padding: '16px 24px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: 6 }}>
                  Identifiant complet
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--bem-gray-700)', wordBreak: 'break-all', userSelect: 'all' }}>
                  {orderId}
                </p>
              </Card>
            </Appear>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status update */}
            <Appear delay={80}>
              <Card>
                <CardHeader title="Mettre à jour le statut" />
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {STATUS_LIST.map((s) => {
                    const isActive = order.status === s;
                    const c = STATUS_COLORS[s];
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={isActive || updating}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 10, border: 'none',
                          background: isActive ? c.bg : 'var(--bem-gray-50)',
                          color: isActive ? c.text : 'var(--bem-gray-700)',
                          fontSize: 12, fontWeight: isActive ? 700 : 500,
                          cursor: isActive || updating ? 'default' : 'pointer',
                          textAlign: 'left', width: '100%',
                          outline: isActive ? `2px solid ${c.border}` : 'none',
                          outlineOffset: -1,
                          transition: 'all 0.15s',
                          opacity: updating && !isActive ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive && !updating) {
                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bem-gray-100)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive && !updating) {
                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bem-gray-50)';
                          }
                        }}
                      >
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: isActive ? c.text : 'var(--bem-gray-400)',
                        }} />
                        {c.label}
                        {isActive && (
                          <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        {updating && !isActive && (
                          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--bem-gray-400)' }}>…</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </Appear>

            {/* Customer info */}
            <Appear delay={140}>
              <Card>
                <CardHeader title="Client" />
                <div>
                  <InfoRow
                    label="Email"
                    value={
                      <a href={`mailto:${order.user.email}`} style={{ color: 'var(--bem-black)', textDecoration: 'none' }}>
                        {order.user.email}
                      </a>
                    }
                  />
                  {(order.user.firstName || order.user.lastName) && (
                    <InfoRow
                      label="Nom"
                      value={`${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim()}
                    />
                  )}
                </div>
              </Card>
            </Appear>

            {/* Payment info */}
            <Appear delay={180}>
              <Card>
                <CardHeader title="Paiement & Livraison" />
                <div>
                  <InfoRow label="Mode de livraison" value={
                    order.deliveryType === 'HOME' ? 'Livraison à domicile' : 'Retrait sur le campus'
                  } />
                  {order.address && (
                    <InfoRow label="Adresse" value={order.address} />
                  )}
                  <InfoRow label="Prestataire" value={order.payment?.provider || '—'} />
                  <InfoRow
                    label="Statut paiement"
                    value={
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 99,
                        fontSize: 11, fontWeight: 700,
                        background: order.payment?.status?.toLowerCase() === 'success'
                          ? 'rgba(22,163,74,0.12)' : 'rgba(107,114,128,0.12)',
                        color: order.payment?.status?.toLowerCase() === 'success'
                          ? '#15803d' : '#4b5563',
                      }}>
                        {order.payment?.status || '—'}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Montant total"
                    value={<span style={{ color: 'var(--bem-red)', fontWeight: 800 }}>{fmtAmount(Number(order.totalAmount))}</span>}
                  />
                  <InfoRow label="Date de commande" value={fmtDate(order.createdAt)} />
                  {order.updatedAt && order.updatedAt !== order.createdAt && (
                    <InfoRow label="Dernière mise à jour" value={fmtDate(order.updatedAt)} />
                  )}
                </div>
              </Card>
            </Appear>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) {
          .order-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
