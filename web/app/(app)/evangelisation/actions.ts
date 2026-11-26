'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { messageErreur } from '@/lib/erreurs';

/** Transmet un contact recueilli à l'ADNH : la base crée la fiche « nouveau » (une seule fois par contact). */
export async function transmettreContact(sortie: string, ligne: number) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('transmettre_contact', { p_sortie: sortie, p_ligne: ligne });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  return { ok: true };
}
