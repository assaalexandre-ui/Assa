import 'server-only';
import { createClient } from './supabase/server';

export const COMMUNES = ['Abobo', 'Adjamé', 'Anyama', 'Attécoubé', 'Bingerville', 'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Port-Bouët', 'Songon', 'Treichville', 'Yopougon', 'Autre'];
export const STATUTS = ['Nouveau', 'Membre', 'Ouvrier', 'Responsable', 'Inactif'];
export const RESULTATS_APPEL = ['Joint', 'Pas de réponse', 'Rappeler plus tard', 'Numéro erroné'];

export type Option = [string, string];
export type Refs = { gc: Option[]; classes: Option[]; bergers: (Option & { 2?: number })[]; bergersInfo: { id: string; nom: string; brebis: number }[]; cellules: Option[]; noms: Record<string, string> };

/** Listes de choix communes : GC, classes, bergers (via l'annuaire, noms seulement) et noms des comptes. */
export async function chargerRefs(): Promise<Refs> {
  const supabase = await createClient();
  const [gc, classes, annuaire] = await Promise.all([
    supabase.from('gc').select('id, nom, tribu').order('ordre'),
    supabase.from('classe').select('numero, nom').order('numero'),
    supabase.from('annuaire').select('id, type, nom, brebis').order('nom'),
  ]);
  const ann = annuaire.data ?? [];
  const bergersInfo = ann.filter(a => a.type === 'berger').map(a => ({ id: a.id as string, nom: a.nom as string, brebis: Number(a.brebis) || 0 }));
  return {
    gc: (gc.data ?? []).map(g => [g.id, g.nom + (g.tribu ? ' · ' + g.tribu : '')]),
    classes: (classes.data ?? []).map(c => [String(c.numero), `Classe ${c.numero} : ${c.nom}`]),
    bergers: bergersInfo.map(b => [b.id, b.nom]),
    bergersInfo,
    cellules: ann.filter(a => a.type === 'cellule').map(a => [a.id as string, a.nom as string]),
    noms: Object.fromEntries(ann.map(a => [a.id, a.nom])),
  };
}

export const libelle = (opts: Option[], v: string | number | null | undefined) => (v == null || v === '' ? '—' : opts.find(o => o[0] === String(v))?.[1] ?? '—');
