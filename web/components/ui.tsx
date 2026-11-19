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

export function Panel({ titre, droite, children }: { titre?: React.ReactNode; droite?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel">
      {titre && <header><h2>{titre}</h2>{droite}</header>}
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
