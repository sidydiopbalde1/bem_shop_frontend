import type { Metadata, Viewport } from 'next';
import { DM_Sans, Playfair_Display, Poppins, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import { CartProvider } from '@/lib/CartContext';
import { AuthProvider } from '@/lib/AuthContext';
import { FontProvider } from '@/lib/FontProvider';
import SessionExpiredBanner from '@/components/layout/SessionExpiredBanner';
import WhatsAppButton from '@/components/layout/WhatsAppButton';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-playfair',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://boutique.bem.sn'),
  title: {
    template: '%s — BEM Dakar',
    default: 'BEM Shop',
  },
  description:
    'Boutique officielle BEM Dakar. Découvrez notre sélection de goodies, accessoires et produits BEM. Livraison rapide au Sénégal.',
  keywords: [
    'BEM Dakar', 'BEM Shop', 'boutique BEM', 'accessoires BEM',
    'vêtements BEM', 'école de management Dakar', 'Sénégal', 'BEM shop',
  ],
  openGraph: {
    siteName: 'BEM Shop',
    locale: 'fr_SN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bemdkr',
  },
   verification: {
    google: 'XRH8gwfKvL1UICnfWlPO2GYuReXHmjfXEdj5XuuYEyc',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${playfair.variable} ${poppins.variable} ${plusJakarta.variable}`}
    >
      <body className="font-sans" style={{ position: 'relative' }}>
        <FontProvider />
        <AnimatedBackground />
        <AuthProvider>
        <SessionExpiredBanner />
        <CartProvider>
          <AnnouncementBar />
          <Navbar />
          <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>
          <Footer />
        </CartProvider>
        <WhatsAppButton />
        </AuthProvider>
      </body>
    </html>
  );
}
