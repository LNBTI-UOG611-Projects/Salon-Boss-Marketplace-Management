
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  Noto_Sans_Sinhala,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from 'next/font/google';
import { I18nProvider } from '@/i18n/provider';
import { getLocale } from '@/i18n/server';
import './globals.css';

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const heading = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const sinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sinhala',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BOSSONE.LK | Sign in',
  description: 'BOSSONE.LK authentication',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${body.variable} ${heading.variable} ${sinhala.variable}`}
    >
      <body className="min-h-screen">
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
