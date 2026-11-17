import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'KOALA – system konkursowy',
  description:
    'System obsługi konkursu KOALA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>
        <div className="app-content">{children}</div>
        <footer className="site-footer">
          <span>KOALA – WMI UAM Poznań</span>
          {' · '}
          <Link href="/rodo">Klauzula RODO</Link>
        </footer>
      </body>
    </html>
  );
}