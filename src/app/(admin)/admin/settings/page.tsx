'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import { FONT_OPTIONS, applyFont, type FontId } from '@/lib/FontProvider';

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
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
      const res = await apiFetch(`${API}/categories`);
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
      const res = await apiFetch(`${API}/categories/${cat.id}`, {
        method: 'DELETE',
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

/* ── Font section ───────────────────────────────────────────── */
function FontSection() {
  const [current, setCurrent] = useState<FontId>('arciform');
  const [saving, setSaving] = useState<FontId | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(({ font }: { font: FontId }) => setCurrent(font))
      .catch(() => {});
  }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const handleSelect = async (id: FontId) => {
    if (id === current || saving) return;
    setSaving(id);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ font: id }),
      });
      if (!res.ok) throw new Error();
      const { font } = await res.json();
      setCurrent(font);
      applyFont(font);
      showToast('Police enregistrée avec succès.', true);
    } catch {
      showToast('Impossible d\'enregistrer la police.', false);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <SectionHeader
        title="Police du site"
        sub="Choisissez la typographie appliquée sur l'ensemble du site"
      />

      {/* Toast */}
      {toast && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 10, marginBottom: 16,
          background: toast.ok ? 'rgba(22,163,74,0.08)' : 'rgba(204,31,39,0.07)',
          border: `1px solid ${toast.ok ? 'rgba(22,163,74,0.25)' : 'rgba(204,31,39,0.2)'}`,
          animation: 'fadeUp 0.2s ease',
        }}>
          {toast.ok ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bem-red)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          <p style={{ fontSize: 12, color: toast.ok ? '#15803d' : 'var(--bem-red)', fontWeight: 500 }}>
            {toast.msg}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {FONT_OPTIONS.map((font) => {
          const isActive = current === font.id;
          const isSaving = saving === font.id;
          return (
            <button
              key={font.id}
              onClick={() => handleSelect(font.id)}
              disabled={!!saving}
              style={{
                position: 'relative',
                padding: '18px 16px',
                borderRadius: 14,
                border: isActive
                  ? '2px solid var(--bem-red)'
                  : '1.5px solid var(--bem-gray-100)',
                background: isActive ? 'rgba(204,31,39,0.04)' : '#fafaf9',
                cursor: saving ? 'wait' : isActive ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                boxShadow: isActive ? '0 0 0 4px rgba(204,31,39,0.08)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive && !saving) {
                  e.currentTarget.style.borderColor = 'var(--bem-gray-400)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Active badge */}
              {isActive && (
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--bem-red)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}

              {/* Saving spinner */}
              {isSaving && (
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid var(--bem-gray-100)',
                  borderTopColor: 'var(--bem-red)',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
              )}

              {/* Preview */}
              <div style={{
                fontSize: 32,
                fontFamily: font.stack,
                fontWeight: font.isSerif ? 700 : 500,
                color: isActive ? 'var(--bem-red)' : 'var(--bem-black)',
                lineHeight: 1,
                marginBottom: 10,
                transition: 'color 0.2s',
              }}>
                Aa
              </div>

              {/* Name */}
              <p style={{
                fontSize: 12, fontWeight: 700,
                color: isActive ? 'var(--bem-red)' : 'var(--bem-black)',
                marginBottom: 3,
              }}>
                {font.label}
              </p>

              {/* Description */}
              <p style={{ fontSize: 10, color: 'var(--bem-gray-400)', lineHeight: 1.4 }}>
                {font.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Note Arciform */}
      <div style={{
        marginTop: 14, padding: '10px 14px', borderRadius: 10,
        background: 'var(--bem-gray-50)', border: '1px solid var(--bem-gray-100)',
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{ fontSize: 11, color: 'var(--bem-gray-400)', lineHeight: 1.5 }}>
          Arciform est auto-hébergée — placez les fichiers <code style={{ fontFamily: 'monospace', background: 'var(--bem-gray-100)', padding: '1px 5px', borderRadius: 4 }}>arciform.woff2</code> et <code style={{ fontFamily: 'monospace', background: 'var(--bem-gray-100)', padding: '1px 5px', borderRadius: 4 }}>arciform.woff</code> dans <code style={{ fontFamily: 'monospace', background: 'var(--bem-gray-100)', padding: '1px 5px', borderRadius: 4 }}>public/fonts/</code>.
        </p>
      </div>
    </Card>
  );
}

/* ── WhatsApp section ───────────────────────────────────────── */
function WhatsAppSection() {
  const [number, setNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data: { whatsappNumber?: string }) => {
        if (data.whatsappNumber) setNumber(data.whatsappNumber);
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: number.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? 'Erreur lors de la sauvegarde.', false);
        return;
      }
      showToast('Numéro WhatsApp enregistré.', true);
    } catch {
      showToast('Impossible de contacter le serveur.', false);
    } finally {
      setSaving(false);
    }
  };

  const digits = number.replace(/\D/g, '');
  const waPhone = digits ? (digits.startsWith('221') ? digits : `221${digits}`) : null;
  const previewUrl = waPhone ? `https://wa.me/${waPhone}` : null;

  return (
    <Card>
      <SectionHeader
        title="Bouton WhatsApp"
        sub="Un bouton flottant apparaîtra sur toutes les pages du site pour contacter via WhatsApp"
      />

      {/* Toast */}
      {toast && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 10, marginBottom: 16,
          background: toast.ok ? 'rgba(22,163,74,0.08)' : 'rgba(204,31,39,0.07)',
          border: `1px solid ${toast.ok ? 'rgba(22,163,74,0.25)' : 'rgba(204,31,39,0.2)'}`,
          animation: 'fadeUp 0.2s ease',
        }}>
          {toast.ok ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bem-red)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          <p style={{ fontSize: 12, color: toast.ok ? '#15803d' : 'var(--bem-red)', fontWeight: 500 }}>{toast.msg}</p>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Numéro WhatsApp</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* WhatsApp icon badge */}
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: '#25D366',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <input
              type="tel"
              placeholder="Ex : 780197837"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bem-black)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bem-gray-100)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <p style={{ fontSize: 11, color: 'var(--bem-gray-400)', marginTop: 6 }}>
            Entrez le numéro local (ex : 780197837) — le préfixe Sénégal +221 est ajouté automatiquement.
            Laissez vide pour désactiver le bouton.
          </p>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.25)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/>
            </svg>
            <p style={{ fontSize: 11, color: '#15803d', flex: 1 }}>
              Lien généré :&nbsp;
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#15803d', fontWeight: 700 }}>
                {previewUrl}
              </a>
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '9px 22px', borderRadius: 10, border: 'none',
              background: saving ? 'var(--bem-gray-400)' : '#25D366',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: saving ? 'none' : '0 2px 12px rgba(37,211,102,0.35)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {saving ? (
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
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
    <div className="admin-content" style={{ maxWidth: 860, margin: '0 auto' }}>

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
        <Appear delay={120}><FontSection /></Appear>
        <Appear delay={180}><WhatsAppSection /></Appear>
        <Appear delay={240}><CategoriesSection /></Appear>
        <Appear delay={320}><DangerZone /></Appear>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin  { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
