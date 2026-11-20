'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { messageErreur } from '@/lib/erreurs';
import { STATUTS_DEPENSE } from '@/lib/entites';

/** Valide, refuse ou marque payée une dépense (la base refuse si c'est la personne qui l'a saisie). */
export async function statuerDepense(id: string, statut: string) {
  if (!STATUTS_DEPENSE.includes(statut)) return { erreur: 'Statut inconnu.' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('depense').update({ statut }).eq('id', id).select('id');
  if (error) return { erreur: messageErreur(error) };
  if (!data?.length) return { erreur: "Vous n'avez pas le droit de faire cette action." };
  revalidatePath('/', 'layout');
  return { ok: true };
}
