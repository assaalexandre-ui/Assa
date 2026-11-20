'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { messageErreur } from '@/lib/erreurs';

/** Valide un encaissement (refusé par la base si c'est la personne qui l'a saisi). */
export async function validerDon(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('don').update({ statut: 'Validé' }).eq('id', id).select('id');
  if (error) return { erreur: messageErreur(error) };
  if (!data?.length) return { erreur: "Vous n'avez pas le droit de faire cette action." };
  revalidatePath('/', 'layout');
  return { ok: true };
}
