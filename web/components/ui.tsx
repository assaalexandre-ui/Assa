// Petits éléments d'interface repris de l'artefact (panneaux, indicateurs, pastilles, états vides).
import Link from 'next/link';

export const Pill = ({ children, c = 'n' }: { children: React.ReactNode; c?: 'g' | 'w' | 'b' | 'n' | 'a' }) => <span className={`pill ${c}`}>{children}</span>;

export function Kpis({ items }: { items: [string, React.ReactNode, string?][] }) {
  return (
    <div className="kpis">
      {items.map(([l, v, e]) => <div className="kpi" key={l}><span>{l}</span><strong>{v}</strong>{e && <em>{e}</em>}</div>)}
    </div>
  );
}

export function Empty({ titre, texte }: { titre: string; texte: string }) {
  return <div className="empty"><b>{titre}</b>{texte}</div>;
}

/** Couleurs de vitrail pour l'icône ronde des blocs. */
export type Ton = 'saphir' | 'rubis' | 'emeraude' | 'ambre' | 'amethyste' | 'ciel';

/** Icônes des blocs (tracés SVG 24×24, trait). */
export const ICONES = {
  barres: '<path d="M4 20V13M9.5 20V8M15 20v-5M20.5 20V5"/>',
  rosace: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/>',
  camembert: '<path d="M21 12a9 9 0 1 1-9-9v9z"/>',
  calendrier: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  taches: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  telephone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  annonce: '<path d="M4 5h16v11H8l-4 4z"/>',
  argent: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
  formation: '<path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5"/>',
  berger: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M17 4v16M17 4c2.2 0 3.5 1.2 3.5 3S19.2 10 17 10"/>',
} as const;

export function Panel({ titre, droite, children, icone, ton = 'saphir' }: { titre?: React.ReactNode; droite?: React.ReactNode; children: React.ReactNode; icone?: keyof typeof ICONES; ton?: Ton }) {
  return (
    <section className="panel">
      {titre && <header>{icone && <span className="pico" style={{ ['--j' as string]: `var(--${ton})` }}><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONES[icone] }} /></span>}<h2>{titre}</h2>{droite}</header>}
      {children}
    </section>
  );
}

/** Champ de recherche soumis par l'URL (?q=), sans JavaScript. */
export function SearchBox({ q, placeholder, cache }: { q?: string; placeholder: string; cache?: Record<string, string> }) {
  return (
    <form role="search" action="">
      {Object.entries(cache ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input className="search" type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label={placeholder} />
    </form>
  );
}

/** Ligne de tableau cliquable qui ouvre une fiche (lien sur la première cellule pour le clavier). */
export function LienFiche({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} scroll={false} style={{ textDecoration: 'none', fontWeight: 600 }}>{children}</Link>;
}
