// Rapport complet ou partiel (repris de l'artefact) : période et forme des données, communes à l'écran et au PDF.

export type Rubrique = 'structure' | 'stats' | 'projets' | 'finances' | 'reco';
export type SectionRapport = { t: string; kpis: [string, string][]; tables: { t: string; head: string[]; rows: string[][] }[] };
export type Rapport = { titre: string; periode: string; genere: string; a: string; b: string; secs: SectionRapport[] };

export const RUBRIQUES: [Rubrique, string][] = [
  ['structure', "Structure de l'église"], ['stats', 'Statistiques et objectifs'], ['projets', 'Projets'], ['finances', 'Finances'], ['reco', 'Recommandations'],
];
export const PERIODES: [string, string][] = [
  ['mois', 'Ce mois-ci'], ['moisprec', 'Le mois dernier'], ['trimestre', 'Ce trimestre'], ['annee', 'Cette année'], ['anneeprec', "L'année dernière"], ['perso', 'Période personnalisée'],
];

const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const finDeMois = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Bornes [début, fin] d'une période, à partir du jour donné (AAAA-MM-JJ). */
export function periodeDe(code: string, jour: string, debut?: string, fin?: string): [string, string] {
  const y = Number(jour.slice(0, 4)), m = Number(jour.slice(5, 7));
  if (code === 'moisprec') { const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1; return [iso(py, pm, 1), iso(py, pm, finDeMois(py, pm))]; }
  if (code === 'trimestre') { const q = Math.floor((m - 1) / 3) * 3 + 1; return [iso(y, q, 1), iso(y, q + 2, finDeMois(y, q + 2))]; }
  if (code === 'annee') return [`${y}-01-01`, `${y}-12-31`];
  if (code === 'anneeprec') return [`${y - 1}-01-01`, `${y - 1}-12-31`];
  if (code === 'perso' && debut && fin && /^\d{4}-\d{2}-\d{2}$/.test(debut) && /^\d{4}-\d{2}-\d{2}$/.test(fin) && debut <= fin) return [debut, fin];
  return [iso(y, m, 1), iso(y, m, finDeMois(y, m))];
}

/** Texte compatible avec la police standard des PDF (pas d'espaces fines, de tirets longs ni de guillemets typographiques). */
export const textePdf = (x: unknown) => String(x ?? '').replace(/[  ]/g, ' ').replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/[–—]/g, '-')
  .replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/…/g, '...').replace(/→/g, '->');
