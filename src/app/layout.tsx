import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SWRMS — Smart Workforce & Route Management',
  description:
    'BMC Chembur Ward — Waste Collection Staff Attendance & Route Management System',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-[var(--neutral-50)]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
