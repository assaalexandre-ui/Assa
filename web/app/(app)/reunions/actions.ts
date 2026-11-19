'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { messageErreur } from '@/lib/erreurs';

/** « Marquer fait » / « Rouvrir » une tâche du conseil. */
export async function basculerTache(id: string, faite: boolean, retour: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('tache').update({ statut: faite ? 'Terminée' : 'À faire' }).eq('id', id);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  redirect(retour.startsWith('/') && !retour.startsWith('//') ? retour : '/reunions/taches');
}
