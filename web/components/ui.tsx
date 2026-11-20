// Petits éléments d'interface repris de l'artefact (panneaux, indicateurs, pastilles, états vides).
import Link from 'next/link';

export const Pill = ({ children, c = 'n' }: { children: React.ReactNode; c?: 'g' | 'w' | 'b' | 'n' | 'a' }) => <span className={`pill ${c}`}>{children}</span>;

/** Chiffres clés : un bandeau, chaque chiffre avec sa bille de verre et un pictogramme choisi d'après son libellé. */
export function Kpis({ items }: { items: [string, React.ReactNode, string?][] }) {
  return (
    <div className="kpis">
      {items.map(([l, v, e], i) => {
        const [ic, ton] = iconeKpi(l, i);
        return (
          <div className="kpi" key={l}>
            <Bille icone={ic} ton={ton} />
            <div className="kt"><span>{l}</span><strong>{v}</strong>{e && <em>{e}</em>}</div>
          </div>
        );
      })}
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
  personnes: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M14 14.6c3.4-.6 6.5 1.6 7 5.4"/>',
  cle: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
  journal: '<path d="M5 4h11l3 3v13H5z"/><path d="M9 10h6M9 14h6M9 18h3"/>',
  liste: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  ajout: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  coeur: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  service: '<path d="M4 14h16M6 14l1-6h10l1 6M9 8V5h6v3"/><path d="M5 14v5h14v-5"/>',
  eglise: '<path d="M12 3v5M9.5 5.5h5"/><path d="M5 21V12l7-4 7 4v9"/><path d="M10 21v-4h4v4"/>',
  cible: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  sablier: '<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/>',
  maison: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
} as const;

/** Bille de verre aux couleurs du vitrail, pictogramme blanc en relief. */
export function Bille({ icone, ton = 'saphir', grande }: { icone: keyof typeof ICONES; ton?: Ton; grande?: boolean }) {
  return <span className={'pico' + (grande ? ' grande' : '')} style={{ ['--j' as string]: `var(--${ton})` }}><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONES[icone] }} /></span>;
}

const TONS: Ton[] = ['saphir', 'rubis', 'emeraude', 'ambre', 'amethyste', 'ciel'];
// Icône et couleur choisies d'après le titre du bloc, pour que chaque bloc titré porte son pictogramme rond.
const AUTO: [RegExp, keyof typeof ICONES, Ton][] = [
  [/absence|présence|relevé|par mois/i, 'barres', 'emeraude'],
  [/anniversaire/i, 'coeur', 'rubis'],
  [/appel|relancer/i, 'telephone', 'rubis'],
  [/intégr/i, 'ajout', 'emeraude'],
  [/session|classe|inscrit|formation/i, 'formation', 'ambre'],
  [/brebis|berger/i, 'berger', 'ciel'],
  [/membre|utilisateur|personne/i, 'personnes', 'saphir'],
  [/rôle|accès/i, 'cle', 'amethyste'],
  [/journal|plan d|tâche/i, 'journal', 'ciel'],
  [/recette|dépense|budget|relevé de/i, 'argent', 'ambre'],
  [/passage|service/i, 'service', 'amethyste'],
  [/annonce/i, 'annonce', 'ambre'],
  [/venir|calend/i, 'calendrier', 'rubis'],
];
const AUTO_KPI: [RegExp, keyof typeof ICONES, Ton][] = [
  [/fidèle|membre|brebis|inscrit|participant/i, 'personnes', 'saphir'],
  [/nouveau.*appel|appeler|jamais appel/i, 'telephone', 'rubis'],
  [/nouveau|intégr/i, 'ajout', 'emeraude'],
  [/culte|présen|comptage/i, 'eglise', 'emeraude'],
  [/absen/i, 'barres', 'ambre'],
  [/tâche|action|rappel|retard/i, 'taches', 'ciel'],
  [/formation|classe|session/i, 'formation', 'ambre'],
  [/encaiss|dépens|solde|payé|budget|montant|mobile|reste|donné|recette|valeur|ce mois|depuis janvier/i, 'argent', 'ambre'],
  [/valider|attente|à payer/i, 'sablier', 'rubis'],
  [/objectif|atteint|avancement/i, 'cible', 'amethyste'],
  [/projet|lancer|terminé|en cours/i, 'journal', 'ciel'],
  [/cellule|gc|groupe/i, 'rosace', 'emeraude'],
  [/article|réparer|service|patrimoine/i, 'service', 'amethyste'],
];
function iconeKpi(l: string, i: number): [keyof typeof ICONES, Ton] {
  const a = AUTO_KPI.find(([r]) => r.test(l));
  return a ? [a[1], a[2]] : ['liste', TONS[i % TONS.length]];
}

function iconeAuto(titre: string): [keyof typeof ICONES, Ton] {
  const a = AUTO.find(([r]) => r.test(titre));
  if (a) return [a[1], a[2]];
  let h = 0;
  for (const c of titre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ['liste', TONS[h % TONS.length]];
}

export function Panel({ titre, droite, children, icone, ton }: { titre?: React.ReactNode; droite?: React.ReactNode; children: React.ReactNode; icone?: keyof typeof ICONES; ton?: Ton }) {
  if (titre && !icone && typeof titre === 'string') [icone, ton] = [iconeAuto(titre)[0], ton ?? iconeAuto(titre)[1]];
  ton = ton ?? 'saphir';
  return (
    <section className="panel">
      {titre && <header>{icone && <Bille icone={icone} ton={ton} />}<h2>{titre}</h2>{droite}</header>}
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
