// Formats repris de l'artefact (app/index.html) : téléphones +225, dates en français, semaines ISO.

type Nom = { nom?: string | null; prenoms?: string | null } | null | undefined;

/** Normalise un numéro ivoirien à 10 chiffres en « +225 XX XX XX XX XX » ; sinon renvoie la saisie nettoyée. */
export function phone(v: string | null | undefined): string {
  const d = String(v ?? '').replace(/\D/g, '');
  const n = d.startsWith('225') && d.length === 13 ? d.slice(3) : d;
  return n.length === 10 ? '+225 ' + n.replace(/(\d{2})(?=\d)/g, '$1 ').trim() : String(v ?? '').trim();
}

/** « 2 nov. 2026 », ou « — » si la date est vide. */
export function frDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!y) return String(iso);
  return new Date(y, m - 1, d || 1).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** « octobre 2026 » à partir de « 2026-10 ». */
export function frMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** Date du jour (fuseau local) au format AAAA-MM-JJ. */
export function today(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
}

/** Semaine ISO, ex. « 2026-W47 ». */
export function isoWeek(iso?: string): string {
  const [y, m, dd] = (iso || today()).split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, dd));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return d.getUTCFullYear() + '-W' + String(Math.ceil(((d.getTime() - y0.getTime()) / 864e5 + 1) / 7)).padStart(2, '0');
}

export const weekLabel = (wk: string) => 'semaine ' + Number(wk.split('-W')[1]);

export function fullName(f: Nom): string {
  return f ? [f.nom, f.prenoms].filter(Boolean).join(' ') || '—' : '—';
}

/** Montant en FCFA entiers : « 1 250 000 F ». */
export function money(n: number | string | null | undefined): string {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/[  ]/g, ' ') + ' F';
}
