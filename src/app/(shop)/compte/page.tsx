'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, type RegisterData } from '@/lib/AuthContext';
import { bearerHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

/* ── utils ──────────────────────────────────────────────── */
const ROLE_LABEL: Record<string, string> = {
  ADMIN:'Administrateur', STUDENT:'Étudiant',
  PARENT:'Parent', ALUMNI:'Alumni', GUEST:'Invité',
};
const initials = (f='', l='') => `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
const fmt = (n: number) =>
  new Intl.NumberFormat('fr-SN', { style:'currency', currency:'XOF', minimumFractionDigits:0 }).format(n);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-SN', { day:'numeric', month:'long', year:'numeric' });

/* ── types ──────────────────────────────────────────────── */
type OrderStatus = 'PENDING'|'CONFIRMED'|'SHIPPED'|'DELIVERED'|'CANCELLED';
type OrderItem = { id:string; quantity:number; unitPrice:string|number; product:{id:string;name:string;imageUrls:string[]} };
type Order = { id:string; status:OrderStatus; totalAmount:string|number; deliveryType:string; createdAt:string; items:OrderItem[] };

const STATUS: Record<OrderStatus,{label:string;color:string;bg:string}> = {
  PENDING:   { label:'En attente', color:'#b45309', bg:'#fef3c7' },
  CONFIRMED: { label:'Confirmée',  color:'#1d4ed8', bg:'#dbeafe' },
  SHIPPED:   { label:'Expédiée',   color:'#7c3aed', bg:'#ede9fe' },
  DELIVERED: { label:'Livrée',     color:'#15803d', bg:'#dcfce7' },
  CANCELLED: { label:'Annulée',    color:'#dc2626', bg:'#fee2e2' },
};

/* ── Fade wrapper ───────────────────────────────────────── */
function Fade({ children, delay=0 }: { children:React.ReactNode; delay?:number }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.3, delay:delay/1000, ease:[0.22,1,0.36,1] }}>
      {children}
    </motion.div>
  );
}

/* ── Input field ────────────────────────────────────────── */
function Field({ label, name, type='text', value, onChange, autoComplete }: {
  label:string; name:string; type?:string;
  value:string; onChange:(v:string)=>void; autoComplete?:string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:'14px' }}>
      <label style={{
        display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.12em',
        textTransform:'uppercase', marginBottom:'7px',
        color: focused ? 'var(--bem-black)' : 'var(--bem-gray-400)', transition:'color .18s',
      }}>{label}</label>
      <input name={name} type={type} value={value} autoComplete={autoComplete} required
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', height:'48px', padding:'0 16px', borderRadius:'10px',
          border:`1.5px solid ${focused ? 'var(--bem-black)' : 'var(--bem-gray-100)'}`,
          background: focused ? '#fff' : 'var(--bem-gray-50)',
          fontSize:'13px', color:'var(--bem-black)', outline:'none',
          boxShadow: focused ? '0 0 0 3px rgba(13,13,13,.06)' : 'none',
          transition:'all .18s',
        }}
      />
    </div>
  );
}

/* ── Error box ──────────────────────────────────────────── */
function ErrorBox({ msg }: { msg:string }) {
  return (
    <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
      style={{
        display:'flex', alignItems:'flex-start', gap:'10px',
        padding:'13px 16px', borderRadius:'10px', marginBottom:'16px',
        background:'rgba(204,31,39,.07)', border:'1px solid rgba(204,31,39,.15)',
      }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="var(--bem-red)" strokeWidth="2" style={{ marginTop:1, flexShrink:0 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style={{ fontSize:'13px', color:'var(--bem-red)', lineHeight:1.5 }}>{msg}</p>
    </motion.div>
  );
}

/* ── Submit button ──────────────────────────────────────── */
function SubmitBtn({ busy, label, loadingLabel }: { busy:boolean; label:string; loadingLabel:string }) {
  return (
    <motion.button type="submit" disabled={busy} whileTap={{ scale:0.98 }}
      style={{
        width:'100%', height:'50px', borderRadius:'10px', border:'none',
        cursor: busy ? 'wait' : 'pointer',
        background: busy ? 'var(--bem-gray-400)' : 'var(--bem-black)',
        color:'#fff', fontWeight:800, fontSize:'12px', letterSpacing:'.08em',
        textTransform:'uppercase', marginTop:'4px',
        boxShadow: busy ? 'none' : '0 4px 20px rgba(13,13,13,.2)',
        transition:'background .25s, box-shadow .25s',
      }}>
      <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
        {busy && (
          <svg style={{ animation:'spin .8s linear infinite' }} width="15" height="15"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        )}
        {busy ? loadingLabel : label}
      </span>
    </motion.button>
  );
}

/* ── Google button ──────────────────────────────────────── */
function GoogleBtn() {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';
  return (
    <button type="button" onClick={() => { window.location.href = `${BACKEND}/auth/google`; }}
      style={{
        width:'100%', height:'48px', borderRadius:'10px',
        border:'1.5px solid var(--bem-gray-100)', background:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
        fontSize:'13px', fontWeight:600, color:'var(--bem-black)', cursor:'pointer',
        transition:'border-color .15s, box-shadow .15s',
      }}
      onMouseEnter={(e) => { const b=e.currentTarget; b.style.borderColor='var(--bem-black)'; b.style.boxShadow='0 2px 12px rgba(0,0,0,.08)'; }}
      onMouseLeave={(e) => { const b=e.currentTarget; b.style.borderColor='var(--bem-gray-100)'; b.style.boxShadow='none'; }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continuer avec Google
    </button>
  );
}

/* ── Login form ─────────────────────────────────────────── */
function LoginForm({ onSwitch }: { onSwitch:()=>void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);
  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(null);
    const err = await login(email, password);
    if (err) setError(err);
    setBusy(false);
  }
  return (
    <form onSubmit={handle}>
      {error && <ErrorBox msg={error} />}
      <Field label="Adresse e-mail" name="email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field label="Mot de passe" name="password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <SubmitBtn busy={busy} label="Se connecter" loadingLabel="Connexion…" />
      <p style={{ textAlign:'center', fontSize:'12px', color:'var(--bem-gray-400)', marginTop:'16px' }}>
        Pas encore de compte ?{' '}
        <button type="button" onClick={onSwitch}
          style={{ fontWeight:700, color:'var(--bem-red)', background:'none', border:'none', cursor:'pointer', fontSize:'inherit' }}>
          Créer un compte
        </button>
      </p>
    </form>
  );
}

/* ── Register form ──────────────────────────────────────── */
function RegisterForm({ onSwitch }: { onSwitch:()=>void }) {
  const { register } = useAuth();
  const [form, setForm] = useState<RegisterData>({ firstName:'', lastName:'', email:'', password:'' });
  const [error, setError] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof RegisterData) => (v: string) => setForm((f)=>({...f,[k]:v}));
  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(null);
    const err = await register(form);
    if (err) setError(typeof err==='string' ? err : 'Une erreur est survenue.');
    setBusy(false);
  }
  return (
    <form onSubmit={handle}>
      {error && <ErrorBox msg={error} />}
      <div style={{ display:'grid', gap:'10px' }} className="grid-cols-2 max-[400px]:grid-cols-1">
        <Field label="Prénom" name="firstName" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
        <Field label="Nom"    name="lastName"  value={form.lastName}  onChange={set('lastName')}  autoComplete="family-name" />
      </div>
      <Field label="Adresse e-mail" name="email"    type="email"    value={form.email}    onChange={set('email')}    autoComplete="email" />
      <Field label="Mot de passe"   name="password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
      <SubmitBtn busy={busy} label="Créer mon compte" loadingLabel="Création…" />
      <p style={{ textAlign:'center', fontSize:'12px', color:'var(--bem-gray-400)', marginTop:'16px' }}>
        Déjà un compte ?{' '}
        <button type="button" onClick={onSwitch}
          style={{ fontWeight:700, color:'var(--bem-red)', background:'none', border:'none', cursor:'pointer', fontSize:'inherit' }}>
          Se connecter
        </button>
      </p>
    </form>
  );
}

/* ── Auth page ──────────────────────────────────────────── */
function AuthPage() {
  const [tab, setTab] = useState<'login'|'register'>('login');
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}
      className="max-md:grid-cols-1 md:min-h-[82vh]">

      {/* Left — branding */}
      <div className="hidden md:flex flex-col justify-between"
        style={{ background:'var(--bem-black)', padding:'clamp(32px, 4vw, 52px)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-80px', right:'-60px', width:'320px', height:'320px', borderRadius:'50%', background:'rgba(204,31,39,.12)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-60px', left:'-40px', width:'220px', height:'220px', borderRadius:'50%', background:'rgba(204,31,39,.08)', pointerEvents:'none' }} />

        <Fade>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(204,31,39,.18)', borderRadius:'99px', padding:'5px 14px' }}>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--bem-red)', display:'inline-block' }} />
            <span style={{ color:'var(--bem-red)', fontSize:'10px', fontWeight:700, letterSpacing:'.15em', textTransform:'uppercase' }}>BEM Dakar</span>
          </div>
        </Fade>

        <div>
          <Fade delay={40}>
            <p style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', letterSpacing:'.14em', textTransform:'uppercase', fontWeight:600, marginBottom:'16px' }}>
              La boutique officielle
            </p>
          </Fade>
          <Fade delay={80}>
            <h1 style={{ fontFamily:'var(--font-playfair),serif', fontSize:'clamp(2rem,3.5vw,2.8rem)', fontWeight:800, color:'#fff', lineHeight:1.15, marginBottom:'18px' }}>
              Votre espace<br /><span style={{ color:'var(--bem-red)' }}>personnel</span>
            </h1>
          </Fade>
          <Fade delay={120}>
            <p style={{ color:'rgba(255,255,255,.5)', fontSize:'13px', lineHeight:1.7, maxWidth:'300px' }}>
              Accédez à vos commandes, gérez votre profil et retrouvez tous vos achats au même endroit.
            </p>
          </Fade>
          <Fade delay={160}>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'28px' }}>
              {[
                ['🛍️','Suivi de vos commandes en temps réel'],
                ['🔒','Compte sécurisé et données protégées'],
                ['⚡','Checkout rapide avec vos infos enregistrées'],
              ].map(([icon,text]) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <span style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(255,255,255,.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>{icon}</span>
                  <span style={{ color:'rgba(255,255,255,.5)', fontSize:'12px' }}>{text}</span>
                </div>
              ))}
            </div>
          </Fade>
        </div>

        <Fade delay={200}>
          <p style={{ color:'rgba(255,255,255,.2)', fontSize:'11px' }}>© 2026 BEM Dakar Goodies</p>
        </Fade>
      </div>

      {/* Right — form */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)', background:'#fafaf9' }}>
        <div style={{ width:'100%', maxWidth:'380px' }}>

          {/* Mobile brand badge — hidden on md+ */}
          <div className="flex md:hidden items-center gap-2 mb-6">
            <div style={{ width:32, height:32, borderRadius:8, background:'var(--bem-red)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--bem-black)' }}>BEM Dakar Goodies</span>
          </div>

          <Fade>
            <h2 style={{ fontFamily:'var(--font-playfair),serif', fontSize:'clamp(1.4rem, 5vw, 1.75rem)', fontWeight:800, color:'var(--bem-black)', marginBottom:'5px' }}>
              {tab==='login' ? 'Bon retour !' : 'Rejoignez-nous'}
            </h2>
            <p style={{ color:'var(--bem-gray-400)', fontSize:'13px', marginBottom:'24px' }}>
              {tab==='login' ? 'Connectez-vous à votre espace BEM.' : 'Créez votre compte en quelques secondes.'}
            </p>
          </Fade>

          {/* Tabs */}
          <Fade delay={40}>
            <div style={{ display:'flex', gap:'3px', padding:'4px', background:'var(--bem-gray-100)', borderRadius:'10px', marginBottom:'22px' }}>
              {(['login','register'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} style={{
                  flex:1, height:'38px', border:'none', cursor:'pointer', borderRadius:'7px',
                  fontSize:'12px', fontWeight:600, transition:'all .18s',
                  background: tab===t ? '#fff' : 'transparent',
                  color: tab===t ? 'var(--bem-black)' : 'var(--bem-gray-400)',
                  boxShadow: tab===t ? '0 1px 6px rgba(0,0,0,.1)' : 'none',
                }}>
                  {t==='login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>
          </Fade>

          <Fade delay={60}><GoogleBtn /></Fade>
          <Fade delay={70}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'16px 0' }}>
              <div style={{ flex:1, height:'1px', background:'var(--bem-gray-100)' }} />
              <span style={{ fontSize:'11px', color:'var(--bem-gray-400)', fontWeight:500 }}>ou</span>
              <div style={{ flex:1, height:'1px', background:'var(--bem-gray-100)' }} />
            </div>
          </Fade>

          <Fade delay={80}>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} transition={{ duration:0.2 }}>
                {tab==='login'
                  ? <LoginForm onSwitch={() => setTab('register')} />
                  : <RegisterForm onSwitch={() => setTab('login')} />}
              </motion.div>
            </AnimatePresence>
          </Fade>

          <Fade delay={120}>
            <p style={{ textAlign:'center', fontSize:'11px', color:'var(--bem-gray-400)', marginTop:'24px' }}>
              En continuant, vous acceptez nos{' '}
              <Link href="#" style={{ color:'var(--bem-black)', fontWeight:600 }}>conditions d&apos;utilisation</Link>.
            </p>
          </Fade>
        </div>
      </div>
    </div>
  );
}

/* ── Order card ─────────────────────────────────────────── */
function OrderCard({ order }: { order:Order }) {
  const st = STATUS[order.status] ?? STATUS.PENDING;
  const total = typeof order.totalAmount==='string' ? parseFloat(order.totalAmount) : order.totalAmount;
  const totalQty = order.items.reduce((s,i)=>s+i.quantity,0);
  return (
    <div style={{ background:'#fff', border:'1px solid var(--bem-gray-100)', borderRadius:'14px', overflow:'hidden', transition:'box-shadow .2s, transform .2s' }}
      onMouseEnter={(e) => { const el=e.currentTarget; el.style.boxShadow='0 4px 20px rgba(0,0,0,.08)'; el.style.transform='translateY(-2px)'; }}
      onMouseLeave={(e) => { const el=e.currentTarget; el.style.boxShadow='none'; el.style.transform='none'; }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--bem-gray-100)', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <p style={{ fontSize:'10px', color:'var(--bem-gray-400)', marginBottom:'1px' }}>Commande</p>
          <p style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700 }}>#{order.id.slice(0,8).toUpperCase()}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
          <span style={{ fontSize:'11px', color:'var(--bem-gray-400)' }}>{fmtDate(order.createdAt)}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'99px', background:st.bg, color:st.color, fontSize:'10px', fontWeight:700 }}>
            {st.label}
          </span>
        </div>
      </div>
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
          {order.items.slice(0,3).map((item) => (
            <div key={item.id} style={{ width:'50px', height:'50px', borderRadius:'9px', overflow:'hidden', background:'var(--bem-gray-50)', border:'1px solid var(--bem-gray-100)', position:'relative', flexShrink:0 }}>
              {item.product.imageUrls?.[0]
                ? <Image src={item.product.imageUrls[0]} alt={item.product.name} fill className="object-cover" sizes="50px" />
                : <div style={{ width:'100%', height:'100%', background:'var(--bem-gray-100)' }} />}
            </div>
          ))}
          {order.items.length > 3 && (
            <div style={{ width:'50px', height:'50px', borderRadius:'9px', background:'var(--bem-gray-50)', border:'1px solid var(--bem-gray-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'var(--bem-gray-400)' }}>
              +{order.items.length-3}
            </div>
          )}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:'12px', fontWeight:600, lineHeight:1.3 }} className="line-clamp-1">
            {order.items.map((i)=>i.product.name).join(', ')}
          </p>
          <p style={{ fontSize:'11px', color:'var(--bem-gray-400)', marginTop:'2px' }}>{totalQty} article{totalQty>1?'s':''}</p>
        </div>
        <p style={{ fontSize:'15px', fontWeight:800, flexShrink:0 }}>{fmt(total)}</p>
      </div>
    </div>
  );
}

/* ── Orders section ─────────────────────────────────────── */
function OrdersSection({ onBack }: { onBack:()=>void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API}/orders`, { headers:bearerHeader(), credentials:'include' });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setOrders(Array.isArray(d) ? d : (d.data ?? []));
    } catch { setError('Impossible de charger vos commandes.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);

  return (
    <div className="bem-container" style={{ maxWidth:'860px', paddingTop:'32px', paddingBottom:'64px' }}>
      <button onClick={onBack}
        style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginBottom:'28px', background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:600, color:'var(--bem-gray-400)', padding:0, transition:'color .15s' }}
        onMouseEnter={(e) => (e.currentTarget.style.color='var(--bem-black)')}
        onMouseLeave={(e) => (e.currentTarget.style.color='var(--bem-gray-400)')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Mon espace
      </button>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h2 style={{ fontSize:'22px', fontWeight:900 }}>Mes commandes</h2>
          {!loading && !error && <p style={{ fontSize:'12px', color:'var(--bem-gray-400)', marginTop:'4px' }}>{orders.length} commande{orders.length!==1?'s':''}</p>}
        </div>
        <button onClick={fetch_}
          style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'99px', border:'1.5px solid var(--bem-gray-100)', background:'#fff', cursor:'pointer', fontSize:'12px', fontWeight:600, color:'var(--bem-gray-400)', transition:'all .15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor='var(--bem-black)'; (e.currentTarget as HTMLElement).style.color='var(--bem-black)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor='var(--bem-gray-100)'; (e.currentTarget as HTMLElement).style.color='var(--bem-gray-400)'; }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
          </svg>
          Actualiser
        </button>
      </div>

      {loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {[1,2,3].map((i)=>(
            <div key={i} style={{ height:'88px', borderRadius:'14px', background:'var(--bem-gray-100)', animation:'shimmer 1.4s ease infinite', animationDelay:`${i*.1}s` }} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div style={{ padding:'20px 24px', borderRadius:'14px', background:'#fef2f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', gap:'12px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize:'13px', color:'#dc2626' }}>{error}</p>
        </div>
      )}

      {!loading && !error && orders.length===0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:'16px', border:'1px solid var(--bem-gray-100)' }}>
          <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'var(--bem-gray-50)', border:'2px solid var(--bem-gray-100)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="1.4">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <p style={{ fontSize:'14px', fontWeight:700, marginBottom:'8px' }}>Aucune commande pour l&apos;instant</p>
          <p style={{ fontSize:'12px', color:'var(--bem-gray-400)', marginBottom:'22px' }}>Vos commandes apparaîtront ici après votre premier achat.</p>
          <Link href="/catalogue" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'10px 24px', borderRadius:'99px', background:'var(--bem-black)', color:'#fff', fontSize:'12px', fontWeight:700, textDecoration:'none' }}>
            Voir le catalogue
          </Link>
        </div>
      )}

      {!loading && !error && orders.length>0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {orders.map((order,i)=>(
            <motion.div key={order.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}>
              <OrderCard order={order} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Profile section ────────────────────────────────────── */
function ProfileSection({ onBack }: { onBack:()=>void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ firstName: user?.firstName??'', lastName: user?.lastName??'' });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [busy, setBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [msg, setMsg] = useState<{type:'ok'|'err';text:string}|null>(null);
  const [pwMsg, setPwMsg] = useState<{type:'ok'|'err';text:string}|null>(null);

  const showMsg  = (type:'ok'|'err', text:string) => { setMsg({type,text}); setTimeout(()=>setMsg(null),4000); };
  const showPwMsg= (type:'ok'|'err', text:string) => { setPwMsg({type,text}); setTimeout(()=>setPwMsg(null),4000); };

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const r = await fetch(`${API}/auth/profile`, { method:'PATCH', headers:{...bearerHeader(),'Content-Type':'application/json'}, body:JSON.stringify({ firstName:form.firstName.trim(), lastName:form.lastName.trim() }) });
      if (!r.ok) throw new Error((await r.json()).message ?? 'Erreur');
      showMsg('ok', 'Profil mis à jour.');
    } catch(e:unknown) { showMsg('err', e instanceof Error ? e.message : 'Erreur'); }
    finally { setBusy(false); }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { showPwMsg('err','Les mots de passe ne correspondent pas.'); return; }
    setPwBusy(true);
    try {
      const r = await fetch(`${API}/auth/profile`, { method:'PATCH', headers:{...bearerHeader(),'Content-Type':'application/json'}, body:JSON.stringify({ currentPassword:pwForm.currentPassword, newPassword:pwForm.newPassword }) });
      if (!r.ok) throw new Error((await r.json()).message ?? 'Erreur');
      showPwMsg('ok','Mot de passe modifié.');
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch(e:unknown) { showPwMsg('err', e instanceof Error ? e.message : 'Erreur'); }
    finally { setPwBusy(false); }
  }

  const inputStyle: React.CSSProperties = { width:'100%', height:44, padding:'0 14px', borderRadius:10, border:'1.5px solid var(--bem-gray-100)', background:'var(--bem-gray-50)', fontSize:13, color:'var(--bem-black)', outline:'none', boxSizing:'border-box', transition:'border-color .18s' };
  const labelStyle: React.CSSProperties = { display:'block', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--bem-gray-400)', marginBottom:6 };

  return (
    <div className="bem-container" style={{ maxWidth:'620px', paddingTop:'32px', paddingBottom:'64px' }}>
      <button onClick={onBack} style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:28, background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--bem-gray-400)', padding:0, transition:'color .15s' }}
        onMouseEnter={(e)=>(e.currentTarget.style.color='var(--bem-black)')} onMouseLeave={(e)=>(e.currentTarget.style.color='var(--bem-gray-400)')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Mon espace
      </button>

      <h2 style={{ fontSize:22, fontWeight:900, marginBottom:24 }}>Mon profil</h2>

      {/* Infos perso */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid var(--bem-gray-100)', padding:'24px', marginBottom:16 }}>
        <p style={{ fontSize:13, fontWeight:700, marginBottom:18 }}>Informations personnelles</p>

        {msg && (
          <div style={{ padding:'10px 14px', borderRadius:9, marginBottom:16, fontSize:12, fontWeight:600, background: msg.type==='ok' ? 'rgba(22,163,74,.1)' : 'rgba(204,31,39,.08)', color: msg.type==='ok' ? '#15803d' : 'var(--bem-red)', border: `1px solid ${msg.type==='ok' ? 'rgba(22,163,74,.2)' : 'rgba(204,31,39,.2)'}` }}>
            {msg.text}
          </div>
        )}

        {/* Email en lecture seule */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Adresse e-mail</label>
          <div style={{ ...inputStyle, display:'flex', alignItems:'center', background:'var(--bem-gray-100)', color:'var(--bem-gray-400)', cursor:'default' }}>
            {user?.email}
          </div>
        </div>

        <form onSubmit={handleProfile}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={labelStyle}>Prénom</label>
              <input style={inputStyle} value={form.firstName} onChange={(e)=>setForm(f=>({...f,firstName:e.target.value}))} required
                onFocus={(e)=>(e.currentTarget.style.borderColor='var(--bem-black)')} onBlur={(e)=>(e.currentTarget.style.borderColor='var(--bem-gray-100)')}/>
            </div>
            <div>
              <label style={labelStyle}>Nom</label>
              <input style={inputStyle} value={form.lastName} onChange={(e)=>setForm(f=>({...f,lastName:e.target.value}))} required
                onFocus={(e)=>(e.currentTarget.style.borderColor='var(--bem-black)')} onBlur={(e)=>(e.currentTarget.style.borderColor='var(--bem-gray-100)')}/>
            </div>
          </div>
          <button type="submit" disabled={busy} style={{ height:44, padding:'0 24px', borderRadius:10, border:'none', background:busy?'var(--bem-gray-400)':'var(--bem-black)', color:'#fff', fontWeight:700, fontSize:13, cursor:busy?'wait':'pointer', transition:'background .2s' }}>
            {busy ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </form>
      </div>

      {/* Mot de passe */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid var(--bem-gray-100)', padding:'24px' }}>
        <p style={{ fontSize:13, fontWeight:700, marginBottom:18 }}>Changer le mot de passe</p>

        {pwMsg && (
          <div style={{ padding:'10px 14px', borderRadius:9, marginBottom:16, fontSize:12, fontWeight:600, background: pwMsg.type==='ok' ? 'rgba(22,163,74,.1)' : 'rgba(204,31,39,.08)', color: pwMsg.type==='ok' ? '#15803d' : 'var(--bem-red)', border: `1px solid ${pwMsg.type==='ok' ? 'rgba(22,163,74,.2)' : 'rgba(204,31,39,.2)'}` }}>
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={handlePassword} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={labelStyle}>Mot de passe actuel</label>
            <input type="password" style={inputStyle} value={pwForm.currentPassword} required onChange={(e)=>setPwForm(f=>({...f,currentPassword:e.target.value}))}
              onFocus={(e)=>(e.currentTarget.style.borderColor='var(--bem-black)')} onBlur={(e)=>(e.currentTarget.style.borderColor='var(--bem-gray-100)')}/>
          </div>
          <div>
            <label style={labelStyle}>Nouveau mot de passe</label>
            <input type="password" style={inputStyle} value={pwForm.newPassword} required minLength={8} onChange={(e)=>setPwForm(f=>({...f,newPassword:e.target.value}))}
              onFocus={(e)=>(e.currentTarget.style.borderColor='var(--bem-black)')} onBlur={(e)=>(e.currentTarget.style.borderColor='var(--bem-gray-100)')}/>
          </div>
          <div>
            <label style={labelStyle}>Confirmer le nouveau mot de passe</label>
            <input type="password" style={inputStyle} value={pwForm.confirmPassword} required minLength={8} onChange={(e)=>setPwForm(f=>({...f,confirmPassword:e.target.value}))}
              onFocus={(e)=>(e.currentTarget.style.borderColor='var(--bem-black)')} onBlur={(e)=>(e.currentTarget.style.borderColor='var(--bem-gray-100)')}/>
          </div>
          <div>
            <button type="submit" disabled={pwBusy} style={{ height:44, padding:'0 24px', borderRadius:10, border:'none', background:pwBusy?'var(--bem-gray-400)':'var(--bem-black)', color:'#fff', fontWeight:700, fontSize:13, cursor:pwBusy?'wait':'pointer', transition:'background .2s' }}>
              {pwBusy ? 'Modification…' : 'Modifier le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Addresses section ──────────────────────────────────── */
type Address = { id:string; label:string; street:string; city:string; district?:string|null; phone?:string|null; isDefault:boolean };

const ADDR_EMPTY = { label:'', street:'', city:'', district:'', phone:'' };

function AddressForm({ initial, onSave, onCancel, busy }: { initial: typeof ADDR_EMPTY; onSave:(d:typeof ADDR_EMPTY)=>void; onCancel:()=>void; busy:boolean }) {
  const [form, setForm] = useState(initial);
  const s = (k: keyof typeof ADDR_EMPTY) => (v:string) => setForm(f=>({...f,[k]:v}));
  const inputStyle: React.CSSProperties = { width:'100%', height:44, padding:'0 14px', borderRadius:10, border:'1.5px solid var(--bem-gray-100)', background:'var(--bem-gray-50)', fontSize:13, color:'var(--bem-black)', outline:'none', boxSizing:'border-box', transition:'border-color .18s' };
  const labelStyle: React.CSSProperties = { display:'block', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--bem-gray-400)', marginBottom:6 };
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); onSave(form); }} style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div>
        <label style={labelStyle}>Libellé *</label>
        <input style={inputStyle} placeholder="Ex: Maison, Bureau…" value={form.label} required onChange={(e)=>s('label')(e.target.value)}
          onFocus={(e)=>(e.currentTarget.style.borderColor='var(--bem-black)')} onBlur={(e)=>(e.currentTarget.style.borderColor='var(--bem-gray-100)')}/>
      </div>
      <div>
        <label style={labelStyle}>Rue / Adresse *</label>
        <input style={inputStyle} placeholder="Ex: Rue 10, Liberté 6" value={form.street} required onChange={(e)=>s('street')(e.target.value)}
          onFocus={(e)=>(e.currentTarget.style.borderColor='var(--bem-black)')} onBlur={(e)=>(e.currentTarget.style.borderColor='var(--bem-gray-100)')}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label style={labelStyle}>Ville *</label>
          <input style={inputStyle} placeholder="Dakar" value={form.city} required onChange={(e)=>s('city')(e.target.value)}
            onFocus={(e)=>(e.currentTarget.style.borderColor='var(--bem-black)')} onBlur={(e)=>(e.currentTarget.style.borderColor='var(--bem-gray-100)')}/>
        </div>
        <div>
          <label style={labelStyle}>Quartier</label>
          <input style={inputStyle} placeholder="Plateau" value={form.district} onChange={(e)=>s('district')(e.target.value)}
            onFocus={(e)=>(e.currentTarget.style.borderColor='var(--bem-black)')} onBlur={(e)=>(e.currentTarget.style.borderColor='var(--bem-gray-100)')}/>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Téléphone</label>
        <input style={inputStyle} placeholder="+221 77 000 00 00" value={form.phone} onChange={(e)=>s('phone')(e.target.value)}
          onFocus={(e)=>(e.currentTarget.style.borderColor='var(--bem-black)')} onBlur={(e)=>(e.currentTarget.style.borderColor='var(--bem-gray-100)')}/>
      </div>
      <div style={{ display:'flex', gap:8, paddingTop:4 }}>
        <button type="button" onClick={onCancel} style={{ flex:1, height:44, borderRadius:10, border:'1.5px solid var(--bem-gray-100)', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
        <button type="submit" disabled={busy} style={{ flex:2, height:44, borderRadius:10, border:'none', background:busy?'var(--bem-gray-400)':'var(--bem-black)', color:'#fff', fontSize:13, fontWeight:700, cursor:busy?'wait':'pointer' }}>
          {busy ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>
    </form>
  );
}

function AddressesSection({ onBack }: { onBack:()=>void }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [actionId, setActionId] = useState<string|null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/addresses`, { headers:bearerHeader() });
      if (!r.ok) throw new Error();
      setAddresses(await r.json());
    } catch { setError('Impossible de charger les adresses.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (data: typeof ADDR_EMPTY) => {
    setFormBusy(true);
    try {
      const r = await fetch(`${API}/addresses`, { method:'POST', headers:{...bearerHeader(),'Content-Type':'application/json'}, body:JSON.stringify(data) });
      if (!r.ok) throw new Error();
      setAdding(false);
      await load();
    } catch { setError('Erreur lors de la création.'); }
    finally { setFormBusy(false); }
  };

  const handleEdit = async (data: typeof ADDR_EMPTY) => {
    if (!editId) return;
    setFormBusy(true);
    try {
      const r = await fetch(`${API}/addresses/${editId}`, { method:'PATCH', headers:{...bearerHeader(),'Content-Type':'application/json'}, body:JSON.stringify(data) });
      if (!r.ok) throw new Error();
      setEditId(null);
      await load();
    } catch { setError('Erreur lors de la modification.'); }
    finally { setFormBusy(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette adresse ?')) return;
    setActionId(id);
    try {
      await fetch(`${API}/addresses/${id}`, { method:'DELETE', headers:bearerHeader() });
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch { setError('Erreur lors de la suppression.'); }
    finally { setActionId(null); }
  };

  const handleSetDefault = async (id: string) => {
    setActionId(id);
    try {
      const r = await fetch(`${API}/addresses/${id}/default`, { method:'PATCH', headers:bearerHeader() });
      if (!r.ok) throw new Error();
      await load();
    } catch { setError('Erreur.'); }
    finally { setActionId(null); }
  };

  const editAddr = addresses.find(a => a.id === editId);

  return (
    <div className="bem-container" style={{ maxWidth:'620px', paddingTop:'32px', paddingBottom:'64px' }}>
      <button onClick={onBack} style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:28, background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--bem-gray-400)', padding:0, transition:'color .15s' }}
        onMouseEnter={(e)=>(e.currentTarget.style.color='var(--bem-black)')} onMouseLeave={(e)=>(e.currentTarget.style.color='var(--bem-gray-400)')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Mon espace
      </button>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <h2 style={{ fontSize:22, fontWeight:900 }}>Mes adresses</h2>
        {!adding && !editId && (
          <button onClick={()=>setAdding(true)} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:99, background:'var(--bem-black)', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:16, fontSize:12, fontWeight:600, background:'rgba(204,31,39,.08)', color:'var(--bem-red)', border:'1px solid rgba(204,31,39,.2)', display:'flex', justifyContent:'space-between' }}>
          {error}
          <button onClick={()=>setError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--bem-red)', fontSize:16 }}>×</button>
        </div>
      )}

      {/* Formulaire ajout */}
      {adding && (
        <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid var(--bem-black)', padding:24, marginBottom:16 }}>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Nouvelle adresse</p>
          <AddressForm initial={ADDR_EMPTY} onSave={handleAdd} onCancel={()=>setAdding(false)} busy={formBusy} />
        </div>
      )}

      {loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2].map(i=><div key={i} style={{ height:100, borderRadius:14, background:'var(--bem-gray-100)', animation:'shimmer 1.4s ease infinite' }}/>)}
        </div>
      )}

      {!loading && addresses.length===0 && !adding && (
        <div style={{ textAlign:'center', padding:'48px 20px', background:'#fff', borderRadius:16, border:'1px solid var(--bem-gray-100)' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--bem-gray-50)', border:'2px solid var(--bem-gray-100)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="1.4">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <p style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Aucune adresse enregistrée</p>
          <p style={{ fontSize:12, color:'var(--bem-gray-400)', marginBottom:20 }}>Ajoutez une adresse pour simplifier vos livraisons.</p>
          <button onClick={()=>setAdding(true)} style={{ padding:'10px 24px', borderRadius:99, background:'var(--bem-black)', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            Ajouter une adresse
          </button>
        </div>
      )}

      {!loading && addresses.map((addr) => (
        <div key={addr.id} style={{ background:'#fff', borderRadius:14, border:`1.5px solid ${addr.isDefault ? 'var(--bem-black)' : 'var(--bem-gray-100)'}`, padding:'18px 20px', marginBottom:10, opacity: actionId===addr.id ? 0.5 : 1, transition:'all .15s' }}>
          {editId===addr.id ? (
            <>
              <p style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Modifier l&apos;adresse</p>
              <AddressForm
                initial={{ label:addr.label, street:addr.street, city:addr.city, district:addr.district??'', phone:addr.phone??'' }}
                onSave={handleEdit} onCancel={()=>setEditId(null)} busy={formBusy}
              />
            </>
          ) : (
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ width:38, height:38, borderRadius:10, background: addr.isDefault ? 'var(--bem-black)' : 'var(--bem-gray-50)', color: addr.isDefault ? '#fff' : 'var(--bem-gray-400)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <p style={{ fontSize:13, fontWeight:700 }}>{addr.label}</p>
                    {addr.isDefault && <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'var(--bem-black)', color:'#fff', letterSpacing:'.08em', textTransform:'uppercase' }}>Défaut</span>}
                  </div>
                  <p style={{ fontSize:12, color:'var(--bem-gray-700)', lineHeight:1.5 }}>
                    {addr.street}{addr.district ? `, ${addr.district}` : ''}, {addr.city}
                  </p>
                  {addr.phone && <p style={{ fontSize:12, color:'var(--bem-gray-400)', marginTop:2 }}>{addr.phone}</p>}
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
                {!addr.isDefault && (
                  <button onClick={()=>handleSetDefault(addr.id)} disabled={!!actionId} style={{ padding:'5px 12px', borderRadius:8, border:'1.5px solid var(--bem-gray-100)', background:'#fff', fontSize:11, fontWeight:600, cursor:'pointer', color:'var(--bem-gray-700)', whiteSpace:'nowrap' }}>
                    Par défaut
                  </button>
                )}
                <button onClick={()=>setEditId(addr.id)} disabled={!!actionId} style={{ padding:'5px 12px', borderRadius:8, border:'none', background:'rgba(37,99,235,.1)', fontSize:11, fontWeight:600, cursor:'pointer', color:'#1d4ed8', whiteSpace:'nowrap' }}>
                  Modifier
                </button>
                <button onClick={()=>handleDelete(addr.id)} disabled={!!actionId} style={{ padding:'5px 12px', borderRadius:8, border:'none', background:'rgba(204,31,39,.1)', fontSize:11, fontWeight:600, cursor:'pointer', color:'var(--bem-red)', whiteSpace:'nowrap' }}>
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────────── */
function Dashboard() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [section, setSection] = useState<'home'|'orders'|'profile'|'addresses'>('home');
  const [orders, setOrders] = useState<Order[]|null>(null);

  useEffect(() => {
    fetch(`${API}/orders`, { headers:bearerHeader(), credentials:'include' })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setOrders(Array.isArray(d) ? d : (d.data??[])))
      .catch(() => setOrders([]));
  }, []);

  if (!user) return null;

  if (section==='orders')    return <div style={{ background:'#fafaf9', minHeight:'80vh' }}><OrdersSection    onBack={()=>setSection('home')} /></div>;
  if (section==='profile')   return <div style={{ background:'#fafaf9', minHeight:'80vh' }}><ProfileSection   onBack={()=>setSection('home')} /></div>;
  if (section==='addresses') return <div style={{ background:'#fafaf9', minHeight:'80vh' }}><AddressesSection onBack={()=>setSection('home')} /></div>;

  const NAV_CARDS = [
    {
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
      label:'Mes commandes', sub:'Historique et suivi de vos achats',
      accent:'var(--bem-red)', action:()=>setSection('orders'), enabled:true,
    },
    {
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
      label:'Mon profil', sub:'Nom, e-mail, mot de passe',
      accent:'#2563eb', action:()=>setSection('profile'), enabled:true,
    },
    {
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
      label:'Mes adresses', sub:'Adresses de livraison enregistrées',
      accent:'#16a34a', action:()=>setSection('addresses'), enabled:true,
    },
  ];

  const orderCount = orders?.length ?? null;
  const totalItems = orders?.reduce((s,o)=>s+o.items.reduce((si,i)=>si+i.quantity,0),0) ?? null;

  return (
    <div style={{ background:'#fafaf9', minHeight:'80vh' }}>
      {/* Hero */}
      <div style={{ background:'var(--bem-black)', padding:'40px clamp(20px, 4vw, 48px) 48px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-80px', right:'-40px', width:'280px', height:'280px', borderRadius:'50%', background:'rgba(204,31,39,.1)', pointerEvents:'none' }} />
        <div style={{ maxWidth:'860px', margin:'0 auto', position:'relative' }}>
          <Fade>
            <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--bem-red)', marginBottom:'20px' }}>
              Mon espace
            </p>
          </Fade>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
              <Fade delay={30}>
                <div style={{ width:'68px', height:'68px', borderRadius:'50%', background:'var(--bem-red)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:800, flexShrink:0, boxShadow:'0 0 0 3px rgba(204,31,39,.3)' }}>
                  {initials(user.firstName,user.lastName)}
                </div>
              </Fade>
              <div>
                <Fade delay={60}>
                  <h1 style={{ fontFamily:'var(--font-playfair),serif', fontSize:'clamp(1.4rem,3vw,2rem)', fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                    {user.firstName} {user.lastName}
                  </h1>
                </Fade>
                <Fade delay={90}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'7px', flexWrap:'wrap' }}>
                    <span style={{ color:'rgba(255,255,255,.45)', fontSize:'12px' }}>{user.email}</span>
                    <span style={{ padding:'3px 10px', borderRadius:'99px', background:'rgba(204,31,39,.22)', color:'var(--bem-red)', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>
                      {ROLE_LABEL[user.role]??user.role}
                    </span>
                  </div>
                </Fade>
              </div>
            </div>
            <Fade delay={110}>
              <button onClick={async()=>{setLoggingOut(true);await logout();}} disabled={loggingOut}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'99px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.14)', color:'rgba(255,255,255,.6)', fontSize:'12px', fontWeight:600, cursor:loggingOut?'wait':'pointer', transition:'all .18s' }}
                onMouseEnter={(e)=>{(e.currentTarget as HTMLElement).style.background='rgba(204,31,39,.2)';(e.currentTarget as HTMLElement).style.color='#fff';}}
                onMouseLeave={(e)=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.07)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,.6)';}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {loggingOut?'Déconnexion…':'Se déconnecter'}
              </button>
            </Fade>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'32px clamp(20px, 4vw, 48px) 60px' }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:'14px', marginBottom:'32px' }}>
          {[
            { label:'Commandes',      val:orderCount!==null?String(orderCount):'—' },
            { label:'Articles achetés', val:totalItems!==null?String(totalItems):'—' },
            { label:'Points fidélité',  val:'—' },
          ].map((s,i)=>(
            <Fade key={s.label} delay={130+i*30}>
              <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid var(--bem-gray-100)', padding:'18px 20px' }}>
                <p style={{ fontSize:'28px', fontWeight:900, lineHeight:1 }}>{s.val}</p>
                <p style={{ fontSize:'11px', color:'var(--bem-gray-400)', marginTop:'5px' }}>{s.label}</p>
              </div>
            </Fade>
          ))}
        </div>

        {/* Nav cards */}
        <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--bem-gray-400)', marginBottom:'14px' }}>
          Accès rapide
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {NAV_CARDS.map((item,i)=>(
            <Fade key={item.label} delay={230+i*35}>
              <button onClick={item.enabled?item.action:undefined}
                disabled={!item.enabled}
                style={{
                  width:'100%', textAlign:'left', background:'#fff', borderRadius:'14px',
                  border:'1px solid var(--bem-gray-100)', padding:'18px 22px',
                  display:'flex', alignItems:'center', gap:'16px',
                  cursor: item.enabled?'pointer':'default',
                  opacity: item.enabled?1:.45,
                  transition:'all .18s',
                }}
                onMouseEnter={(e)=>{ if (!item.enabled) return; const el=e.currentTarget as HTMLElement; el.style.borderColor=item.accent; el.style.boxShadow='0 4px 20px rgba(0,0,0,.08)'; el.style.transform='translateY(-2px)'; }}
                onMouseLeave={(e)=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--bem-gray-100)'; el.style.boxShadow='none'; el.style.transform='none'; }}
              >
                <div style={{ width:'46px', height:'46px', borderRadius:'12px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:`${item.accent}18`, color:item.accent }}>
                  {item.icon}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:700, fontSize:'13px' }}>{item.label}</p>
                  <p style={{ fontSize:'11px', color:'var(--bem-gray-400)', marginTop:'3px' }}>{item.sub}</p>
                </div>
                {item.enabled && (
                  <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'var(--bem-gray-50)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bem-gray-400)" strokeWidth="2.2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                )}
              </button>
            </Fade>
          ))}
        </div>

        {/* Promo */}
        <Fade delay={340}>
          <div style={{ marginTop:'32px', padding:'28px 32px', background:'var(--bem-black)', borderRadius:'18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:'-30px', top:'-30px', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(204,31,39,.12)', pointerEvents:'none' }} />
            <div>
              <p style={{ color:'#fff', fontWeight:700, fontSize:'14px' }}>Découvrez nos nouveautés</p>
              <p style={{ color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px' }}>Hoodies, t-shirts et accessoires BEM Dakar</p>
            </div>
            <Link href="/catalogue" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'11px 22px', borderRadius:'99px', background:'var(--bem-red)', color:'#fff', fontWeight:700, fontSize:'12px', textDecoration:'none', flexShrink:0, boxShadow:'0 4px 16px rgba(204,31,39,.4)', transition:'opacity .15s' }}>
              Voir le catalogue →
            </Link>
          </div>
        </Fade>
      </div>
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────── */
function Skeleton() {
  return (
    <div>
      <div style={{ background:'var(--bem-black)', height:'172px' }} />
      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'32px clamp(20px, 4vw, 48px)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
          {[1,2,3].map((i)=><div key={i} style={{ height:76, borderRadius:14, background:'var(--bem-gray-100)', animation:'shimmer 1.4s ease infinite', animationDelay:`${i*.1}s` }} />)}
        </div>
        {[1,2,3].map((i)=><div key={i} style={{ height:72, borderRadius:14, background:'var(--bem-gray-100)', marginBottom:10, animation:'shimmer 1.4s ease infinite', animationDelay:`${i*.1}s` }} />)}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function ComptePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === 'ADMIN') {
      router.replace('/admin/analytics');
      return;
    }
    const redirect = sessionStorage.getItem('redirect_after_login');
    if (redirect) {
      sessionStorage.removeItem('redirect_after_login');
      router.replace(redirect);
    }
  }, [user, loading, router]);

  if (loading) return <Skeleton />;
  if (user?.role === 'ADMIN') return null;
  return user ? <Dashboard /> : <AuthPage />;
}
