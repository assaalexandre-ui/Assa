'use client';
import { useEffect, useState } from 'react';

const CHOIX = [['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']] as const;
type Theme = (typeof CHOIX)[number][0];

/** Clair, sombre ou automatique (suit l'appareil). Le choix est gardé sur l'appareil. */
export function ChoixTheme() {
  const [theme, setTheme] = useState<Theme>('auto');
  useEffect(() => { const t = document.documentElement.dataset.theme; if (t === 'light' || t === 'dark') setTheme(t); }, []);
  const choisir = (t: Theme) => {
    setTheme(t);
    if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    try { if (t === 'auto') localStorage.removeItem('theme'); else localStorage.setItem('theme', t); } catch {}
  };
  return (
    <div className="theme" role="group" aria-label="Apparence">
      {CHOIX.map(([v, l]) => <button key={v} type="button" aria-pressed={theme === v} onClick={() => choisir(v)}>{l}</button>)}
    </div>
  );
}
