'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { messageErreur, type Resultat } from '@/lib/erreurs';
import { phone } from '@/lib/format';
import { lireFiche } from '../fideles/actions';

const txt = (f: FormData, k: string) => { const v = String(f.get(k) ?? '').trim(); return v === '' ? null : v; };
const retourSur = (f: FormData, defaut: string) => { const r = String(f.get('retour') ?? defaut); return r.startsWith('/') && !r.startsWith('//') ? r : defaut; };
const fin = (retour: string): never => { revalidatePath('/', 'layout'); redirect(retour); };

export async function enregistrerBerger(_: Resultat, f: FormData): Promise<Resultat> {
  const id = txt(f, 'id');
  const fiche = { nom: txt(f, 'nom'), prenoms: txt(f, 'prenoms'), contact: txt(f, 'contact') ? phone(txt(f, 'contact')) : null };
  if (!fiche.nom) return { erreur: 'Champ obligatoire : Nom.' };
  const supabase = await createClient();
  const { data, error } = id ? await supabase.from('berger').update(fiche).eq('id', id).select('id') : await supabase.from('berger').insert(fiche).select('id');
  if (error) return { erreur: messageErreur(error) };
  if (!data?.length) return { erreur: "Vous n'avez pas le droit de modifier ce berger." };
  return fin(`/bergers/bergers?berger=${data[0].id}`);
}

export async function supprimerBerger(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('berger').delete().eq('id', id);
  if (error) return { erreur: messageErreur(error) };
  return fin('/bergers/bergers');
}

export async function rattacher(_: Resultat, f: FormData): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('rattacher_brebis', { p_fidele: txt(f, 'fidele'), p_berger: txt(f, 'berger') });
  if (error) return { erreur: messageErreur(error) };
  return fin(retourSur(f, '/bergers/bergers'));
}

export async function nouvelleBrebis(_: Resultat, f: FormData): Promise<Resultat> {
  const fiche = await lireFiche(f);
  if (!fiche.nom) return { erreur: 'Champ obligatoire : Nom.' };
  const supabase = await createClient();
  const { error } = await supabase.rpc('creer_brebis', { p_berger: txt(f, 'berger'), p_fiche: fiche });
  if (error) return { erreur: messageErreur(error) };
  return fin(retourSur(f, '/bergers/bergers'));
}

export async function enregistrerReleve(_: Resultat, f: FormData): Promise<Resultat> {
  const supabase = await createClient();
  const absents = f.getAll('absent').map(String);
  const { error } = await supabase.rpc('enregistrer_releve', { p_berger: txt(f, 'berger'), p_semaine: txt(f, 'semaine'), p_absents: absents });
  if (error) return { erreur: messageErreur(error) };
  return fin(retourSur(f, '/bergers/bergers'));
}
