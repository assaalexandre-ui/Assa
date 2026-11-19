'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { messageErreur, type Resultat } from '@/lib/erreurs';
import { ENTITES, lireChamps, type EntiteCle } from '@/lib/entites';

const retourSur = (r: unknown, defaut: string) => { const v = String(r ?? ''); return v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : defaut; };

/**
 * Enregistre une fiche d'une liste simple (cellule, rapport, activité, comptage…).
 * Les champs autorisés viennent de ENTITES ; les droits sont vérifiés par la base (RLS).
 * Champs cachés : _entite, _id, _retour, et éventuellement des valeurs fixes préfixées par « _fixe_ » (ex. _fixe_gc_id).
 */
export async function enregistrerFiche(_: Resultat, f: FormData): Promise<Resultat> {
  const cle = String(f.get('_entite')) as EntiteCle;
  const def = ENTITES[cle];
  if (!def) return { erreur: 'Formulaire inconnu.' };
  const lu = lireChamps(def, f);
  if (!lu.ok) return { erreur: lu.erreur };
  const valeurs: Record<string, unknown> = { ...lu.valeurs };
  if (cle === 'gc_passage') valeurs.gc_id = String(f.get('_fixe_gc_id') ?? '') || null;
  const id = String(f.get('_id') ?? '');
  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from(def.table).update(valeurs).eq('id', id).select('id')
    : await supabase.from(def.table).insert(valeurs).select('id');
  if (error) return { erreur: messageErreur(error) };
  if (!data?.length) return { erreur: "Vous n'avez pas le droit de modifier cette fiche." };
  revalidatePath('/', 'layout');
  redirect(retourSur(f.get('_retour'), '/'));
}

export async function supprimerFiche(cle: EntiteCle, id: string, retour: string) {
  const def = ENTITES[cle];
  if (!def) return { erreur: 'Formulaire inconnu.' };
  const supabase = await createClient();
  const { error } = await supabase.from(def.table).delete().eq('id', id);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  redirect(retourSur(retour, '/'));
}
