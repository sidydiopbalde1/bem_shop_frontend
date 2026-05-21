'use client';

import { useEffect, useState, useCallback } from 'react';
import { bearerHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type Filter = 'all' | 'unread';

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 3_600_000;
  if (diffH < 24) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffH < 168) return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  const colors = ['#cc1f27', '#1d4ed8', '#15803d', '#b45309', '#6d28d9', '#0f766e'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800, color: '#fff',
    }}>
      {initials || '?'}
    </div>
  );
}

function SubjectBadge({ subject }: { subject: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
      background: 'rgba(13,13,13,0.06)', color: 'var(--bem-gray-700)',
      whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {subject}
    </span>
  );
}

export default function MessagesPage() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<Filter>('all');
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [marking, setMarking]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/contact`, { headers: bearerHeader() });
      if (res.ok) setMessages(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    setMarking(id);
    try {
      const res = await fetch(`${API}/contact/${id}/read`, {
        method: 'PATCH', headers: bearerHeader(),
      });
      if (res.ok) setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
    } finally {
      setMarking(null);
    }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`${API}/contact/${id}`, {
        method: 'DELETE', headers: bearerHeader(),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (expanded === id) setExpanded(null);
      }
    } finally {
      setDeleting(null);
    }
  };

  const toggle = async (msg: Message) => {
    if (expanded === msg.id) { setExpanded(null); return; }
    setExpanded(msg.id);
    if (!msg.read) markRead(msg.id);
  };

  const displayed = messages
    .filter((m) => filter === 'all' || !m.read)
    .filter((m) => {
      const q = search.toLowerCase();
      return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q);
    });

  const unreadCount = messages.filter((m) => !m.read).length;

  /* ── skeleton ── */
  if (loading) return (
    <div className="admin-content">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          height: 72, borderRadius: 14, background: '#EEECE9',
          marginBottom: 10, opacity: 1 - i * 0.18,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.7}50%{opacity:.4} }`}</style>
    </div>
  );

  return (
    <div className="admin-content" style={{ maxWidth: 900 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Messages</h1>
          {unreadCount > 0 && (
            <span style={{
              background: 'var(--bem-red)', color: '#fff',
              fontSize: 11, fontWeight: 800, padding: '2px 8px',
              borderRadius: 99, lineHeight: 1.4,
            }}>
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--bem-gray-400)', margin: 0 }}>
          Formulaires de contact envoyés depuis la boutique
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--bem-gray-400)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Rechercher par nom, email, sujet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', height: 38, paddingLeft: 36, paddingRight: 12,
              borderRadius: 10, border: '1.5px solid var(--bem-gray-100)',
              background: '#fff', fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#EEECE9', borderRadius: 10, padding: 4 }}>
          {(['all', 'unread'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: filter === f ? '#fff' : 'transparent',
              color: filter === f ? 'var(--bem-black)' : 'var(--bem-gray-400)',
              boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
              {f === 'all' ? `Tous (${messages.length})` : `Non lus (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      {displayed.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: '#fff', borderRadius: 16,
          border: '1px solid var(--bem-gray-100)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
            style={{ color: 'var(--bem-gray-200)', marginBottom: 12 }}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <p style={{ color: 'var(--bem-gray-400)', fontSize: 14, margin: 0 }}>
            {search ? 'Aucun résultat' : filter === 'unread' ? 'Aucun message non lu' : 'Aucun message'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {displayed.map((msg) => {
            const isOpen = expanded === msg.id;
            return (
              <div key={msg.id} style={{
                background: '#fff',
                borderRadius: 14,
                border: `1.5px solid ${isOpen ? 'var(--bem-black)' : 'var(--bem-gray-100)'}`,
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}>
                {/* ── Row ── */}
                <div
                  onClick={() => toggle(msg)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', cursor: 'pointer',
                  }}
                >
                  {/* Unread dot */}
                  <div style={{ width: 8, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    {!msg.read && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--bem-red)' }} />
                    )}
                  </div>

                  <Avatar name={msg.name} />

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: msg.read ? 500 : 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                        {msg.name}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--bem-gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.email}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SubjectBadge subject={msg.subject} />
                      <span style={{
                        fontSize: 12, color: 'var(--bem-gray-400)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        opacity: isOpen ? 0 : 1, transition: 'opacity 0.15s',
                      }}>
                        {msg.message.slice(0, 80)}{msg.message.length > 80 ? '…' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Date + chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--bem-gray-400)' }}>{fmtDate(msg.createdAt)}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ color: 'var(--bem-gray-300)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* ── Expanded body ── */}
                {isOpen && (
                  <div style={{ padding: '0 18px 18px 58px', borderTop: '1px solid var(--bem-gray-100)' }}>
                    <p style={{
                      marginTop: 16, marginBottom: 16,
                      fontSize: 13.5, lineHeight: 1.7,
                      color: 'var(--bem-gray-700)',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {msg.message}
                    </p>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 8,
                          background: 'var(--bem-black)', color: '#fff',
                          fontSize: 12, fontWeight: 600, textDecoration: 'none',
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Répondre par email
                      </a>

                      {!msg.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(msg.id); }}
                          disabled={marking === msg.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--bem-gray-100)',
                            background: '#fff', cursor: marking === msg.id ? 'wait' : 'pointer',
                            fontSize: 12, fontWeight: 600, color: 'var(--bem-gray-700)',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {marking === msg.id ? 'En cours…' : 'Marquer comme lu'}
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); remove(msg.id); }}
                        disabled={deleting === msg.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 8, border: '1.5px solid rgba(204,31,39,0.2)',
                          background: 'rgba(204,31,39,0.05)', cursor: deleting === msg.id ? 'wait' : 'pointer',
                          fontSize: 12, fontWeight: 600, color: 'var(--bem-red)',
                          marginLeft: 'auto',
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                        {deleting === msg.id ? 'Suppression…' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
