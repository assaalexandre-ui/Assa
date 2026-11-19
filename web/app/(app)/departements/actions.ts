'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { messageErreur, type Resultat } from '@/lib/erreurs';
import { phone } from '@/lib/format';

const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

/** Création ou modification d'un département ; les membres sont saisis un par ligne. */
export async function enregistrerDepartement(_: Resultat, f: FormData): Promise<Resultat> {
  const nom = txt(f, 'nom'), groupe = txt(f, 'groupe');
  if (!nom || !groupe) return { erreur: 'Champ obligatoire : Nom, Catégorie.' };
  const valeurs = {
    nom, groupe, responsable: txt(f, 'responsable') || null, contact: txt(f, 'contact') ? phone(txt(f, 'contact')) : null, jour: txt(f, 'jour') || null,
    membres: txt(f, 'membres').split('\n').map(x => x.trim()).filter(Boolean), besoins: txt(f, 'besoins') || null,
  };
  const supabase = await createClient();
  const id = txt(f, 'id');
  if (id) {
    const { data, error } = await supabase.from('departement').update(valeurs).eq('id', id).select('id');
    if (error) return { erreur: messageErreur(error) };
    if (!data?.length) return { erreur: "Vous n'avez pas le droit de modifier ce département." };
  } else {
    const { data: tous } = await supabase.from('departement').select('ordre');
    const ordre = Math.max(0, ...(tous ?? []).map(d => Number(d.ordre) || 0)) + 1;
    const { error } = await supabase.from('departement').insert({ ...valeurs, id: 'd' + String(ordre).padStart(2, '0'), ordre });
    if (error) return { erreur: messageErreur(error) };
  }
  revalidatePath('/', 'layout');
  redirect(groupe === 'autre' ? '/departements/autres' : '/departements/services');
}

export async function supprimerDepartement(id: string, retour: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('departement').delete().eq('id', id);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath('/', 'layout');
  redirect(retour);
}
