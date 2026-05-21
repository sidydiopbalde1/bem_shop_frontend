'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { bearerHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

/* ── icons ── */
const IconAnalytics = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconOrders = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IconProducts = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconShop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconMessages = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const NAV = [
  { href: '/admin/analytics', label: 'Analytics',      icon: <IconAnalytics /> },
  { href: '/admin/orders',    label: 'Commandes',       icon: <IconOrders /> },
  { href: '/admin/products',  label: 'Produits',        icon: <IconProducts /> },
  { href: '/admin/users',     label: 'Utilisateurs',    icon: <IconUsers /> },
  { href: '/admin/messages',  label: 'Messages',        icon: <IconMessages /> },
  { href: '/admin/settings',  label: 'Paramètres',      icon: <IconSettings /> },
];

function Skeleton() {
  return (
    <div style={{ display: 'flex', minHeight: '80vh' }}>
      <div style={{ width: 240, background: 'var(--bem-black)', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '2rem', background: '#f7f6f4' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            height: 80, borderRadius: 16, background: '#EEECE9',
            marginBottom: 16, opacity: 1 - i * 0.2,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API}/contact`, { headers: bearerHeader() });
        if (res.ok) {
          const msgs: { read: boolean }[] = await res.json();
          setUnreadCount(msgs.filter((m) => !m.read).length);
        }
      } catch {}
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace('/');
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.replace('/compte');
    }
  }, [user, loading, router]);

  if (loading) return <Skeleton />;
  if (!user || user.role !== 'ADMIN') return null;

  const initials = `${(user.firstName ?? '').charAt(0)}${(user.lastName ?? '').charAt(0)}`.toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '80vh', background: '#F7F6F4' }}>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          className="lg:hidden"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        {/* Brand */}
        <div style={{ padding: '28px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--bem-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>BEM Admin</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 24px' }} />

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)', padding: '0 12px', marginBottom: 8,
          }}>Navigation</p>

          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const badge = item.href === '/admin/messages' && unreadCount > 0 ? unreadCount : 0;
            return (
              <div key={item.href} style={{ marginBottom: 2 }}>
                <Link href={item.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: active ? 'rgba(204,31,39,0.2)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    transition: 'background 0.15s, color 0.15s',
                    borderLeft: active ? '3px solid var(--bem-red)' : '3px solid transparent',
                  }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLDivElement).style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                        (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.55)';
                      }
                    }}
                  >
                    {item.icon}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {badge > 0 && (
                      <span style={{
                        background: 'var(--bem-red)', color: '#fff',
                        fontSize: 10, fontWeight: 800,
                        padding: '1px 6px', borderRadius: 99, lineHeight: 1.5,
                      }}>
                        {badge}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom: user + back to shop */}
        <div style={{ padding: '16px 12px 24px' }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

          {/* User card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'var(--bem-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff',
            }}>
              {initials || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName} {user.lastName}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </p>
            </div>
          </div>

          {/* Back to shop */}
          <Link href="/" style={{ textDecoration: 'none', display: 'block', marginTop: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 10,
              color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 500,
              transition: 'color 0.15s, background 0.15s',
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.color = '#fff';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.35)';
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <IconShop />
              Retour à la boutique
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: '100%', marginTop: 6,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 10, border: 'none',
              background: 'transparent', cursor: loggingOut ? 'wait' : 'pointer',
              color: loggingOut ? 'rgba(255,255,255,0.2)' : 'rgba(204,31,39,0.7)',
              fontSize: 12, fontWeight: 500,
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!loggingOut) {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--bem-red)';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(204,31,39,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = loggingOut ? 'rgba(255,255,255,0.2)' : 'rgba(204,31,39,0.7)';
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            {loggingOut ? (
              <span style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.15)',
                borderTopColor: 'rgba(255,255,255,0.4)',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            )}
            {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
        {/* Mobile top bar */}
        <div className="admin-mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            style={{
              width: 38, height: 38, borderRadius: 8, border: '1.5px solid var(--bem-gray-100)',
              background: '#fff', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
              flexShrink: 0,
            }}
          >
            <span style={{ width: 16, height: 1.5, background: 'var(--bem-black)', borderRadius: 99 }} />
            <span style={{ width: 16, height: 1.5, background: 'var(--bem-black)', borderRadius: 99 }} />
            <span style={{ width: 16, height: 1.5, background: 'var(--bem-black)', borderRadius: 99 }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'var(--bem-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--bem-black)' }}>BEM Admin</p>
          </div>
        </div>
        {children}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
