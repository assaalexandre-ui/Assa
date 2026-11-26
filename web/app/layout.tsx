import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EMCV Gestion',
  description: "Gestion de l'église EMCV — version de test",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" />
        {/* Applique le thème choisi avant l'affichage, pour éviter un éclair clair. */}
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
