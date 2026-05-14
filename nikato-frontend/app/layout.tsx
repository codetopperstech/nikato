import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import Header from '@/components/ui/Header';

export const metadata: Metadata = {
  title: 'NIKATO - Your neighbourhood, delivered',
  description: 'Fresh groceries and essentials delivered fast',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        <Providers><Header /><main>{children}</main></Providers>
      </body>
    </html>
  );
}
