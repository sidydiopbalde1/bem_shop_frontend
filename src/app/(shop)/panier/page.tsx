'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { CartItem } from '@/lib/types/shop.types';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { bearerHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

/* ─── Skeleton ──────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          border: '1px solid var(--bem-gray-100)', borderRadius: '14px', overflow: 'hidden',
          animation: 'shimmer 1.4s ease infinite', animationDelay: `${i * 0.12}s`,
        }}>
          <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
            <div style={{ width: 100, height: 100, borderRadius: '10px', background: 'var(--bem-gray-100)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
              <div style={{ height: '13px', borderRadius: '99px', background: 'var(--bem-gray-100)', width: '60%' }} />
              <div style={{ height: '11px', borderRadius: '99px', background: 'var(--bem-gray-100)', width: '35%' }} />
              <div style={{ height: '11px', borderRadius: '99px', background: 'var(--bem-gray-100)', width: '45%', marginTop: '12px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Empty ─────────────────────────────────────────────────── */
function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0 120px', textAlign: 'center' }}
    >
      <div style={{
        width: 96, height: 96, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bem-gray-50)', border: '2px solid var(--bem-gray-100)', marginBottom: '28px', position: 'relative',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="1.4">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <span style={{
          position: 'absolute', top: '-4px', right: '-4px', width: '22px', height: '22px',
          borderRadius: '50%', background: 'var(--bem-red)', color: '#fff',
          fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>0</span>
      </div>
      <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '10px' }}>Votre panier est vide</h2>
      <p style={{ fontSize: '13px', color: 'var(--bem-gray-400)', lineHeight: 1.6, maxWidth: '280px', marginBottom: '36px' }}>
        Découvrez notre collection et ajoutez vos articles préférés.
      </p>
      <Link href="/catalogue" style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'var(--bem-black)', color: '#fff',
        padding: '13px 32px', borderRadius: '99px',
        fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textDecoration: 'none',
      }}>
        Voir le catalogue →
      </Link>
    </motion.div>
  );
}

