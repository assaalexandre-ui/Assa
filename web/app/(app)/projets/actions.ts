'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { messageErreur, type Resultat } from '@/lib/erreurs';
import { STATUTS_ACTION, TYPES_JOURNAL } from '@/lib/entites';

const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

/** Ajoute une action au plan d'actions d'un projet. */
export async function ajouterAction(_: Resultat, f: FormData): Promise<Resultat> {
  const titre = txt(f, 'titre'), projet_id = txt(f, 'projet_id');
  if (!titre) return { erreur: "Écrivez l'action." };
  const supabase = await createClient();
  const { error } = await supabase.from('projet_action').insert({ projet_id, titre, responsable: txt(f, 'responsable') || null, echeance: txt(f, 'echeance') || null });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function statutAction(id: string, statut: string) {
  if (!STATUTS_ACTION.includes(statut)) return { erreur: 'Statut inconnu.' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('projet_action').update({ statut }).eq('id', id).select('id');
  if (error || !data?.length) return { erreur: error ? messageErreur(error) : "Vous n'avez pas le droit de faire cette action." };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function retirerAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('projet_action').delete().eq('id', id);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Ajoute une note au journal de suivi (le journal ne se réécrit pas). */
export async function ajouterJournal(_: Resultat, f: FormData): Promise<Resultat> {
  const texte = txt(f, 'texte'), type = txt(f, 'type') || 'Note';
  if (!texte) return { erreur: 'Écrivez le texte.' };
  if (!TYPES_JOURNAL.includes(type)) return { erreur: 'Type inconnu.' };
  const supabase = await createClient();
  const { error } = await supabase.from('projet_journal').insert({ projet_id: txt(f, 'projet_id'), type, texte, date: txt(f, 'date') || undefined });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  return { ok: true };
}
