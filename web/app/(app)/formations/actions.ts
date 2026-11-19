'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { messageErreur, type Resultat } from '@/lib/erreurs';

const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const fin = (retour: string): never => { revalidatePath('/', 'layout'); redirect(retour.startsWith('/') && !retour.startsWith('//') ? retour : '/formations/sessions'); };

/** Nouvelle classe : numéro libre (la 5e classe annoncée par le Word, par exemple). */
export async function creerClasse(_: Resultat, f: FormData): Promise<Resultat> {
  const numero = Number(txt(f, 'numero')), nom = txt(f, 'nom');
  if (!numero || numero < 1 || !nom) return { erreur: 'Champ obligatoire : Numéro, Nom.' };
  const supabase = await createClient();
  const { error } = await supabase.from('classe').insert({ id: 'classe' + numero, numero, nom, role: txt(f, 'role') || null, eglise_id: txt(f, 'eglise') });
  if (error) return { erreur: error.code === '23505' ? 'Cette classe existe déjà.' : messageErreur(error) };
  return fin('/formations/classes');
}

export async function inscrire(_: Resultat, f: FormData): Promise<Resultat> {
  if (!txt(f, 'fidele')) return { erreur: 'Choisissez un fidèle.' };
  const supabase = await createClient();
  const { error } = await supabase.from('inscription_formation').insert({ session_id: txt(f, 'session'), fidele_id: txt(f, 'fidele') });
  if (error) return { erreur: error.code === '23505' ? 'Ce fidèle est déjà inscrit.' : messageErreur(error) };
  return fin(txt(f, 'retour'));
}

export async function changerAbsences(id: string, absences: number, retour: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('inscription_formation').update({ absences: Math.max(0, absences) }).eq('id', id);
  if (error) return { erreur: messageErreur(error) };
  return fin(retour);
}

export async function valider(id: string, valide: boolean, retour: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('valider_inscription', { p_inscription: id, p_valide: valide });
  if (error) return { erreur: messageErreur(error) };
  return fin(retour);
}

export async function retirer(id: string, retour: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('inscription_formation').delete().eq('id', id);
  if (error) return { erreur: messageErreur(error) };
  return fin(retour);
}
