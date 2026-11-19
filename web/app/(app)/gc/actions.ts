'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { messageErreur, type Resultat } from '@/lib/erreurs';

const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const retourSur = (f: FormData) => { const r = txt(f, 'retour'); return r.startsWith('/') && !r.startsWith('//') && !r.includes('\\') ? r : '/gc/groupes'; };

/** Nom, tribu et cinq responsables associés d'un GC. */
export async function enregistrerGc(_: Resultat, f: FormData): Promise<Resultat> {
  const nom = txt(f, 'nom');
  if (!nom) return { erreur: 'Le nom du GC est obligatoire.' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('gc').update({ nom, tribu: txt(f, 'tribu'), responsables: [0, 1, 2, 3, 4].map(i => txt(f, 'r' + i)) }).eq('id', txt(f, 'gc')).select('id');
  if (error) return { erreur: messageErreur(error) };
  if (!data?.length) return { erreur: "Vous n'avez pas le droit de modifier ce GC." };
  revalidatePath('/', 'layout');
  redirect(retourSur(f));
}

/** Nouveau GC : identifiant lisible (gc13, gc14…) et place à la fin de la liste. */
export async function creerGc(_: Resultat, f: FormData): Promise<Resultat> {
  const nom = txt(f, 'nom');
  if (!nom) return { erreur: 'Le nom du GC est obligatoire.' };
  const supabase = await createClient();
  const { data: tous } = await supabase.from('gc').select('id, ordre');
  const ordre = Math.max(0, ...(tous ?? []).map(g => Number(g.ordre) || 0)) + 1;
  const { error } = await supabase.from('gc').insert({ id: 'gc' + String(ordre).padStart(2, '0'), nom, tribu: txt(f, 'tribu'), ordre });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  redirect('/gc/groupes');
}

export async function supprimerGc(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('gc').delete().eq('id', id);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  redirect('/gc/groupes');
}

export async function enregistrerPresences(_: Resultat, f: FormData): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('enregistrer_presence_gc', { p_gc: txt(f, 'gc'), p_date: txt(f, 'date'), p_absents: f.getAll('absent').map(String) });
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  redirect(retourSur(f));
}
