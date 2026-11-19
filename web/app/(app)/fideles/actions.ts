'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import { messageErreur, type Resultat } from '@/lib/erreurs';
import { phone } from '@/lib/format';

const txt = (f: FormData, k: string) => { const v = String(f.get(k) ?? '').trim(); return v === '' ? null : v; };
const retourSur = (f: FormData) => { const r = String(f.get('retour') ?? '/fideles/liste'); return r.startsWith('/') && !r.startsWith('//') ? r : '/fideles/liste'; };

/** Champs d'une fiche fidèle lus depuis le formulaire (téléphone normalisé). */
export async function lireFiche(f: FormData) {
  const classe = txt(f, 'classe');
  return {
    nom: txt(f, 'nom'), prenoms: txt(f, 'prenoms'), sexe: txt(f, 'sexe'), date_naissance: txt(f, 'date_naissance'),
    telephone: txt(f, 'telephone') ? phone(txt(f, 'telephone')) : null, commune: txt(f, 'commune'), quartier: txt(f, 'quartier'),
    statut: txt(f, 'statut') ?? 'Membre', gc_id: txt(f, 'gc_id'), classe: classe ? Number(classe) : null, notes: txt(f, 'notes'),
  };
}

export async function enregistrerFidele(_: Resultat, f: FormData): Promise<Resultat> {
  const s = await getSession();
  if (!s) return { erreur: 'Votre session a expiré : reconnectez-vous.' };
  const id = txt(f, 'id');
  const fiche: Record<string, unknown> = await lireFiche(f);
  if (!fiche.nom) return { erreur: 'Champ obligatoire : Nom.' };
  // Un berger ne change pas le rattachement de ses brebis depuis la fiche.
  if (f.has('berger_id') && s.profil.role_code !== 'berger') fiche.berger_id = txt(f, 'berger_id');
  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from('fidele').update(fiche).eq('id', id).select('id')
    : await supabase.from('fidele').insert(fiche).select('id');
  if (error) return { erreur: messageErreur(error) };
  if (!data?.length) return { erreur: "Vous n'avez pas le droit de modifier cette fiche." };
  revalidatePath('/', 'layout');
  redirect(retourSur(f));
}

export async function supprimerFidele(id: string, retour: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('fidele').delete().eq('id', id);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  redirect(retour.startsWith('/') ? retour : '/fideles/liste');
}