/* ─── Cart item ─────────────────────────────────────────────── */
function CartRow({ item, onRemove, onQty, removing }: {
  item: CartItem;
  onRemove: (id: string) => void;
  onQty: (id: string, qty: number) => void;
  removing: boolean;
}) {
  const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: removing ? 0 : 1, scale: removing ? 0.98 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.22 } }}
      transition={{ duration: 0.3 }}
      style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--bem-gray-100)', background: '#fff' }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
        {/* Image */}
        <Link href={`/produits/${item.product.id}`} style={{ flexShrink: 0 }}>
          <div style={{
            width: 100, height: 100, borderRadius: '10px',
            background: 'var(--bem-gray-50)', overflow: 'hidden', position: 'relative',
          }}>
            {item.product.imageUrls?.[0] ? (
              <Image src={item.product.imageUrls[0]} alt={item.product.name}
                fill className="object-cover" sizes="100px" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--bem-gray-50)' }} />
            )}
          </div>
        </Link>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Top */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/produits/${item.product.id}`} style={{ textDecoration: 'none' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bem-black)', lineHeight: 1.35 }}>
                  {item.product.name}
                </p>
              </Link>
              <p style={{ fontSize: '12px', color: 'var(--bem-gray-400)', marginTop: '4px' }}>
                {fmt(price)} / unité
              </p>
            </div>
            <button
              onClick={() => onRemove(item.product.id)}
              aria-label="Supprimer"
              style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: 'transparent', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--bem-gray-400)',
                flexShrink: 0, transition: 'all .15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#fef2f2';
                (e.currentTarget as HTMLElement).style.color = 'var(--bem-red)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--bem-gray-400)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Bottom: qty + total */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            {/* Qty */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              border: '1.5px solid var(--bem-gray-100)', borderRadius: '99px',
              background: 'var(--bem-gray-50)', overflow: 'hidden',
            }}>
              {(['−', String(item.quantity), '+'] as const).map((v, idx) => (
                idx === 1 ? (
                  <span key="num" style={{ width: 28, textAlign: 'center', fontSize: '13px', fontWeight: 700, userSelect: 'none' }}>
                    {v}
                  </span>
                ) : (
                  <button
                    key={v}
                    onClick={() => {
                      if (v === '−' && item.quantity <= 1) return;
                      onQty(item.product.id, item.quantity + (v === '+' ? 1 : -1));
                    }}
                    style={{
                      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '17px', fontWeight: 300, border: 'none', background: 'transparent',
                      cursor: v === '−' && item.quantity <= 1 ? 'not-allowed' : 'pointer',
                      color: v === '−' && item.quantity <= 1 ? 'var(--bem-gray-100)' : 'var(--bem-black)',
                      transition: 'background .15s',
                    }}
                  >
                    {v}
                  </button>
                )
              ))}
            </div>
            <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--bem-black)' }}>
              {fmt(price * item.quantity)}
            </p>
          </div>
        </div>
      </div>

      {/* Separator tag */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '7px 20px',
        background: 'var(--bem-gray-50)', borderTop: '1px solid var(--bem-gray-100)',
      }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--bem-gray-100)' }} />
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--bem-gray-400)' }}>
          Vendeur officiel BEM
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--bem-gray-100)' }} />
      </div>
    </motion.div>
  );
}

/* ─── Order confirmed ───────────────────────────────────────── */
function OrderConfirmed({ orderId }: { orderId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ maxWidth: '560px', margin: '60px auto 100px', textAlign: 'center' }}
    >
      {/* Check icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        style={{
          width: 72, height: 72, borderRadius: '50%', background: '#dcfce7',
          border: '2px solid #86efac', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </motion.div>

      <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', color: 'var(--bem-black)' }}>
        Commande confirmée !
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--bem-gray-400)', marginBottom: '6px' }}>
        Un email de confirmation vous a été envoyé.
      </p>

      {/* Order ID */}
      <div style={{
        display: 'inline-block', margin: '6px 0 28px',
        padding: '8px 18px', borderRadius: '8px',
        background: 'var(--bem-gray-50)', border: '1px solid var(--bem-gray-100)',
      }}>
        <span style={{ fontSize: '10px', color: 'var(--bem-gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
          Numéro de commande
        </span>
        <p style={{ margin: '2px 0 0', fontFamily: 'monospace', fontSize: '14px', fontWeight: 800, color: 'var(--bem-black)' }}>
          #{orderId.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Pickup info */}
      <div style={{
        background: '#fef9f0', border: '1px solid #fde68a', borderRadius: '12px',
        padding: '20px 24px', marginBottom: '16px', textAlign: 'left' as const,
      }}>
        <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 800, color: 'var(--bem-black)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          📍 Lieu de récupération
        </p>
        <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: 'var(--bem-black)' }}>
          BEM Shop — Campus de Dakar
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--bem-gray-700)', lineHeight: 1.7 }}>
          Université Cheikh Anta Diop (UCAD), Dakar<br/>
          Lun – Ven : 08h00 – 18h00 · Sam : 09h00 – 14h00
        </p>
        <div style={{
          marginTop: '12px', padding: '8px 12px', borderRadius: '6px',
          background: '#fef3c7', fontSize: '12px', color: '#92400e', fontWeight: 600,
        }}>
          Présentez le numéro #{orderId.slice(0, 8).toUpperCase()} à la récupération
        </div>
      </div>

      {/* Payment methods */}
      <div style={{
        background: 'var(--bem-gray-50)', border: '1px solid var(--bem-gray-100)',
        borderRadius: '12px', padding: '16px 24px', marginBottom: '28px', textAlign: 'left' as const,
      }}>
        <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 800, color: 'var(--bem-black)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          💳 Paiement à la récupération
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
          {['Espèces', 'Orange Money', 'Wave', 'Free Money'].map((m) => (
            <span key={m} style={{
              padding: '5px 12px', borderRadius: '20px',
              background: '#fff', border: '1px solid var(--bem-gray-100)',
              fontSize: '12px', fontWeight: 600, color: 'var(--bem-black)',
            }}>{m}</span>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '12px', justifyContent: 'center' }}>
        <Link href="/compte" style={{
          padding: '13px 28px', borderRadius: '99px', background: 'var(--bem-black)',
          color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
        }}>
          Voir mes commandes
        </Link>
        <Link href="/catalogue" style={{
          padding: '13px 28px', borderRadius: '99px',
          border: '1.5px solid var(--bem-gray-100)', color: 'var(--bem-black)',
          fontSize: '13px', fontWeight: 700, textDecoration: 'none',
        }}>
          Continuer les achats
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── Summary sidebar ───────────────────────────────────────── */
function Summary({ subtotal, loading, error, onCheckout }: {
  subtotal: number; loading: boolean; error: string | null; onCheckout: () => void;
}) {
  const [promo, setPromo] = useState('');

  return (
    <div style={{ borderRadius: '16px', border: '1px solid var(--bem-gray-100)', background: '#fff', overflow: 'hidden', position: 'sticky', top: '96px' }}>
      {/* Head */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bem-gray-100)' }}>
        <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--bem-black)' }}>Récapitulatif</p>
      </div>

      {/* Lines */}
      <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          { label: 'Sous-total', val: fmt(subtotal) },
          { label: 'Récupération', val: 'Sur campus', green: true },
        ].map(({ label, val, green }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: 'var(--bem-gray-700)' }}>{label}</span>
            <span style={{ fontWeight: 600, color: green ? '#16a34a' : 'var(--bem-black)' }}>{val}</span>
          </div>
        ))}

        {/* Promo */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder="Code promo…"
            style={{
              flex: 1, height: '36px', border: '1.5px solid var(--bem-gray-100)',
              borderRadius: '8px', padding: '0 12px', fontSize: '12px', outline: 'none',
              color: 'var(--bem-black)', background: '#fff',
            }}
          />
          <button style={{
            height: '36px', padding: '0 14px', borderRadius: '8px',
            background: 'var(--bem-black)', color: '#fff',
            fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer',
            letterSpacing: '0.06em',
          }}>
            OK
          </button>
        </div>
      </div>

      {/* Total */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', borderTop: '1px solid var(--bem-gray-100)', borderBottom: '1px solid var(--bem-gray-100)',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700 }}>Total</span>
        <span style={{ fontSize: '22px', fontWeight: 900 }}>{fmt(subtotal)}</span>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: '16px 24px 0', padding: '12px 16px', borderRadius: '10px',
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px',
        }}>
          {error}
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onCheckout}
          disabled={loading}
          style={{
            width: '100%', height: '52px', borderRadius: '10px',
            background: loading ? 'var(--bem-gray-100)' : 'var(--bem-black)',
            color: loading ? 'var(--bem-gray-400)' : '#fff',
            fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background .2s',
          }}
        >
          {loading ? (
            <>
              <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Traitement…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Passer la commande
            </>
          )}
        </motion.button>

        {/* Trust */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: 'Paiement sécurisé' },
            { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>, label: 'Retour 7 jours' },
          ].map((b) => (
            <div key={b.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
              padding: '10px 8px', borderRadius: '8px', background: 'var(--bem-gray-50)',
              fontSize: '10px', fontWeight: 600, color: 'var(--bem-gray-400)', textAlign: 'center',
            }}>
              {b.icon}
              {b.label}
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '10px', color: 'var(--bem-gray-400)', letterSpacing: '0.05em' }}>
          Espèces · Orange Money · Wave · Free Money
        </p>
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--bem-gray-50)', border: '1px solid var(--bem-gray-100)' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--bem-gray-700)', textAlign: 'center', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700 }}>📍 Paiement à la récupération</span><br/>
            Campus BEM · UCAD, Dakar
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function PanierPage() {
  const router = useRouter();
  const { items, ready, removeItem, updateQty, clearCart } = useCart();
  const { user } = useAuth();
  const [removing, setRemoving]       = useState<Set<string>>(new Set());
  const [checkoutLoading, setLoading] = useState(false);
  const [checkoutError, setError]     = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  async function handleRemove(productId: string) {
    setRemoving((s) => new Set(s).add(productId));
    setTimeout(() => {
      removeItem(productId);
      setRemoving((s) => { const n = new Set(s); n.delete(productId); return n; });
    }, 260);
  }

  const handleCheckout = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const headers = bearerHeader();
      if (!headers.Authorization) {
        sessionStorage.setItem('redirect_after_login', '/panier');
        sessionStorage.setItem('checkout_pending', 'true');
        router.push('/compte');
        return;
      }

      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          deliveryType: 'CAMPUS',
        }),
      });

      if (res.status === 401) {
        sessionStorage.setItem('redirect_after_login', '/panier');
        sessionStorage.setItem('checkout_pending', 'true');
        router.push('/compte');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.message ?? 'Une erreur est survenue.');
        return;
      }
      const order = await res.json();
      clearCart();
      setConfirmedId(order.id);
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  }, [items, clearCart, router]);

  /* Auto-déclenche le checkout si l'utilisateur vient de se connecter */
  useEffect(() => {
    if (!ready || !user || items.length === 0) return;
    const pending = sessionStorage.getItem('checkout_pending');
    if (pending === 'true') {
      sessionStorage.removeItem('checkout_pending');
      handleCheckout();
    }
  }, [ready, user, items.length, handleCheckout]);

  const subtotal = items.reduce((s, i) => {
    const p = typeof i.product.price === 'string' ? parseFloat(i.product.price) : i.product.price;
    return s + p * i.quantity;
  }, 0);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const isLoading = !ready && items.length === 0;

  if (confirmedId) {
    return (
      <div className="panier-container">
        <OrderConfirmed orderId={confirmedId} />
      </div>
    );
  }

  return (
    <div className="panier-container">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px' }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--bem-black)', lineHeight: 1 }}>
            Mon panier
          </h1>
          {!isLoading && items.length > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--bem-gray-400)', marginTop: '6px' }}>
              {totalQty} article{totalQty > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link href="/catalogue" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '12px', fontWeight: 500, color: 'var(--bem-gray-400)',
          textDecoration: 'none', transition: 'color .15s',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Continuer les achats
        </Link>
      </motion.div>

      {/* Body */}
      {isLoading ? (
        <Skeleton />
      ) : items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="cart-page-layout">

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.35 }}
                >
                  <CartRow
                    item={item}
                    onRemove={handleRemove}
                    onQty={(id, qty) => updateQty(id, qty)}
                    removing={removing.has(item.product.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
            <Summary
              subtotal={subtotal}
              loading={checkoutLoading}
              error={checkoutError}
              onCheckout={handleCheckout}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
