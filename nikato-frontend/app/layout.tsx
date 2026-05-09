// ============================================================
// NIKATO — app/layout.tsx
// Root layout: providers, toast container, global styles
// ============================================================

import type { Metadata, Viewport } from 'next';
import { Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ToastContainer } from '@/components/ui';
import { CartDrawer } from '@/components/cart/CartDrawer';
import CrossShopModal from '@/components/cart/CrossShopModal';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '600'],
});

export const metadata: Metadata = {
  title: {
    default: 'NIKATO — Hyperlocal Delivery',
    template: '%s | NIKATO',
  },
  description: 'Get anything delivered from nearby shops in minutes.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'NIKATO',
    description: 'Hyperlocal delivery in your neighbourhood',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FF6B35',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${mono.variable}`}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        <Providers>
          {children}
          <CartDrawer />
          <CrossShopModal />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
