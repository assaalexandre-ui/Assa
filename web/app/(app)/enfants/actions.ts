'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { messageErreur } from '@/lib/erreurs';

/** Pointe l'arrivée ou la sortie d'un enfant (la base vérifie qu'il est arrivé avant de sortir). */
export async function pointer(enfant: string, date: string, quoi: 'arrivee' | 'sortie', retour: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('pointer_enfant', { p_enfant: enfant, p_date: date, p_quoi: quoi });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  redirect(retour.startsWith('/') && !retour.startsWith('//') ? retour : '/enfants/pointage');
}
