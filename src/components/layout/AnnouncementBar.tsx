'use client';

const ITEMS = [
  '🚚 Livraison express à Dakar',
  '🎓 Collection officielle BEM 2026',
  '💳 Paiement Mobile Money accepté',
  // '↩️ Retour sous 7 jours',
  '🔥 Stock limité — commandez vite',
];

export default function AnnouncementBar() {
  const repeated = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="w-full bg-[var(--bem-red)] text-white overflow-hidden" style={{ height: '36px' }}>
      <div className="marquee-track h-full items-center flex">
        {repeated.map((item, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-[11px] font-semibold tracking-widest uppercase"
            style={{ padding: '0 2.5rem' }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
