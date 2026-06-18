'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { tokenStorage } from '@/lib/auth';
import { apiFetch } from '@/lib/apiFetch';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

/* ── types ──────────────────────────────────────────────── */
type Summary = { totalOrders:number; totalRevenue:number; totalUsers:number; pendingProducts:number };
type RawSaleRow = { createdAt:string; _count:Record<string,number>|number; _sum:{totalAmount:number|null}|null };
type SaleEntry = { date:string; orders:number; revenue:number };
type RawTopProduct = { productId:string; _sum:{quantity:number|null}|null };
type TopProduct = { productId:string; quantity:number; name:string };

/* ── utils ──────────────────────────────────────────────── */
const fmt = (n:number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const fmtRev = (n:number) => {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M XOF`;
  if (n >= 1_000)     return `${(n/1_000).toFixed(0)}K XOF`;
  return `${fmt(n)} XOF`;
};
const fmtDate = (iso:string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' });

function normalizeSales(raw:RawSaleRow[]): SaleEntry[] {
  const map = new Map<string,{orders:number;revenue:number}>();
  for (const row of raw) {
    const date = row.createdAt.slice(0,10);
    let orders = 0;
    if (typeof row._count === 'number') orders = row._count;
    else if (row._count) orders = (row._count as Record<string,number>).id ?? (row._count as Record<string,number>)._all ?? 0;
    const revenue = row._sum?.totalAmount ?? 0;
    const prev = map.get(date) ?? { orders:0, revenue:0 };
    map.set(date, { orders: prev.orders+orders, revenue: prev.revenue+revenue });
  }
  return Array.from(map.entries()).map(([date,v])=>({date,...v})).sort((a,b)=>a.date.localeCompare(b.date));
}

/* ── Fade wrapper ───────────────────────────────────────── */
const Fade = ({ children, delay=0 }:{ children:React.ReactNode; delay?:number }) => (
  <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
    transition={{ duration:0.35, delay:delay/1000, ease:[0.22,1,0.36,1] }}>
    {children}
  </motion.div>
);

/* ── KPI card ───────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon, color, loading, accent=false }:{
  label:string; value:string; sub:string;
  icon:React.ReactNode; color:string; loading:boolean; accent?:boolean;
}) {
  return (
    <div style={{
      background:'#fff', borderRadius:'16px', padding:'20px 22px',
      border: accent ? `1px solid ${color}30` : '1px solid var(--bem-gray-100)',
      display:'flex', alignItems:'flex-start', gap:'14px',
      transition:'all .2s',
    }}
      onMouseEnter={(e)=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 6px 24px rgba(0,0,0,.08)'; el.style.transform='translateY(-2px)'; }}
      onMouseLeave={(e)=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='none'; el.style.transform='none'; }}
    >
      <div style={{ width:'42px', height:'42px', borderRadius:'11px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:`${color}18`, color }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--bem-gray-400)', marginBottom:'5px' }}>
          {label}
        </p>
        {loading ? (
          <div style={{ height:'26px', width:'80px', borderRadius:'6px', background:'var(--bem-gray-100)', animation:'shimmer 1.4s ease infinite' }} />
        ) : (
          <p style={{ fontSize:'24px', fontWeight:900, lineHeight:1, color: accent ? color : 'var(--bem-black)' }}>{value}</p>
        )}
        {!loading && <p style={{ fontSize:'11px', color:'var(--bem-gray-400)', marginTop:'4px' }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ── Toggle group ───────────────────────────────────────── */
function ToggleGroup<T extends string>({ options, value, onChange, dark=false }:{
  options:{value:T;label:string}[]; value:T; onChange:(v:T)=>void; dark?:boolean;
}) {
  return (
    <div style={{ display:'flex', gap:'3px', padding:'3px', background:'var(--bem-gray-50)', borderRadius:'8px' }}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          height:'30px', padding:'0 12px', borderRadius:'6px', border:'none',
          fontSize:'11px', fontWeight:600, cursor:'pointer', transition:'all .15s',
          background: value===o.value ? (dark ? 'var(--bem-black)' : '#fff') : 'transparent',
          color: value===o.value ? (dark ? '#fff' : 'var(--bem-black)') : 'var(--bem-gray-400)',
          boxShadow: value===o.value && !dark ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Bar chart ──────────────────────────────────────────── */
function BarChart({ data, metric }:{ data:SaleEntry[]; metric:'revenue'|'orders' }) {
  const [hovered, setHovered] = useState<number|null>(null);
  if (!data.length) return (
    <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--bem-gray-400)', fontSize:'13px' }}>
      Aucune donnée sur cette période.
    </div>
  );
  const visible = data.slice(-30);
  const values  = visible.map((d) => metric==='revenue' ? d.revenue : d.orders);
  const maxVal  = Math.max(...values, 1);
  const step    = Math.max(1, Math.floor(visible.length/6));

  return (
    <div>
      <div style={{ display:'flex', gap:'8px' }}>
        {/* Y axis */}
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-between', height:'160px', paddingBottom:'2px' }}>
          {[1,.75,.5,.25,0].map((r)=>(
            <span key={r} style={{ fontSize:'9px', color:'var(--bem-gray-400)', lineHeight:1 }}>
              {metric==='revenue' ? fmtRev(maxVal*r) : fmt(Math.round(maxVal*r))}
            </span>
          ))}
        </div>
        {/* Bars */}
        <div style={{ flex:1, position:'relative' }}>
          {/* Grid */}
          {[0,.25,.5,.75,1].map((r)=>(
            <div key={r} style={{ position:'absolute', left:0, right:0, top:`${(1-r)*100}%`, height:'1px', background:r===0?'var(--bem-gray-100)':'rgba(0,0,0,.04)' }} />
          ))}
          <div style={{ display:'flex', alignItems:'flex-end', gap:'3px', height:'160px', paddingBottom:'1px' }}>
            {visible.map((entry,i)=>{
              const val    = values[i];
              const pct    = maxVal>0 ? (val/maxVal)*100 : 0;
              const isHov  = hovered===i;
              return (
                <div key={entry.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%', cursor:'pointer', position:'relative' }}
                  onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}>
                  {isHov && (
                    <div style={{ position:'absolute', bottom:`calc(${pct}% + 8px)`, left:'50%', transform:'translateX(-50%)', background:'var(--bem-black)', color:'#fff', fontSize:'11px', fontWeight:600, padding:'6px 10px', borderRadius:'8px', whiteSpace:'nowrap', zIndex:10, boxShadow:'0 4px 16px rgba(0,0,0,.2)', pointerEvents:'none' }}>
                      <p style={{ color:'rgba(255,255,255,.5)', fontSize:'9px', marginBottom:'2px' }}>{fmtDate(entry.date)}</p>
                      <p>{metric==='revenue' ? `${fmt(entry.revenue)} XOF` : `${entry.orders} commande${entry.orders>1?'s':''}`}</p>
                    </div>
                  )}
                  <motion.div
                    initial={{ height:0 }} animate={{ height:`${pct}%` }}
                    transition={{ duration:.5, delay:i*.01, ease:[0.22,1,0.36,1] }}
                    style={{
                      width:'100%', borderRadius:'4px 4px 0 0', minHeight:val>0?3:0,
                      background: isHov ? 'var(--bem-red)' : 'rgba(204,31,39,.5)',
                      transition:'background .15s',
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:'3px', marginTop:'6px' }}>
            {visible.map((entry,i)=>(
              <div key={entry.date} style={{ flex:1, textAlign:'center' }}>
                {(i===0||i===visible.length-1||i%step===0) && (
                  <span style={{ fontSize:'9px', color:'var(--bem-gray-400)', whiteSpace:'nowrap' }}>{fmtDate(entry.date)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Top products ───────────────────────────────────────── */
function TopProducts({ products, loading }:{ products:TopProduct[]; loading:boolean }) {
  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      {[1,2,3,4,5].map((i)=>(
        <div key={i} style={{ height:'46px', borderRadius:'10px', background:'var(--bem-gray-100)', animation:'shimmer 1.4s ease infinite', animationDelay:`${i*.1}s` }} />
      ))}
    </div>
  );
  if (!products.length) return <p style={{ color:'var(--bem-gray-400)', fontSize:'13px', textAlign:'center', padding:'2rem 0' }}>Aucun produit vendu.</p>;
  const maxQ = Math.max(...products.map((p)=>p.quantity),1);
  const colors = ['var(--bem-red)','rgba(204,31,39,.7)','rgba(204,31,39,.5)','var(--bem-gray-400)','var(--bem-gray-400)'];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
      {products.map((p,i)=>(
        <div key={p.productId} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:i<products.length-1?'1px solid var(--bem-gray-100)':'none' }}>
          <span style={{ width:'22px', height:'22px', borderRadius:'50%', flexShrink:0, background:i<3?'var(--bem-red)':'var(--bem-gray-100)', color:i<3?'#fff':'var(--bem-gray-400)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:800 }}>
            {i+1}
          </span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
              <span style={{ fontSize:'12px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'200px' }}>{p.name}</span>
              <span style={{ fontSize:'11px', fontWeight:700, color:colors[i]??'var(--bem-gray-400)', flexShrink:0, marginLeft:'8px' }}>{fmt(p.quantity)} u.</span>
            </div>
            <div style={{ height:'5px', borderRadius:'99px', background:'var(--bem-gray-100)', overflow:'hidden' }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${(p.quantity/maxQ)*100}%` }}
                transition={{ duration:.7, delay:i*.08, ease:[0.22,1,0.36,1] }}
                style={{ height:'100%', borderRadius:'99px', background:colors[i]??'var(--bem-gray-400)' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Btn ────────────────────────────────────────────────── */
function Btn({ onClick, disabled, primary=false, loading=false, children }:{
  onClick:()=>void; disabled?:boolean; primary?:boolean; loading?:boolean; children:React.ReactNode;
}) {
  return (
    <motion.button whileTap={{ scale:.97 }} onClick={onClick} disabled={disabled}
      style={{
        display:'flex', alignItems:'center', gap:'7px', height:'38px', padding:'0 16px',
        borderRadius:'9px', fontSize:'12px', fontWeight:600, cursor:disabled?'wait':'pointer',
        border: primary ? 'none' : '1.5px solid var(--bem-gray-100)',
        background: primary ? (disabled?'var(--bem-gray-400)':'var(--bem-black)') : '#fff',
        color: primary ? '#fff' : 'var(--bem-gray-700)',
        boxShadow: primary&&!disabled ? '0 2px 10px rgba(13,13,13,.18)' : 'none',
        transition:'all .15s',
      }}>
      {loading && (
        <span style={{ width:'13px', height:'13px', borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', display:'inline-block', animation:'spin .7s linear infinite' }} />
      )}
      {children}
    </motion.button>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [summary, setSummary]         = useState<Summary|null>(null);
  const [sales, setSales]             = useState<SaleEntry[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loadSum,  setLoadSum]        = useState(true);
  const [loadSale, setLoadSale]       = useState(true);
  const [loadTop,  setLoadTop]        = useState(true);
  const [days, setDays]               = useState(30);
  const [metric, setMetric]           = useState<'revenue'|'orders'>('revenue');
  const [error, setError]             = useState<string|null>(null);
  const [exporting, setExporting]     = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());


  const fetchSummary = useCallback(async () => {
    setLoadSum(true);
    try {
      const r = await apiFetch(`${API}/analytics/summary`);
      if (!r.ok) throw new Error();
      setSummary(await r.json());
    } catch { setError('Impossible de charger le résumé.'); }
    finally { setLoadSum(false); }
  }, []);

  const fetchSales = useCallback(async (d:number) => {
    setLoadSale(true);
    try {
      const r = await apiFetch(`${API}/analytics/sales?days=${d}`);
      if (!r.ok) throw new Error();
      setSales(normalizeSales(await r.json()));
    } catch { setSales([]); }
    finally { setLoadSale(false); }
  }, []);

  const fetchTop = useCallback(async () => {
    setLoadTop(true);
    try {
      const r = await apiFetch(`${API}/analytics/top-products?limit=10`);
      if (!r.ok) throw new Error();
      const raw:RawTopProduct[] = await r.json();
      const enriched = await Promise.all(raw.map(async (item) => {
        const quantity = item._sum?.quantity ?? 0;
        try {
          const pr = await apiFetch(`${API}/products/${item.productId}`);
          const p = pr.ok ? await pr.json() : null;
          return { productId:item.productId, quantity, name:p?.name ?? `Produit ${item.productId.slice(0,8)}…` };
        } catch { return { productId:item.productId, quantity, name:`Produit ${item.productId.slice(0,8)}…` }; }
      }));
      setTopProducts(enriched.filter((p)=>p.quantity>0));
    } catch { setTopProducts([]); }
    finally { setLoadTop(false); }
  }, []);

  useEffect(() => { fetchSummary(); fetchSales(days); fetchTop(); }, []);
  useEffect(() => { fetchSales(days); }, [days]);

  function handleRefresh() {
    setError(null); setLastRefresh(new Date());
    fetchSummary(); fetchSales(days); fetchTop();
  }

  async function handleExport() {
    setExporting(true);
    try {
      const token = tokenStorage.getAccess();
      const r = await fetch(`${API}/analytics/export/orders`, { headers: token?{Authorization:`Bearer ${token}`}:{} });
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `commandes-bem-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert("Erreur lors de l'export."); }
    finally { setExporting(false); }
  }

  const periodRevenue = sales.reduce((s,d)=>s+d.revenue,0);
  const periodOrders  = sales.reduce((s,d)=>s+d.orders,0);
  const avgOrder      = periodOrders>0 ? Math.round(periodRevenue/periodOrders) : 0;

  const KPIS = [
    { label:'Commandes', value:summary?fmt(summary.totalOrders):'—', sub:'Total toutes périodes', color:'#2563eb', accent:false,
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
    { label:"Chiffre d'affaires", value:summary?fmtRev(summary.totalRevenue):'—', sub:'Paiements validés', color:'#16a34a', accent:false,
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/></svg> },
    { label:'Utilisateurs', value:summary?fmt(summary.totalUsers):'—', sub:'Comptes enregistrés', color:'#7c3aed', accent:false,
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label:'Produits en attente', value:summary?fmt(summary.pendingProducts):'—', sub:'Approbation requise', color:'var(--bem-red)', accent: (summary?.pendingProducts ?? 0) > 0,
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
  ];

  return (
    <div style={{ padding:'32px 40px', background:'#F4F5F7', minHeight:'100vh' }}>

      {/* Header */}
      <Fade>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'32px', gap:'16px', flexWrap:'wrap' }}>
          <div>
            <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--bem-red)', marginBottom:'6px' }}>
              Tableau de bord
            </p>
            <h1 style={{ fontSize:'28px', fontWeight:900, color:'var(--bem-black)', lineHeight:1 }}>Analytics</h1>
            <p style={{ fontSize:'12px', color:'var(--bem-gray-400)', marginTop:'5px' }}>
              Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
            </p>
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            <Btn onClick={handleRefresh}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Actualiser
            </Btn>
            <Btn primary onClick={handleExport} loading={exporting} disabled={exporting}>
              {!exporting && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              {exporting ? 'Export…' : 'Exporter CSV'}
            </Btn>
          </div>
        </div>
      </Fade>

      {/* Error */}
      {error && (
        <Fade>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'13px 18px', borderRadius:'12px', marginBottom:'24px', background:'rgba(204,31,39,.07)', border:'1px solid rgba(204,31,39,.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bem-red)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize:'13px', color:'var(--bem-red)', flex:1 }}>{error}</p>
            <button onClick={()=>setError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--bem-red)', fontSize:'18px', lineHeight:1 }}>×</button>
          </div>
        </Fade>
      )}

      {/* KPI grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'14px', marginBottom:'20px' }}>
        {KPIS.map((kpi,i)=>(
          <Fade key={kpi.label} delay={i*50}>
            <KpiCard {...kpi} loading={loadSum} />
          </Fade>
        ))}
      </div>

      {/* Sales chart */}
      <Fade delay={240}>
        <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid var(--bem-gray-100)', padding:'24px 28px', marginBottom:'16px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
            <div>
              <p style={{ fontSize:'14px', fontWeight:800, color:'var(--bem-black)' }}>Évolution des ventes</p>
              {!loadSale && (
                <p style={{ fontSize:'11px', color:'var(--bem-gray-400)', marginTop:'3px' }}>
                  {metric==='revenue' ? `${fmtRev(periodRevenue)} sur ${days} jours` : `${fmt(periodOrders)} commande${periodOrders>1?'s':''} sur ${days} jours`}
                </p>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              <ToggleGroup
                options={[{value:'revenue',label:'CA'},{value:'orders',label:'Commandes'}]}
                value={metric} onChange={setMetric}
              />
              <ToggleGroup
                options={[{value:'7',label:'7j'},{value:'30',label:'30j'},{value:'90',label:'90j'}]}
                value={String(days)} onChange={(v)=>setDays(Number(v))} dark
              />
            </div>
          </div>
          {loadSale ? (
            <div style={{ height:'200px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'3px solid var(--bem-gray-100)', borderTopColor:'var(--bem-red)', animation:'spin .8s linear infinite' }} />
            </div>
          ) : (
            <BarChart data={sales} metric={metric} />
          )}
        </div>
      </Fade>

      {/* Bottom */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:'16px' }}>

        {/* Top products */}
        <Fade delay={340}>
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid var(--bem-gray-100)', padding:'24px 28px' }}>
            <p style={{ fontSize:'14px', fontWeight:800, color:'var(--bem-black)' }}>Top produits vendus</p>
            <p style={{ fontSize:'11px', color:'var(--bem-gray-400)', marginBottom:'20px', marginTop:'3px' }}>Par quantité commandée — toutes périodes</p>
            <TopProducts products={topProducts} loading={loadTop} />
          </div>
        </Fade>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

          {/* Period summary — dark */}
          <Fade delay={400}>
            <div style={{ background:'var(--bem-black)', borderRadius:'16px', padding:'22px 24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:'-40px', right:'-30px', width:'130px', height:'130px', borderRadius:'50%', background:'rgba(204,31,39,.14)', pointerEvents:'none' }} />
              <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--bem-red)', marginBottom:'14px' }}>
                Période — {days}j
              </p>
              <p style={{ fontSize:'10px', color:'rgba(255,255,255,.4)', marginBottom:'3px' }}>Chiffre d&apos;affaires</p>
              {loadSale ? (
                <div style={{ height:'24px', width:'100px', borderRadius:'6px', background:'rgba(255,255,255,.1)', animation:'shimmer 1.4s ease infinite' }} />
              ) : (
                <p style={{ fontSize:'22px', fontWeight:900, color:'#fff', lineHeight:1.2 }}>{fmtRev(periodRevenue)}</p>
              )}
              <div style={{ height:'1px', background:'rgba(255,255,255,.08)', margin:'14px 0' }} />
              <p style={{ fontSize:'10px', color:'rgba(255,255,255,.4)', marginBottom:'3px' }}>Commandes</p>
              {loadSale ? (
                <div style={{ height:'20px', width:'60px', borderRadius:'6px', background:'rgba(255,255,255,.1)', animation:'shimmer 1.4s ease infinite' }} />
              ) : (
                <p style={{ fontSize:'20px', fontWeight:900, color:'#fff', lineHeight:1.2 }}>{fmt(periodOrders)}</p>
              )}
            </div>
          </Fade>

          {/* Avg order */}
          <Fade delay={460}>
            <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid var(--bem-gray-100)', padding:'18px 20px' }}>
              <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--bem-gray-400)', marginBottom:'4px' }}>Panier moyen</p>
              {loadSale ? (
                <div style={{ height:'22px', width:'80px', borderRadius:'6px', background:'var(--bem-gray-100)', animation:'shimmer 1.4s ease infinite' }} />
              ) : (
                <p style={{ fontSize:'20px', fontWeight:900, color:'var(--bem-black)', lineHeight:1.2 }}>
                  {avgOrder > 0 ? fmtRev(avgOrder) : '—'}
                </p>
              )}
              <p style={{ fontSize:'11px', color:'var(--bem-gray-400)', marginTop:'4px' }}>CA ÷ commandes</p>
            </div>
          </Fade>

          {/* API endpoints */}
          <Fade delay={520}>
            <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid var(--bem-gray-100)', padding:'18px 20px' }}>
              <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--bem-gray-400)', marginBottom:'12px' }}>Endpoints API</p>
              {[
                ['GET','/analytics/summary'],
                ['GET',`/analytics/sales?days=${days}`],
                ['GET','/analytics/top-products'],
                ['GET','/analytics/export/orders'],
              ].map(([method,path])=>(
                <div key={path} style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'6px' }}>
                  <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', background:'rgba(37,99,235,.1)', color:'#2563eb', letterSpacing:'.06em', flexShrink:0 }}>
                    {method}
                  </span>
                  <code style={{ fontSize:'10px', color:'var(--bem-gray-700)', wordBreak:'break-all' }}>{path}</code>
                </div>
              ))}
            </div>
          </Fade>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>
    </div>
  );
}
