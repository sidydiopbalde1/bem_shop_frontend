'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { bearerHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

/* ── types ──────────────────────────────────────────────────── */
type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: Category[];
  _count?: { products: number };
};

/* ── helpers ────────────────────────────────────────────────── */
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

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px', borderRadius: 9,
  border: '1.5px solid var(--bem-gray-100)',
  background: 'var(--bem-gray-50)', fontSize: 13,
  color: 'var(--bem-black)', outline: 'none',
  transition: 'border-color 0.18s, box-shadow 0.18s',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--bem-gray-400)', marginBottom: 6,
};

/* ── Section header ─────────────────────────────────────────── */
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--bem-black)', marginBottom: sub ? 4 : 0 }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 12, color: 'var(--bem-gray-400)' }}>{sub}</p>}
    </div>
  );
}

/* ── Card ───────────────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid var(--bem-gray-100)',
      padding: '24px 28px',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Category row ───────────────────────────────────────────── */
function CategoryRow({
  cat, roots, onEdit, onDelete, actionId,
}: {
  cat: Category;
  roots: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  actionId: string | null;
}) {
  const busy = actionId === cat.id;
  const parent = roots.find((r) => r.id === cat.parentId);
  const count = cat._count?.products ?? 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 12,
      border: '1px solid var(--bem-gray-100)',
      background: '#fafaf9',
      transition: 'box-shadow 0.15s',
      opacity: busy ? 0.6 : 1,
    }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Color dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: cat.parentId ? 'var(--bem-gray-400)' : 'var(--bem-red)',
      }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--bem-black)' }}>{cat.name}</span>
          {parent && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
              background: 'var(--bem-gray-100)', color: 'var(--bem-gray-400)',
            }}>
              sous {parent.name}
            </span>
          )}
          {!cat.parentId && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
              background: 'rgba(204,31,39,0.1)', color: 'var(--bem-red)',
            }}>
              Racine
            </span>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--bem-gray-400)', marginTop: 2 }}>
          /{cat.slug} — {count} produit{count !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(cat)}
          disabled={busy}
          style={{
            padding: '5px 12px', borderRadius: 8, border: 'none',
            cursor: busy ? 'wait' : 'pointer', fontSize: 12, fontWeight: 600,
            background: 'rgba(37,99,235,0.10)', color: '#1d4ed8',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Modifier
        </button>
        <button
          onClick={() => onDelete(cat)}
          disabled={busy || count > 0}
          title={count > 0 ? `${count} produit(s) liés — suppression impossible` : undefined}
          style={{
            padding: '5px 12px', borderRadius: 8, border: 'none',
            cursor: busy || count > 0 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600,
            background: count > 0 ? 'var(--bem-gray-50)' : 'rgba(204,31,39,0.10)',
            color: count > 0 ? 'var(--bem-gray-400)' : 'var(--bem-red)',
            transition: 'opacity 0.15s',
            opacity: count > 0 ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { if (!busy && count === 0) e.currentTarget.style.opacity = '0.75'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = count > 0 ? '0.5' : '1'; }}
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

/* ── Category form modal ────────────────────────────────────── */
function CategoryModal({
  open, editing, roots, onClose, onSaved,
}: {
  open: boolean;
  editing: Category | null;
  roots: Category[];
  onClose: () => void;
  onSaved: (cat: Category) => void;
}) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setParentId(editing?.parentId ?? '');
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const body: Record<string, string> = { name: name.trim() };
      if (parentId) body.parentId = parentId;

      const url = editing ? `${API}/categories/${editing.id}` : `${API}/categories`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...bearerHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = Array.isArray(err.message) ? err.message[0] : (err.message ?? `Erreur ${res.status}`);
        setError(msg);
        return;
      }
      const saved: Category = await res.json();
      onSaved(saved);
      onClose();
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 440,
        background: '#fff', borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        zIndex: 51, padding: '28px',
        animation: 'fadeUp 0.25s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 3 }}>
              {editing ? 'Modifier' : 'Nouvelle'} catégorie
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--bem-black)' }}>
              {editing ? editing.name : 'Créer une catégorie'}
            </h3>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--bem-gray-50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bem-gray-400)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(204,31,39,0.07)', border: '1px solid rgba(204,31,39,0.2)', marginBottom: 16 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bem-red)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ fontSize: 12, color: 'var(--bem-red)', lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nom *</label>
            <input
              ref={inputRef}
              type="text"
              required
              placeholder="Ex: Vêtements"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bem-black)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bem-gray-100)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={labelStyle}>Catégorie parente (optionnel)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              style={{
                width: '100%', height: 42, padding: '0 36px 0 12px', borderRadius: 9,
                border: '1.5px solid var(--bem-gray-100)',
                backgroundColor: 'var(--bem-gray-50)', fontSize: 13,
                color: 'var(--bem-black)', outline: 'none',
                transition: 'border-color 0.18s, box-shadow 0.18s',
                boxSizing: 'border-box' as const,
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                cursor: 'pointer',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bem-black)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bem-gray-100)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <option value="">— Catégorie racine</option>
              {roots.filter((r) => !editing || r.id !== editing.id).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 10, border: '1.5px solid var(--bem-gray-100)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--bem-gray-700)' }}>
              Annuler
            </button>
            <button type="submit" disabled={busy} style={{
              flex: 2, height: 42, borderRadius: 10, border: 'none',
              background: busy ? 'var(--bem-gray-400)' : 'var(--bem-black)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: busy ? 'none' : '0 2px 12px rgba(13,13,13,0.18)',
            }}>
              {busy ? (
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {busy ? 'Enregistrement…' : (editing ? 'Sauvegarder' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)); } to { opacity: 1; transform: translate(-50%, -50%); } }
      `}</style>
    </>
  );
}

/* ── Profile section ────────────────────────────────────────── */
function ProfileSection() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = `${(user.firstName ?? '').charAt(0)}${(user.lastName ?? '').charAt(0)}`.toUpperCase();

  const fields: { label: string; value: string }[] = [
    { label: 'Prénom', value: user.firstName ?? '—' },
    { label: 'Nom', value: user.lastName ?? '—' },
    { label: 'Adresse e-mail', value: user.email },
    { label: 'Rôle', value: user.role },
  ];

  return (
    <Card>
      <SectionHeader title="Mon profil" sub="Informations de votre compte administrateur" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--bem-red)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>
          {initials || '?'}
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--bem-black)' }}>
            {user.firstName} {user.lastName}
          </p>
          <span style={{
            display: 'inline-block', marginTop: 4,
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
            background: 'rgba(204,31,39,0.1)', color: 'var(--bem-red)',
          }}>
            {user.role}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="max-sm:grid-cols-1">
        {fields.map(({ label, value }) => (
          <div key={label} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bem-gray-50)', border: '1px solid var(--bem-gray-100)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: 5 }}>
              {label}
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--bem-black)' }}>{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Categories section ─────────────────────────────────────── */
function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [search, setSearch] = useState('');

  /* Flatten tree into a single list (root + children) */
  const flattenCats = useCallback((tree: Category[]): Category[] => {
    const result: Category[] = [];
    const walk = (cats: Category[]) => {
      for (const c of cats) {
        result.push(c);
        if (c.children?.length) walk(c.children);
      }
    };
    walk(tree);
    return result;
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/categories`, { headers: bearerHeader() });
      if (!res.ok) throw new Error(`${res.status}`);
      const tree: Category[] = await res.json();
      setCategories(flattenCats(tree));
    } catch {
      setError('Impossible de charger les catégories.');
    } finally {
      setLoading(false);
    }
  }, [flattenCats]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const roots = categories.filter((c) => !c.parentId);

  const handleDelete = async (cat: Category) => {
    const count = cat._count?.products ?? 0;
    if (count > 0) return;
    if (!window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    setActionId(cat.id);
    try {
      const res = await fetch(`${API}/categories/${cat.id}`, {
        method: 'DELETE',
        headers: bearerHeader(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? 'Erreur lors de la suppression.');
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch {
      alert('Impossible de contacter le serveur.');
    } finally {
      setActionId(null);
    }
  };

  const handleSaved = (saved: Category) => {
    setCategories((prev) => {
      const exists = prev.find((c) => c.id === saved.id);
      if (exists) return prev.map((c) => c.id === saved.id ? { ...c, ...saved } : c);
      return [...prev, saved];
    });
  };

  const filtered = search.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <SectionHeader
          title="Catégories"
          sub={`${categories.length} catégorie${categories.length !== 1 ? 's' : ''} — ${roots.length} racine${roots.length !== 1 ? 's' : ''}`}
        />
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '0 16px', height: 38, borderRadius: 10, border: 'none',
            background: 'var(--bem-black)', color: '#fff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(13,13,13,0.16)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle catégorie
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="2"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Rechercher une catégorie…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 34 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bem-black)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bem-gray-100)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, background: 'rgba(204,31,39,0.07)', border: '1px solid rgba(204,31,39,0.2)', marginBottom: 14 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bem-red)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ fontSize: 12, color: 'var(--bem-red)', flex: 1 }}>{error}</p>
          <button onClick={fetchCategories} style={{ fontSize: 11, fontWeight: 700, color: 'var(--bem-red)', background: 'none', border: 'none', cursor: 'pointer' }}>Réessayer</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 62, borderRadius: 12, background: 'var(--bem-gray-100)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--bem-gray-400)', fontSize: 13 }}>
          {search ? 'Aucune catégorie ne correspond à la recherche.' : 'Aucune catégorie pour l\'instant.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((cat) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              roots={roots}
              onEdit={(c) => { setEditing(c); setModalOpen(true); }}
              onDelete={handleDelete}
              actionId={actionId}
            />
          ))}
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        editing={editing}
        roots={roots}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />
    </Card>
  );
}

