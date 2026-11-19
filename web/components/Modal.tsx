'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/** Fenêtre ouverte par l'URL (ex. ?fiche=…) ; la fermeture revient à l'adresse « retour ». */
export function Modal({ titre, retour, large, children, pied }: { titre: string; retour: string; large?: boolean; children: React.ReactNode; pied?: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const fermer = () => router.push(retour, { scroll: false });
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') fermer(); };
    document.addEventListener('keydown', k);
    const f = ref.current?.querySelector<HTMLElement>('.content input:not([disabled]),.content select:not([disabled]),.content textarea:not([disabled])') ?? ref.current?.querySelector<HTMLElement>('.x');
    f?.focus();
    return () => document.removeEventListener('keydown', k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retour]);
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) fermer(); }}>
      <div ref={ref} className={'modal' + (large ? ' wide' : '')} role="dialog" aria-modal="true" aria-labelledby="mt">
        <header><h3 id="mt">{titre}</h3><button className="x" type="button" aria-label="Fermer" onClick={fermer}>×</button></header>
        <div className="content">{children}</div>
        {pied && <footer>{pied}</footer>}
      </div>
    </div>
  );
}
