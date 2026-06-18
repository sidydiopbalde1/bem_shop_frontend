'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/apiFetch';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const PAGE_SIZE = 20;

type Role = 'ADMIN' | 'STUDENT' | 'PARENT' | 'ALUMNI' | 'GUEST';

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
};

type ApiResponse = {
  data: User[];
  total: number;
  page: number;
};

const ROLES: Role[] = ['ADMIN', 'STUDENT', 'PARENT', 'ALUMNI', 'GUEST'];

const ROLE_COLORS: Record<Role, { bg: string; text: string; label: string }> = {
  ADMIN:   { bg: 'rgba(204,31,39,0.12)',  text: 'var(--bem-red)', label: 'Admin' },
  STUDENT: { bg: 'rgba(37,99,235,0.12)', text: '#1d4ed8',         label: 'Étudiant' },
  PARENT:  { bg: 'rgba(22,163,74,0.12)', text: '#15803d',         label: 'Parent' },
  ALUMNI:  { bg: 'rgba(124,58,237,0.12)',text: '#6d28d9',         label: 'Alumni' },
  GUEST:   { bg: 'rgba(107,114,128,0.12)',text: '#4b5563',        label: 'Invité' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitials(u: User) {
  const f = (u.firstName ?? '').charAt(0).toUpperCase();
  const l = (u.lastName ?? '').charAt(0).toUpperCase();
  return f || l ? `${f}${l}` : u.email.charAt(0).toUpperCase();
}

function avatarColor(role: string): string {
  const c = ROLE_COLORS[role as Role];
  return c ? c.text : 'var(--bem-gray-400)';
}

function avatarBg(role: string): string {
  const c = ROLE_COLORS[role as Role];
  return c ? c.bg : 'var(--bem-gray-100)';
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

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role as Role] ?? ROLE_COLORS.GUEST;
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} style={{ borderBottom: '1px solid var(--bem-gray-100)' }}>
          <td style={{ padding: '14px 16px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bem-gray-100)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </td>
          {[1, 2, 3, 4, 5].map((j) => (
            <td key={j} style={{ padding: '14px 16px' }}>
              <div style={{ height: 14, borderRadius: 6, background: 'var(--bem-gray-100)', width: j === 5 ? '80%' : '65%', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.08}s` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function UsersPage() {
  const [users, setUsers]           = useState<User[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (pg: number, q: string, role: Role | 'ALL') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(PAGE_SIZE) });
      if (q) params.set('search', q);
      if (role !== 'ALL') params.set('role', role);
      const res = await apiFetch(`${API}/users?${params.toString()}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const json: ApiResponse = await res.json();
      setUsers(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setError('Impossible de charger les utilisateurs. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, search, roleFilter);
  }, [page, roleFilter, fetchUsers]);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers(1, v, roleFilter);
    }, 400);
  };

  const handleRoleFilter = (r: Role | 'ALL') => {
    setRoleFilter(r);
    setPage(1);
  };

  const handleRoleChange = async (id: string, role: string) => {
    setActionId(id);
    try {
      const res = await apiFetch(`${API}/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    } catch {
      alert('Erreur lors du changement de rôle.');
    } finally {
      setActionId(null);
    }
  };

  const handleSuspend = async (id: string) => {
    setConfirmSuspend(null);
    setActionId(id);
    try {
      const res = await apiFetch(`${API}/users/${id}/suspend`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
    } catch {
      alert('Erreur lors de la suspension.');
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tabRoles: (Role | 'ALL')[] = ['ALL', ...ROLES];

  return (
    <div className="admin-content">

      <Appear>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 6 }}>
              Gestion
            </p>
            <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--bem-black)', lineHeight: 1.2 }}>
              Utilisateurs
            </h1>
            {!loading && (
              <p style={{ color: 'var(--bem-gray-400)', fontSize: 13, marginTop: 6 }}>
                {total} utilisateur{total !== 1 ? 's' : ''}
                {roleFilter !== 'ALL' ? ` — filtrés par ${ROLE_COLORS[roleFilter].label}` : ''}
              </p>
            )}
          </div>

          <button
            onClick={() => fetchUsers(page, search, roleFilter)}
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

      {/* Suspend confirmation banner */}
      {confirmSuspend && (() => {
        const u = users.find((x) => x.id === confirmSuspend);
        return u ? (
          <Appear>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              padding: '14px 18px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p style={{ fontSize: 13, color: '#92400e', flex: 1 }}>
                Confirmer la suspension de <strong>{u.firstName ?? ''} {u.lastName ?? u.email}</strong> ?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleSuspend(confirmSuspend)}
                  style={{ padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: '#b45309', color: '#fff' }}
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setConfirmSuspend(null)}
                  style={{ padding: '6px 16px', borderRadius: 8, border: '1.5px solid rgba(180,83,9,0.3)', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'transparent', color: '#b45309' }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </Appear>
        ) : null;
      })()}

      <Appear delay={80}>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--bem-gray-100)', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bem-gray-100)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="2"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher un utilisateur…"
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

            <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bem-gray-50)', borderRadius: 10, flexWrap: 'wrap' }}>
              {tabRoles.map((r) => {
                const active = roleFilter === r;
                const label = r === 'ALL' ? 'Tous' : ROLE_COLORS[r].label;
                return (
                  <button
                    key={r}
                    onClick={() => handleRoleFilter(r)}
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
                  {['Avatar', 'Nom', 'Email', 'Rôle', 'Inscription', 'Actions'].map((h) => (
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
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--bem-gray-400)', fontSize: 14 }}>
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const busy = actionId === user.id;
                    const initials = getInitials(user);
                    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
                    return (
                      <tr
                        key={user.id}
                        style={{ borderBottom: '1px solid var(--bem-gray-100)', transition: 'background 0.12s', opacity: busy ? 0.6 : 1 }}
                        onMouseEnter={(e) => { if (!busy) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bem-gray-50)'; }}
                        onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: avatarBg(user.role),
                            color: avatarColor(user.role),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 800, flexShrink: 0,
                          }}>
                            {initials}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--bem-black)', whiteSpace: 'nowrap' }}>
                          {fullName}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--bem-gray-700)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <RoleBadge role={user.role} />
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--bem-gray-700)', whiteSpace: 'nowrap' }}>
                          {user.createdAt ? fmtDate(user.createdAt) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {/* Role dropdown */}
                            <select
                              value={user.role}
                              disabled={busy}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              style={{
                                padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--bem-gray-100)',
                                fontSize: 12, fontWeight: 600, color: 'var(--bem-black)',
                                background: busy ? 'var(--bem-gray-50)' : '#fff',
                                cursor: busy ? 'wait' : 'pointer',
                                outline: 'none',
                              }}
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{ROLE_COLORS[r].label}</option>
                              ))}
                            </select>

                            {/* Suspend button — not shown for ADMIN */}
                            {user.role !== 'ADMIN' && (
                              <button
                                onClick={() => setConfirmSuspend(user.id)}
                                disabled={busy || confirmSuspend === user.id}
                                style={{
                                  padding: '5px 12px', borderRadius: 8, border: 'none',
                                  cursor: busy ? 'wait' : 'pointer',
                                  fontSize: 12, fontWeight: 600,
                                  background: 'rgba(245,158,11,0.12)', color: '#b45309',
                                  transition: 'opacity 0.15s',
                                  opacity: busy ? 0.5 : 1,
                                }}
                                onMouseEnter={(e) => { if (!busy) (e.currentTarget.style.opacity = '0.75'); }}
                                onMouseLeave={(e) => { if (!busy) (e.currentTarget.style.opacity = '1'); }}
                              >
                                Suspendre
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && total > PAGE_SIZE && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderTop: '1px solid var(--bem-gray-100)', gap: 12,
            }}>
              <p style={{ fontSize: 13, color: 'var(--bem-gray-400)' }}>
                Page {page} sur {totalPages} — {total} utilisateurs
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    padding: '6px 16px', borderRadius: 8, border: '1.5px solid var(--bem-gray-100)',
                    fontSize: 13, fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    background: '#fff', color: page <= 1 ? 'var(--bem-gray-400)' : 'var(--bem-black)',
                    opacity: page <= 1 ? 0.5 : 1, transition: 'all 0.15s',
                  }}
                >
                  ← Préc.
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    padding: '6px 16px', borderRadius: 8, border: '1.5px solid var(--bem-gray-100)',
                    fontSize: 13, fontWeight: 600, cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    background: '#fff', color: page >= totalPages ? 'var(--bem-gray-400)' : 'var(--bem-black)',
                    opacity: page >= totalPages ? 0.5 : 1, transition: 'all 0.15s',
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
