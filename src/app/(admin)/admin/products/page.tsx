'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { bearerHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const PAGE_SIZE = 20;

type Category = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  stock: number;
  isApproved: boolean;
  imageUrls: string[];
  category: { id: string; name: string };
  createdAt: string;
};

type ApiResponse = {
  data: Product[];
  total: number;
  page: number;
  totalPages?: number;
};

type NewProduct = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  images: File[];
};

type EditForm = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  newImages: File[];
};

function fmtPrice(p: string | number) {
  return new Intl.NumberFormat('fr-FR').format(Number(p)) + ' XOF';
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

function StockBadge({ stock }: { stock: number }) {
  const [bg, color, label] =
    stock === 0   ? ['rgba(204,31,39,0.12)',   'var(--bem-red)', 'Rupture'] :
    stock <= 10   ? ['rgba(245,158,11,0.12)',  '#b45309',        `${stock} restants`] :
                    ['rgba(22,163,74,0.12)',   '#15803d',        `${stock} en stock`];
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: bg, color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function ApprovalBadge({ approved }: { approved: boolean }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: approved ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)',
      color: approved ? '#15803d' : '#b45309',
      whiteSpace: 'nowrap',
    }}>
      {approved ? 'Approuvé' : 'En attente'}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} style={{ borderBottom: '1px solid var(--bem-gray-100)' }}>
          <td style={{ padding: '14px 16px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bem-gray-100)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </td>
          {[1, 2, 3, 4, 5, 6].map((j) => (
            <td key={j} style={{ padding: '14px 16px' }}>
              <div style={{ height: 14, borderRadius: 6, background: 'var(--bem-gray-100)', width: '70%', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.08}s` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Edit Product Modal ───────────────────────────────────────── */
function EditProductModal({
  open,
  product,
  onClose,
  onUpdated,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onUpdated: (p: Product) => void;
}) {
  const EMPTY_FORM: EditForm = { name: '', description: '', price: '', stock: '', categoryId: '', newImages: [] };

  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* pre-fill form and fetch categories on open */
  useEffect(() => {
    if (!open || !product) return;
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.category?.id ?? '',
      newImages: [],
    });
    setNewPreviews([]);
    setError(null);
    setSuccess(false);
    fetch(`${API}/categories`, { headers: bearerHeader() })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setCategories(list);
      })
      .catch(() => setCategories([]));
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [open, product]);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const set = (key: keyof Omit<EditForm, 'newImages'>) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)
    );
    if (accepted.length < files.length) {
      setError('Certains fichiers ont été ignorés. Formats acceptés : JPEG, PNG, WEBP, GIF.');
    }
    const next = [...form.newImages, ...accepted].slice(0, 10);
    setForm((f) => ({ ...f, newImages: next }));
    setNewPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeNewImage = (i: number) => {
    URL.revokeObjectURL(newPreviews[i]);
    const next = form.newImages.filter((_, idx) => idx !== i);
    setForm((f) => ({ ...f, newImages: next }));
    setNewPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError(null);

    if (!form.categoryId) {
      setError('Veuillez sélectionner une catégorie.');
      return;
    }

    setBusy(true);

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('price', form.price);
    fd.append('stock', form.stock);
    fd.append('categoryId', form.categoryId);
    if (form.description.trim()) fd.append('description', form.description.trim());
    if (form.newImages.length > 0) {
      form.newImages.forEach((file) => fd.append('images', file));
    }

    try {
      const res = await fetch(`${API}/products/${product.id}`, {
        method: 'PATCH',
        headers: bearerHeader(),   // pas de Content-Type : le browser pose le boundary multipart
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = Array.isArray(err.message) ? err.message[0] : (err.message ?? `Erreur ${res.status}`);
        setError(msg);
        return;
      }
      const updated: Product = await res.json();
      setSuccess(true);
      setTimeout(() => {
        onUpdated(updated);
      }, 800);
    } catch {
      setError('Impossible de modifier le produit. Vérifiez votre connexion.');
    } finally {
      setBusy(false);
    }
  };

  if (!open || !product) return null;

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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 50, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 520,
        background: '#fff', zIndex: 51,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        animation: 'slideIn 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid var(--bem-gray-100)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 3 }}>
              Édition produit
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--bem-black)' }}>
              Modifier le produit
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'var(--bem-gray-50)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--bem-gray-400)', transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bem-gray-100)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--bem-black)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bem-gray-50)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--bem-gray-400)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form
          id="edit-product-form"
          onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(204,31,39,0.07)', border: '1px solid rgba(204,31,39,0.2)',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--bem-red)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ fontSize: 12, color: 'var(--bem-red)', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Produit modifié avec succès !</p>
            </div>
          )}

          {/* Nom */}
          <div>
            <label style={labelStyle}>Nom du produit *</label>
            <input
              ref={firstInputRef}
              type="text"
              required
              placeholder="Ex: Hoodie BEM Dakar"
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-black)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              placeholder="Description du produit (optionnel)"
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={3}
              style={{
                ...inputStyle, height: 'auto', padding: '10px 12px',
                resize: 'vertical', lineHeight: 1.5,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-black)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Prix + Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Prix (XOF) *</label>
              <input
                type="number"
                required
                min="0"
                step="100"
                placeholder="5000"
                value={form.price}
                onChange={(e) => set('price')(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bem-black)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Stock *</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="10"
                value={form.stock}
                onChange={(e) => set('stock')(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bem-black)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label style={labelStyle}>Catégorie *</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => set('categoryId')(e.target.value)}
              style={{
                width: '100%', height: 42, padding: '0 36px 0 12px', borderRadius: 9,
                border: '1.5px solid var(--bem-gray-100)',
                backgroundColor: 'var(--bem-gray-50)', fontSize: 13,
                outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
                boxSizing: 'border-box' as const,
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                cursor: 'pointer',
                color: form.categoryId ? 'var(--bem-black)' : 'var(--bem-gray-400)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-black)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="" disabled>— Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p style={{ fontSize: 11, color: 'var(--bem-gray-400)', marginTop: 5 }}>
                Chargement des catégories…
              </p>
            )}
          </div>

          {/* Images actuelles */}
          {product.imageUrls && product.imageUrls.length > 0 && (
            <div>
              <label style={labelStyle}>
                Images actuelles{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--bem-gray-400)', fontSize: 10 }}>
                  (lecture seule)
                </span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                {product.imageUrls.map((src, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--bem-gray-100)' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{
                      position: 'absolute', bottom: 4, left: 4,
                      fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                      background: 'rgba(13,13,13,0.65)', color: '#fff',
                    }}>
                      actuel
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nouvelles images */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Nouvelles images{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--bem-gray-400)', fontSize: 10 }}>
                  (optionnel — remplacera les actuelles)
                </span>
              </label>
              {form.newImages.length > 0 && form.newImages.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 6, border: '1.5px solid var(--bem-gray-100)',
                    background: '#fff', color: 'var(--bem-gray-700)', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bem-black)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--bem-gray-100)')}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Ajouter
                </button>
              )}
            </div>

            {/* Drop zone */}
            {form.newImages.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bem-black)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bem-gray-50)'; }}
                onDragLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bem-gray-100)'; (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bem-gray-100)';
                  (e.currentTarget as HTMLDivElement).style.background = '#fff';
                  handleFiles(e.dataTransfer.files);
                }}
                style={{
                  border: '2px dashed var(--bem-gray-100)', borderRadius: 12,
                  padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--bem-gray-50)', border: '1.5px solid var(--bem-gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="1.8">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--bem-black)', marginBottom: 4 }}>
                  Glisser-déposer ou cliquer pour choisir
                </p>
                <p style={{ fontSize: 11, color: 'var(--bem-gray-400)' }}>
                  JPEG, PNG, WEBP, GIF — max 5 Mo chacune
                </p>
              </div>
            )}

            {/* Thumbnails grid des nouvelles images */}
            {form.newImages.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                {newPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--bem-gray-100)' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 22, height: 22, borderRadius: '50%', border: 'none',
                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                    {i === 0 && (
                      <span style={{
                        position: 'absolute', bottom: 4, left: 4,
                        fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                        background: 'var(--bem-red)', color: '#fff',
                      }}>
                        Principal
                      </span>
                    )}
                  </div>
                ))}
                {form.newImages.length < 10 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      aspectRatio: '1', borderRadius: 10,
                      border: '2px dashed var(--bem-gray-100)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bem-black)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--bem-gray-100)')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid var(--bem-gray-100)',
          display: 'flex', gap: 10, flexShrink: 0,
          background: '#fff',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, height: 44, borderRadius: 10,
              border: '1.5px solid var(--bem-gray-100)',
              background: '#fff', color: 'var(--bem-gray-700)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bem-black)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--bem-gray-100)')}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="edit-product-form"
            disabled={busy || success}
            style={{
              flex: 2, height: 44, borderRadius: 10, border: 'none',
              background: busy || success ? 'var(--bem-gray-400)' : 'var(--bem-black)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: busy || success ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
              boxShadow: busy || success ? 'none' : '0 2px 12px rgba(13,13,13,0.2)',
            }}
          >
            {busy ? (
              <>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Sauvegarde…
              </>
            ) : success ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Sauvegardé !
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

/* ── Add Product Modal ────────────────────────────────────────── */
function AddProductModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
}) {
  const EMPTY_PRODUCT: NewProduct = { name: '', description: '', price: '', stock: '', categoryId: '', images: [] };

  const [form, setForm] = useState<NewProduct>(EMPTY_PRODUCT);
  const [previews, setPreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* fetch categories on open */
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_PRODUCT);
    setPreviews([]);
    setError(null);
    setSuccess(false);
    fetch(`${API}/categories`, { headers: bearerHeader() })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setCategories(list);
      })
      .catch(() => setCategories([]));
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [open]);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const set = (key: keyof Omit<NewProduct, 'images'>) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)
    );
    if (accepted.length < files.length) {
      setError('Certains fichiers ont été ignorés. Formats acceptés : JPEG, PNG, WEBP, GIF.');
    }
    const next = [...form.images, ...accepted].slice(0, 10);
    setForm((f) => ({ ...f, images: next }));
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    const next = form.images.filter((_, idx) => idx !== i);
    setForm((f) => ({ ...f, images: next }));
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.categoryId) {
      setError('Veuillez sélectionner une catégorie.');
      return;
    }

    setBusy(true);

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('price', form.price);
    fd.append('stock', form.stock);
    fd.append('categoryId', form.categoryId);
    if (form.description.trim()) fd.append('description', form.description.trim());
    form.images.forEach((file) => fd.append('images', file));

    try {
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: bearerHeader(),   // pas de Content-Type : le browser pose le boundary multipart
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = Array.isArray(err.message) ? err.message[0] : (err.message ?? `Erreur ${res.status}`);
        setError(msg);
        return;
      }
      const created: Product = await res.json();
      setSuccess(true);
      setTimeout(() => {
        onCreated(created);
        onClose();
      }, 800);
    } catch {
      setError('Impossible de créer le produit. Vérifiez votre connexion.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 50, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 520,
        background: '#fff', zIndex: 51,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        animation: 'slideIn 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid var(--bem-gray-100)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 3 }}>
              Nouveau produit
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--bem-black)' }}>
              Ajouter un produit
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'var(--bem-gray-50)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--bem-gray-400)', transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bem-gray-100)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--bem-black)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bem-gray-50)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--bem-gray-400)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form
          id="add-product-form"
          onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(204,31,39,0.07)', border: '1px solid rgba(204,31,39,0.2)',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--bem-red)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ fontSize: 12, color: 'var(--bem-red)', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Produit créé avec succès !</p>
            </div>
          )}

          {/* Nom */}
          <div>
            <label style={labelStyle}>Nom du produit *</label>
            <input
              ref={firstInputRef}
              type="text"
              required
              placeholder="Ex: Hoodie BEM Dakar"
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-black)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              placeholder="Description du produit (optionnel)"
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={3}
              style={{
                ...inputStyle, height: 'auto', padding: '10px 12px',
                resize: 'vertical', lineHeight: 1.5,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-black)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Prix + Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Prix (XOF) *</label>
              <input
                type="number"
                required
                min="0"
                step="100"
                placeholder="5000"
                value={form.price}
                onChange={(e) => set('price')(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bem-black)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Stock *</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="10"
                value={form.stock}
                onChange={(e) => set('stock')(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bem-black)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label style={labelStyle}>Catégorie *</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => set('categoryId')(e.target.value)}
              style={{
                width: '100%', height: 42, padding: '0 36px 0 12px', borderRadius: 9,
                border: '1.5px solid var(--bem-gray-100)',
                backgroundColor: 'var(--bem-gray-50)', fontSize: 13,
                outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
                boxSizing: 'border-box' as const,
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                cursor: 'pointer',
                color: form.categoryId ? 'var(--bem-black)' : 'var(--bem-gray-400)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-black)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,13,13,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--bem-gray-100)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="" disabled>— Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p style={{ fontSize: 11, color: 'var(--bem-gray-400)', marginTop: 5 }}>
                Chargement des catégories…
              </p>
            )}
          </div>

          {/* Images */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Images{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--bem-gray-400)', fontSize: 10 }}>
                  (max 10 — JPEG, PNG, WEBP, GIF — 5 Mo)
                </span>
              </label>
              {form.images.length > 0 && form.images.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 6, border: '1.5px solid var(--bem-gray-100)',
                    background: '#fff', color: 'var(--bem-gray-700)', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bem-black)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--bem-gray-100)')}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Ajouter
                </button>
              )}
            </div>

            {/* Drop zone */}
            {form.images.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bem-black)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bem-gray-50)'; }}
                onDragLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bem-gray-100)'; (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bem-gray-100)';
                  (e.currentTarget as HTMLDivElement).style.background = '#fff';
                  handleFiles(e.dataTransfer.files);
                }}
                style={{
                  border: '2px dashed var(--bem-gray-100)', borderRadius: 12,
                  padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--bem-gray-50)', border: '1.5px solid var(--bem-gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="1.8">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--bem-black)', marginBottom: 4 }}>
                  Glisser-déposer ou cliquer pour choisir
                </p>
                <p style={{ fontSize: 11, color: 'var(--bem-gray-400)' }}>
                  JPEG, PNG, WEBP, GIF — max 5 Mo chacune
                </p>
              </div>
            )}

            {/* Thumbnails grid */}
            {form.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--bem-gray-100)' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 22, height: 22, borderRadius: '50%', border: 'none',
                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                    {i === 0 && (
                      <span style={{
                        position: 'absolute', bottom: 4, left: 4,
                        fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                        background: 'var(--bem-red)', color: '#fff',
                      }}>
                        Principal
                      </span>
                    )}
                  </div>
                ))}
                {form.images.length < 10 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      aspectRatio: '1', borderRadius: 10,
                      border: '2px dashed var(--bem-gray-100)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bem-black)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--bem-gray-100)')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid var(--bem-gray-100)',
          display: 'flex', gap: 10, flexShrink: 0,
          background: '#fff',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, height: 44, borderRadius: 10,
              border: '1.5px solid var(--bem-gray-100)',
              background: '#fff', color: 'var(--bem-gray-700)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--bem-black)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--bem-gray-100)')}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="add-product-form"
            disabled={busy || success}
            style={{
              flex: 2, height: 44, borderRadius: 10, border: 'none',
              background: busy || success ? 'var(--bem-gray-400)' : 'var(--bem-black)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: busy || success ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
              boxShadow: busy || success ? 'none' : '0 2px 12px rgba(13,13,13,0.2)',
            }}
          >
            {busy ? (
              <>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Création…
              </>
            ) : success ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Créé !
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Créer le produit
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function ProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [pendingMode, setPendingMode] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [actionId, setActionId]   = useState<string | null>(null);
  const [addOpen, setAddOpen]     = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headers = { ...bearerHeader(), 'Content-Type': 'application/json' };

  const fetchProducts = useCallback(async (pg: number, q: string, pending: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const limit = pending ? 100 : PAGE_SIZE;
      const url = `${API}/products?page=${pg}&limit=${limit}${q ? `&search=${encodeURIComponent(q)}` : ''}`;
      const res = await fetch(url, { headers: bearerHeader() });
      if (!res.ok) throw new Error(`${res.status}`);
      const json: ApiResponse = await res.json();
      const data = pending ? (json.data ?? []).filter((p) => !p.isApproved) : (json.data ?? []);
      setProducts(data);
      setTotal(pending ? data.length : (json.total ?? 0));
    } catch {
      setError('Impossible de charger les produits. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page, search, pendingMode);
  }, [page, pendingMode, fetchProducts]);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(1, v, pendingMode);
    }, 400);
  };

  const handleModeChange = (pending: boolean) => {
    setPendingMode(pending);
    setPage(1);
  };

  const handleApprove = async (id: string, approve: boolean) => {
    setActionId(id);
    try {
      const res = await fetch(`${API}/products/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isApproved: approve }),
      });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isApproved: approve } : p));
      if (pendingMode && approve) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setTotal((t) => Math.max(0, t - 1));
      }
    } catch {
      alert('Erreur lors de la mise à jour du produit.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer le produit "${name}" ? Cette action est irréversible.`)) return;
    setActionId(id);
    try {
      const res = await fetch(`${API}/products/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch {
      alert('Erreur lors de la suppression.');
    } finally {
      setActionId(null);
    }
  };

  const handleProductCreated = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
    setTotal((t) => t + 1);
  };

  const totalPages  = pendingMode ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allPending   = loading ? null : products.filter((p) => !p.isApproved).length;

  return (
    <div style={{ padding: '2rem', minHeight: '100%' }}>

      <Appear>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 6 }}>
              Gestion
            </p>
            <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--bem-black)', lineHeight: 1.2 }}>
              Produits
            </h1>
            {!loading && (
              <p style={{ color: 'var(--bem-gray-400)', fontSize: 13, marginTop: 6 }}>
                {total} produit{total !== 1 ? 's' : ''}
                {pendingMode
                  ? ' en attente d\'approbation'
                  : allPending !== null && allPending > 0
                    ? ` — ${allPending} en attente d'approbation`
                    : ''}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Refresh */}
            <button
              onClick={() => fetchProducts(page, search, pendingMode)}
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

            {/* Add product */}
            <button
              onClick={() => setAddOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '0 20px', height: 40, borderRadius: 10,
                border: 'none',
                background: 'var(--bem-black)', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(13,13,13,0.18)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ajouter un produit
            </button>
          </div>
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
                placeholder="Rechercher un produit…"
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

            <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bem-gray-50)', borderRadius: 10 }}>
              {[{ label: 'Tous', value: false }, { label: 'En attente', value: true }].map((opt) => {
                const active = pendingMode === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => handleModeChange(opt.value)}
                    style={{
                      padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600,
                      background: active ? '#fff' : 'transparent',
                      color: active ? 'var(--bem-black)' : 'var(--bem-gray-400)',
                      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bem-gray-100)' }}>
                  {['Image', 'Nom', 'Prix', 'Stock', 'Statut', 'Catégorie', 'Actions'].map((h) => (
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
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%',
                          background: 'var(--bem-gray-50)', border: '2px solid var(--bem-gray-100)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="1.4">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          </svg>
                        </div>
                        <p style={{ color: 'var(--bem-gray-400)', fontSize: 14, fontWeight: 600 }}>
                          {pendingMode ? 'Aucun produit en attente d\'approbation.' : 'Aucun produit trouvé.'}
                        </p>
                        {!pendingMode && (
                          <button
                            onClick={() => setAddOpen(true)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '8px 18px', borderRadius: 8, border: 'none',
                              background: 'var(--bem-black)', color: '#fff',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Ajouter le premier produit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const busy = actionId === product.id;
                    return (
                      <tr
                        key={product.id}
                        style={{ borderBottom: '1px solid var(--bem-gray-100)', transition: 'background 0.12s', opacity: busy ? 0.6 : 1 }}
                        onMouseEnter={(e) => { if (!busy) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bem-gray-50)'; }}
                        onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          {product.imageUrls?.[0] ? (
                            <img
                              src={product.imageUrls[0]}
                              alt={product.name}
                              style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', display: 'block', background: 'var(--bem-gray-100)' }}
                            />
                          ) : (
                            <div style={{
                              width: 48, height: 48, borderRadius: 10, background: 'var(--bem-gray-100)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                              </svg>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--bem-black)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.name}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--bem-black)', whiteSpace: 'nowrap' }}>
                          {fmtPrice(product.price)}
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <StockBadge stock={product.stock} />
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <ApprovalBadge approved={product.isApproved} />
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--bem-gray-700)', whiteSpace: 'nowrap' }}>
                          {product.category?.name ?? '—'}
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => setEditProduct(product)}
                              disabled={busy}
                              style={{
                                padding: '5px 12px', borderRadius: 8, border: 'none', cursor: busy ? 'wait' : 'pointer',
                                fontSize: 12, fontWeight: 600,
                                background: 'rgba(37,99,235,0.10)', color: '#1d4ed8',
                                transition: 'opacity 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                            >
                              Modifier
                            </button>
                            {!product.isApproved && (
                              <button
                                onClick={() => handleApprove(product.id, true)}
                                disabled={busy}
                                style={{
                                  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: busy ? 'wait' : 'pointer',
                                  fontSize: 12, fontWeight: 600,
                                  background: 'rgba(22,163,74,0.12)', color: '#15803d',
                                  transition: 'opacity 0.15s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                              >
                                Approuver
                              </button>
                            )}
                            {product.isApproved && (
                              <button
                                onClick={() => handleApprove(product.id, false)}
                                disabled={busy}
                                style={{
                                  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: busy ? 'wait' : 'pointer',
                                  fontSize: 12, fontWeight: 600,
                                  background: 'rgba(245,158,11,0.12)', color: '#b45309',
                                  transition: 'opacity 0.15s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                              >
                                Rejeter
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              disabled={busy}
                              style={{
                                padding: '5px 12px', borderRadius: 8, border: 'none', cursor: busy ? 'wait' : 'pointer',
                                fontSize: 12, fontWeight: 600,
                                background: 'rgba(204,31,39,0.10)', color: 'var(--bem-red)',
                                transition: 'opacity 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                            >
                              Supprimer
                            </button>
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
          {!loading && !pendingMode && total > PAGE_SIZE && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderTop: '1px solid var(--bem-gray-100)', gap: 12,
            }}>
              <p style={{ fontSize: 13, color: 'var(--bem-gray-400)' }}>
                Page {page} sur {totalPages} — {total} produits
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

      <EditProductModal
        open={editProduct !== null}
        product={editProduct}
        onClose={() => setEditProduct(null)}
        onUpdated={(updated) => {
          setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
          setEditProduct(null);
        }}
      />

      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleProductCreated}
      />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin  { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
