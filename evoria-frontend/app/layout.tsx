import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '../components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'EVORIA — Discover. Book. Experience.',
  description: 'Event ticketing platform for attendees, organizers, and admins.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
