'use client';

import { useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

const SUBJECTS = [
  'Commande & livraison',
  'Retour & échange',
  'Produit indisponible',
  'Partenariat',
  'Autre',
];

const INFOS = [
  {
    label: 'E-mail',
    value: 'boutique@bem.sn',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    href: 'mailto:boutique@bem.sn',
  },
  {
    label: 'Campus',
    value: 'BEM Dakar — Dakar, Sénégal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    href: undefined,
  },
  {
    label: 'Réseaux sociaux',
    value: 'bemdkr',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
    href: 'https://www.instagram.com/bemdkr',
  },
  {
    label: 'Délai de réponse',
    value: 'Sous 24–48 h ouvrées',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    href: undefined,
  },
];

const FAQ = [
  {
    q: 'Où sont fabriqués vos produits ?',
    a: 'Nos produits sont conçus avec soin et fabriqués en partenariat avec des producteurs locaux et internationaux sélectionnés pour la qualité de leurs matériaux.',
  },
  {
    q: 'Quels sont les délais de livraison ?',
    a: 'Les commandes sont traitées sous 48 h ouvrées. La livraison campus est disponible. Les délais de livraison externe varient de 3 à 7 jours ouvrés.',
  },
  {
    q: 'Puis-je retourner un article ?',
    a: 'Oui. Vous disposez de 14 jours après réception pour nous signaler tout défaut. Les retours sont pris en charge pour les articles défectueux.',
  },
  {
    q: 'Comment suivre ma commande ?',
    a: 'Connectez-vous à votre espace client sur la page "Mon compte" pour suivre l\'état de vos commandes en temps réel.',
  },
];

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: '100%', height: 48, padding: '0 16px', borderRadius: 12,
    border: `1.5px solid ${focused ? 'var(--bem-black)' : 'var(--bem-gray-100)'}`,
    background: focused ? '#fff' : 'var(--bem-gray-50)',
    fontSize: 13, color: 'var(--bem-black)', outline: 'none',
    boxShadow: focused ? '0 0 0 3px rgba(13,13,13,0.06)' : 'none',
    transition: 'all 0.18s',
    boxSizing: 'border-box' as const,
  };
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid var(--bem-gray-100)', borderRadius: 14,
      overflow: 'hidden', background: '#fff',
    }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', textAlign: 'left',
          padding: '18px 20px', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--bem-black)', lineHeight: 1.4 }}>{q}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="2.2"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 20px 18px', fontSize: 13, color: 'var(--bem-gray-700)', lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [focused, setFocused] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Une erreur est survenue.');
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bem-black)', padding: 'clamp(48px, 8vw, 72px) clamp(20px, 5vw, 48px) clamp(40px, 6vw, 56px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(204,31,39,0.08)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 12 }}>
            On est là pour vous
          </p>
          <h1 style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 16,
          }}>
            Contactez-nous
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 480 }}>
            Une question, une suggestion, un problème de commande ? Notre équipe vous répond sous 48 h.
          </p>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(40px, 6vw, 64px) clamp(20px, 5vw, 48px)' }}>
        <div
          style={{ gap: 48, alignItems: 'start' }}
          className="grid grid-cols-1 lg:grid-cols-[1fr_420px]"
        >

          {/* ── Form ── */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--bem-black)', marginBottom: 6 }}>
              Envoyez-nous un message
            </h2>
            <p style={{ fontSize: 13, color: 'var(--bem-gray-400)', marginBottom: 28 }}>
              Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
            </p>

            {sent ? (
              <div style={{
                padding: '32px 28px', borderRadius: 20,
                background: 'rgba(22,163,74,0.06)',
                border: '1px solid rgba(22,163,74,0.2)',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(22,163,74,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>
                  Message envoyé !
                </h3>
                <p style={{ fontSize: 13, color: 'var(--bem-gray-700)', lineHeight: 1.6, marginBottom: 20 }}>
                  Merci pour votre message. Nous vous répondrons dans les meilleurs délais (sous 24–48 h ouvrées).
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  style={{
                    padding: '10px 24px', borderRadius: 99,
                    border: '1.5px solid rgba(22,163,74,0.3)',
                    background: '#fff', color: '#15803d',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 12,
                    background: 'rgba(204,31,39,0.07)', border: '1px solid rgba(204,31,39,0.2)',
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--bem-red)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p style={{ fontSize: 13, color: 'var(--bem-red)' }}>{error}</p>
                  </div>
                )}

                {/* Nom + Email */}
                <div style={{ gap: 14 }} className="grid grid-cols-1 sm:grid-cols-2">
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: 7 }}>
                      Nom complet *
                    </label>
                    <input
                      type="text" required placeholder="Fama Diallo"
                      value={form.name} onChange={set('name')}
                      style={inputStyle(focused === 'name')}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused(null)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: 7 }}>
                      Adresse e-mail *
                    </label>
                    <input
                      type="email" required placeholder="fama@exemple.sn"
                      value={form.email} onChange={set('email')}
                      style={inputStyle(focused === 'email')}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                    />
                  </div>
                </div>

                {/* Sujet */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: 7 }}>
                    Sujet *
                  </label>
                  <select
                    required value={form.subject} onChange={set('subject')}
                    style={{
                      width: '100%', height: 48, padding: '0 44px 0 16px', borderRadius: 12,
                      border: `1.5px solid ${focused === 'subject' ? 'var(--bem-black)' : 'var(--bem-gray-100)'}`,
                      backgroundColor: focused === 'subject' ? '#fff' : 'var(--bem-gray-50)',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 16px center',
                      fontSize: 13, outline: 'none', appearance: 'none',
                      boxShadow: focused === 'subject' ? '0 0 0 3px rgba(13,13,13,0.06)' : 'none',
                      transition: 'all 0.18s', boxSizing: 'border-box',
                      color: form.subject ? 'var(--bem-black)' : 'var(--bem-gray-400)',
                      cursor: 'pointer',
                    }}
                    onFocus={() => setFocused('subject')}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="" disabled>Choisir un sujet</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: 7 }}>
                    Message *
                  </label>
                  <textarea
                    required rows={6} placeholder="Décrivez votre demande en détail…"
                    value={form.message} onChange={set('message')}
                    style={{
                      ...inputStyle(focused === 'message'),
                      height: 'auto', padding: '14px 16px',
                      resize: 'vertical', lineHeight: 1.6,
                    }}
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused(null)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    height: 50, borderRadius: 12, border: 'none',
                    background: busy ? 'var(--bem-gray-400)' : 'var(--bem-black)',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: busy ? 'none' : '0 4px 20px rgba(13,13,13,0.2)',
                    transition: 'background 0.2s, box-shadow 0.2s',
                    alignSelf: 'stretch',
                  }}
                  onMouseEnter={(e) => { if (!busy) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  {busy ? (
                    <>
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff', display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      Envoyer le message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Contact info */}
            <div style={{
              background: 'var(--bem-black)', borderRadius: 20,
              padding: '28px 24px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(204,31,39,0.12)', pointerEvents: 'none' }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 16 }}>
                Nous joindre
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {INFOS.map((info) => (
                  <div key={info.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.6)',
                    }}>
                      {info.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>
                        {info.label}
                      </p>
                      {info.href ? (
                        <a href={info.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#fff', fontWeight: 500, textDecoration: 'none' }}>
                          {info.value}
                        </a>
                      ) : (
                        <p style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social links */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
                Suivez-nous
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'TikTok',    href: 'https://www.tiktok.com/@bemdkr', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg> },
                  { label: 'Instagram', href: 'https://www.instagram.com/bemdkr/', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
                  { label: 'Facebook',  href: 'https://www.facebook.com/bemdakar', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
                  { label: 'LinkedIn',  href: 'https://www.linkedin.com/school/bemdakar/posts/?feedView=all', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
                ].map((s) => (
                  <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    transition: 'background 0.15s, color 0.15s',
                    textDecoration: 'none',
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(204,31,39,0.3)'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)'; }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div style={{ background: 'var(--bem-gray-50)', borderRadius: 20, border: '1px solid var(--bem-gray-100)', padding: '22px 24px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: 14 }}>
                Liens utiles
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Suivre ma commande', href: '/compte' },
                  { label: 'Voir le catalogue', href: '/catalogue' },
                  { label: 'À propos de BEM', href: '/a-propos' },
                ].map((l) => (
                  <Link key={l.label} href={l.href} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 10,
                    background: '#fff', border: '1px solid var(--bem-gray-100)',
                    fontSize: 13, fontWeight: 500, color: 'var(--bem-black)',
                    textDecoration: 'none', transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bem-black)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--bem-gray-100)')}
                  >
                    {l.label}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bem-gray-50)', padding: 'clamp(40px, 6vw, 64px) clamp(20px, 5vw, 48px)', borderTop: '1px solid var(--bem-gray-100)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 10 }}>
              Questions fréquentes
            </p>
            <h2 style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 800, color: 'var(--bem-black)',
            }}>
              On répond à vos questions
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
