'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { messageErreur } from '@/lib/erreurs';

/** Valide un rapport de département ou le renvoie « À revoir » (droit vérifié par la base). */
export async function statuerRapport(id: string, statut: 'Validé' | 'À revoir' | 'Soumis') {
  const supabase = await createClient();
  const { error } = await supabase.rpc('statuer_rapport', { p_rapport: id, p_statut: statut });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  return { ok: true };
}
