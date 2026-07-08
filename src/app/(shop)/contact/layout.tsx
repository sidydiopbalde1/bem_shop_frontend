import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez l\'équipe BEM Shop. Une question sur votre commande, une livraison, un retour ? Réponse sous 24–48 h ouvrées.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact — BEM Dakar',
    description:
      'Contactez l\'équipe BEM Shop. Réponse sous 24–48 h ouvrées.',
    url: '/contact',
  },
  twitter: {
    card: 'summary',
    title: 'Contact — BEM Dakar',
    description: 'Contactez l\'équipe BEM Shop.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
