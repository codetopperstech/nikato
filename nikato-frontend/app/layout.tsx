import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Header from '@/components/ui/Header';

const inter = Inter({ subsets: ['latin'] });
export const metadata: Metadata = { title: 'NIKATO - Your neighbourhood, delivered', description: 'Fresh groceries and essentials delivered fast' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers><Header /><main>{children}</main></Providers>
      </body>
    </html>
  );
}