/* ── Danger zone ────────────────────────────────────────────── */
function DangerZone() {
  const { logout } = useAuth();

  return (
    <Card style={{ border: '1px solid rgba(204,31,39,0.2)', background: 'rgba(254,242,242,0.4)' }}>
      <SectionHeader title="Zone dangereuse" sub="Actions irréversibles sur votre session" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--bem-black)', marginBottom: 3 }}>
            Se déconnecter de toutes les sessions
          </p>
          <p style={{ fontSize: 12, color: 'var(--bem-gray-400)' }}>
            Invalide votre token de session et vous redirige vers l'accueil.
          </p>
        </div>
        <button
          onClick={async () => { await logout(); window.location.href = '/'; }}
          style={{
            padding: '9px 20px', borderRadius: 10, border: '1.5px solid var(--bem-red)',
            background: '#fff', color: 'var(--bem-red)', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bem-red)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--bem-red)'; }}
        >
          Se déconnecter
        </button>
      </div>
    </Card>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function SettingsPage() {
  return (
    <div style={{ padding: '2rem', minHeight: '100%', maxWidth: 860, margin: '0 auto' }}>

      <Appear>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 6 }}>
            Configuration
          </p>
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--bem-black)', lineHeight: 1.2 }}>
            Paramètres
          </h1>
          <p style={{ color: 'var(--bem-gray-400)', fontSize: 13, marginTop: 6 }}>
            Gestion du profil, des catégories et de la configuration du site.
          </p>
        </div>
      </Appear>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Appear delay={60}><ProfileSection /></Appear>
        <Appear delay={140}><CategoriesSection /></Appear>
        <Appear delay={220}><DangerZone /></Appear>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin  { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
