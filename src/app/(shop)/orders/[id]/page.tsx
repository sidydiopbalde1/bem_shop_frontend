'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { bearerHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number | string;
  product: {
    id: string;
    name: string;
    imageUrls?: string[];
  };
};

type OrderDetail = {
  id: string;
  status: OrderStatus;
  totalAmount: number | string;
  deliveryType: string;
  address?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  payment?: {
    provider: string;
    status: string;
    amount: number;
  } | null;
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string; label: string }> = {
  PENDING:   { bg: 'rgba(245,158,11,0.1)',  text: '#b45309', border: 'rgba(245,158,11,0.3)', label: 'En attente' },
  CONFIRMED: { bg: 'rgba(37,99,235,0.1)',   text: '#1d4ed8', border: 'rgba(37,99,235,0.3)',  label: 'Confirmée' },
  SHIPPED:   { bg: 'rgba(124,58,237,0.1)',  text: '#6d28d9', border: 'rgba(124,58,237,0.3)', label: 'Expédiée' },
  DELIVERED: { bg: 'rgba(22,163,74,0.1)',   text: '#15803d', border: 'rgba(22,163,74,0.3)',  label: 'Livrée' },
  CANCELLED: { bg: 'rgba(107,114,128,0.1)', text: '#4b5563', border: 'rgba(107,114,128,0.3)', label: 'Annulée' },
};

const STATUS_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' XOF';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

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
    <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--bem-gray-100)' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--bem-black)' }}>{title}</p>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--bem-gray-400)', marginTop: 2 }}>{subtitle}</p>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 24px',
      borderBottom: '1px solid var(--bem-gray-50)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--bem-gray-400)', fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: 13, color: 'var(--bem-black)', fontWeight: 600,
        textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word',
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
          width: currentIdx <= 0 ? 0 : `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%`,
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

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/orders/${orderId}`, {
        headers: bearerHeader(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setOrder(data);
    } catch {
      setError('Impossible de charger les détails de cette commande.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const subtotal = order?.items?.reduce(
    (acc, item) => acc + Number(item.unitPrice) * item.quantity, 0
  ) ?? 0;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(24px, 4vw, 48px) clamp(16px, 4vw, 48px) calc(80px + 24px)' }}>

      {/* Back link */}
      <Link href="/compte" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
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
          Mes commandes
        </div>
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
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
              #{orderId?.slice(0, 8).toUpperCase()}
            </h1>
            {order && (
              <p style={{ color: 'var(--bem-gray-400)', fontSize: 12, marginTop: 4 }}>
                {fmtDate(order.createdAt)}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {order && <StatusBadge status={order.status} />}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
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
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SkeletonBlock h={160} />
          <SkeletonBlock h={260} />
          <SkeletonBlock h={140} />
        </div>
      ) : order ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Progress */}
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
                  Cette commande a été annulée.
                </p>
              </div>
            ) : (
              <OrderProgress status={order.status} />
            )}
          </Card>

          {/* Items */}
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
                        position: 'relative',
                      }}>
                        {item.product.imageUrls?.[0] ? (
                          <Image
                            src={item.product.imageUrls[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="52px"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'var(--bem-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="3"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/produits/${item.product.id}`} style={{ textDecoration: 'none' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--bem-black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.product.name}
                          </p>
                        </Link>
                        <p style={{ fontSize: 12, color: 'var(--bem-gray-400)', marginTop: 2 }}>
                          Qté : {item.quantity} × {fmt(Number(item.unitPrice))}
                        </p>
                      </div>

                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--bem-black)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {fmt(Number(item.unitPrice) * item.quantity)}
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
                    {fmt(Number(order.totalAmount) || subtotal)}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ padding: '28px 24px', textAlign: 'center', color: 'var(--bem-gray-400)', fontSize: 13 }}>
                Aucun article disponible pour cette commande.
              </div>
            )}
          </Card>

          {/* Delivery & Payment */}
          <Card>
            <CardHeader title="Livraison & Paiement" />
            <div>
              <InfoRow label="Mode de récupération" value={
                order.deliveryType === 'HOME' ? 'Livraison à domicile' : 'Retrait sur le campus'
              } />
              {order.address && <InfoRow label="Adresse" value={order.address} />}
              {order.payment?.provider && <InfoRow label="Prestataire" value={order.payment.provider} />}
              {order.payment?.status && (
                <InfoRow label="Statut paiement" value={
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: 99,
                    fontSize: 11, fontWeight: 700,
                    background: order.payment.status.toLowerCase() === 'success'
                      ? 'rgba(22,163,74,0.12)' : 'rgba(107,114,128,0.12)',
                    color: order.payment.status.toLowerCase() === 'success'
                      ? '#15803d' : '#4b5563',
                  }}>
                    {order.payment.status}
                  </span>
                } />
              )}
              <InfoRow label="Montant total" value={
                <span style={{ color: 'var(--bem-red)', fontWeight: 800 }}>
                  {fmt(Number(order.totalAmount))}
                </span>
              } />
              <InfoRow label="Date de commande" value={fmtDate(order.createdAt)} />
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <InfoRow label="Dernière mise à jour" value={fmtDate(order.updatedAt)} />
              )}
            </div>
          </Card>

          {/* Pickup info */}
          <div style={{
            background: '#fef9f0', border: '1px solid #fde68a', borderRadius: 16,
            padding: '20px 24px',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: 'var(--bem-black)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Lieu de récupération
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--bem-black)' }}>
              BEM Shop — Campus de Dakar
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--bem-gray-700)', lineHeight: 1.7 }}>
              Sacré Coeur 3 Pyrotechnique, Dakar<br/>
              Lun – Ven : 08h00 – 18h00 · Sam : 09h00 – 14h00
            </p>
            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 6,
              background: '#fef3c7', fontSize: 12, color: '#92400e', fontWeight: 600,
            }}>
              Présentez le numéro #{orderId?.slice(0, 8).toUpperCase()} à la récupération
            </div>
          </div>

        </div>
      ) : null}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
