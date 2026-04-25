import type { Metadata } from 'next';
import { Inter, Poppins, IBM_Plex_Serif, JetBrains_Mono } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const plexSerif = IBM_Plex_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SWRMS - Brihanmumbai Municipal Corporation',
    template: '%s | SWRMS BMC',
  },
  description:
    'Smart Workforce & Route Management System - Solid Waste Management, BMC Chembur Ward. Geo-fenced attendance, AI-verified field photos, real-time route tracking.',
  keywords: ['BMC', 'Brihanmumbai Municipal Corporation', 'Solid Waste Management', 'SWRMS', 'Mumbai', 'Chembur'],
  authors: [{ name: 'V.E.S.I.T Department of Information Technology' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${plexSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[var(--page-bg)]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
