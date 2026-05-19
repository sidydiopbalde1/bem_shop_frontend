import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'À propos — BEM Dakar Goodies' };

const STATS = [
  { value: '2+', label: 'Années d\'existence', sub: 'depuis 2023' },
  { value: '500+', label: 'Étudiants actifs', sub: 'campus de Dakar' },
  { value: '1 500+', label: 'Pièces vendues', sub: 'toutes collections' },
  { value: '100%', label: 'Made with pride', sub: 'by BEM community' },
];

const VALUES = [
  {
    title: 'Identité & fierté',
    desc: "Porter du BEM, c'est afficher son appartenance à une école d'excellence et à une communauté soudée. Chaque pièce est un symbole fort.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    title: 'Qualité sans compromis',
    desc: 'Nos produits sont sélectionnés et conçus avec soin — des matières durables, des finitions soignées, pour un quotidien à la hauteur de vos ambitions.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    title: 'Communauté d\'abord',
    desc: 'Étudiants, alumni, parents, équipe pédagogique — la boutique BEM appartient à toute la famille. Les bénéfices soutiennent les activités associatives.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'Innovation & style',
    desc: "À chaque collection, nous explorons de nouvelles formes, couleurs et collaborations pour que vos tenues reflètent l'esprit BEM : moderne, audacieux, élégant.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
];

const TIMELINE = [
  {
    year: '2023',
    title: 'Les débuts',
    desc: 'Un groupe d\'étudiants passionnés lance l\'idée d\'une boutique officielle BEM. Les premiers hoodies sont commandés en édition limitée et s\'écoulent en 48 heures.',
  },
  {
    year: '2024',
    title: 'La boutique prend vie',
    desc: 'Lancement du site e-commerce BEM Dakar Goodies. Plus de 200 pièces vendues dès la première semaine. La communauté répond présent.',
  },
  {
    year: '2025',
    title: 'Expansion de la gamme',
    desc: 'Nouvelles catégories — accessoires, papeterie, éditions alumni. Partenariats avec des artisans locaux pour une touche authentiquement sénégalaise.',
  },
  {
    year: '2026',
    title: 'Aujourd\'hui',
    desc: 'Plus de 1 500 pièces vendues, une communauté de 500+ membres actifs, et une nouvelle collection printemps qui s\'annonce comme la plus ambitieuse à ce jour.',
  },
];

export default function AProposPage() {
  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bem-black) 0%, #1a0a0b 60%, #2d0608 100%)',
        padding: '100px 48px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(204,31,39,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(204,31,39,0.05)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative' }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 16,
          }}>
            Notre histoire
          </p>
          <h1 style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800, color: '#fff', lineHeight: 1.1,
            marginBottom: 24,
          }}>
            Plus qu'une boutique,<br />
            <span style={{ color: 'var(--bem-red)' }}>une fierté partagée</span>
          </h1>
          <p style={{
            fontSize: 16, color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.7, maxWidth: 560,
          }}>
            BEM Dakar Goodies est né de la volonté simple et sincère de porter haut les couleurs
            de notre école. Ce que vous achetez ici, c'est bien plus qu'un vêtement —
            c'est un morceau de notre communauté.
          </p>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bem-gray-50)', borderBottom: '1px solid var(--bem-gray-100)' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 32, textAlign: 'center',
        }}>
          {STATS.map((s) => (
            <div key={s.label}>
              <p style={{
                fontFamily: 'var(--font-playfair), serif',
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                fontWeight: 800, color: 'var(--bem-red)', lineHeight: 1,
                marginBottom: 8,
              }}>
                {s.value}
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--bem-black)', marginBottom: 3 }}>
                {s.label}
              </p>
              <p style={{ fontSize: 11, color: 'var(--bem-gray-400)' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mission ──────────────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 48px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64, alignItems: 'center',
        }}
          className="max-md:grid-cols-1"
        >
          {/* Text */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 12 }}>
              Notre mission
            </p>
            <h2 style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 800, color: 'var(--bem-black)',
              lineHeight: 1.2, marginBottom: 20,
            }}>
              Donner une voix visuelle à la communauté BEM
            </h2>
            <p style={{ fontSize: 14, color: 'var(--bem-gray-700)', lineHeight: 1.75, marginBottom: 16 }}>
              BEM — Business, Économie & Management — est bien plus qu'une école de gestion.
              C'est un réseau, une famille, une culture. Notre boutique est le reflet tangible
              de cet esprit collectif.
            </p>
            <p style={{ fontSize: 14, color: 'var(--bem-gray-700)', lineHeight: 1.75, marginBottom: 28 }}>
              Chaque vente contribue directement au financement des activités associatives,
              des événements campus et des initiatives étudiantes. Acheter BEM, c'est investir
              dans votre propre communauté.
            </p>
            <Link href="/catalogue" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--bem-black)', color: '#fff',
              padding: '12px 28px', borderRadius: 99,
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              letterSpacing: '0.06em',
            }}>
              Découvrir la boutique →
            </Link>
          </div>

          {/* Visual card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--bem-black) 0%, #1a1a1a 100%)',
            borderRadius: 24, padding: '48px 40px',
            display: 'flex', flexDirection: 'column', gap: 20,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(204,31,39,0.15)', pointerEvents: 'none' }} />
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--bem-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <p style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3,
            }}>
              "Représenter BEM,<br />c'est représenter<br />l'excellence africaine."
            </p>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              Le bureau associatif étudiant — moteur de la vie du campus BEM Dakar depuis 2021.
            </p>
          </div>
        </div>
      </div>

      {/* ── Values ───────────────────────────────────────────── */}
      <div style={{ background: 'var(--bem-gray-50)', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 10 }}>
              Ce qui nous guide
            </p>
            <h2 style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 800, color: 'var(--bem-black)',
            }}>
              Nos valeurs
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {VALUES.map((v, i) => (
              <div key={v.title} style={{
                background: '#fff', borderRadius: 20,
                border: '1px solid var(--bem-gray-100)',
                padding: '28px 24px',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: i === 0 ? 'rgba(204,31,39,0.1)' : 'var(--bem-gray-50)',
                  color: i === 0 ? 'var(--bem-red)' : 'var(--bem-gray-700)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18,
                }}>
                  {v.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--bem-black)', marginBottom: 10 }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--bem-gray-700)', lineHeight: 1.65 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────────── */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: 10 }}>
            Notre parcours
          </p>
          <h2 style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            fontWeight: 800, color: 'var(--bem-black)',
          }}>
            Une aventure qui continue
          </h2>
        </div>

        <div style={{ position: 'relative', paddingLeft: 32 }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: 7, top: 6, bottom: 6,
            width: 2, background: 'var(--bem-gray-100)',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {TIMELINE.map((item, i) => (
              <div key={item.year} style={{ position: 'relative' }}>
                {/* Dot */}
                <div style={{
                  position: 'absolute', left: -32, top: 4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: i === TIMELINE.length - 1 ? 'var(--bem-red)' : '#fff',
                  border: `2px solid ${i === TIMELINE.length - 1 ? 'var(--bem-red)' : 'var(--bem-gray-100)'}`,
                  boxShadow: i === TIMELINE.length - 1 ? '0 0 0 4px rgba(204,31,39,0.15)' : 'none',
                }} />

                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                    padding: '4px 12px', borderRadius: 99,
                    background: i === TIMELINE.length - 1 ? 'rgba(204,31,39,0.1)' : 'var(--bem-gray-50)',
                    color: i === TIMELINE.length - 1 ? 'var(--bem-red)' : 'var(--bem-gray-400)',
                    flexShrink: 0,
                  }}>
                    {item.year}
                  </span>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--bem-black)', marginBottom: 6 }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--bem-gray-700)', lineHeight: 1.7 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <div style={{ padding: '0 48px 80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(120deg, var(--bem-black) 0%, #1a1a2e 100%)',
          borderRadius: 20, padding: '56px 48px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 32, flexWrap: 'wrap',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(204,31,39,0.12)', pointerEvents: 'none' }} />
          <div>
            <h2 style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
              fontWeight: 800, color: '#fff', marginBottom: 10,
            }}>
              Vous avez des questions ?
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 400, lineHeight: 1.6 }}>
              Notre équipe est là pour vous aider. N'hésitez pas à nous contacter.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
            <Link href="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--bem-red)', color: '#fff',
              padding: '12px 28px', borderRadius: 99,
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>
              Nous contacter
            </Link>
            <Link href="/catalogue" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              padding: '12px 28px', borderRadius: 99,
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              Voir la boutique
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
