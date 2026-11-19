'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { messageErreur, type Resultat } from '@/lib/erreurs';
import { phone, today } from '@/lib/format';

const txt = (f: FormData, k: string) => { const v = String(f.get(k) ?? '').trim(); return v === '' ? null : v; };
const retourSur = (f: FormData) => { const r = String(f.get('retour') ?? '/adnh/nouveaux'); return r.startsWith('/') && !r.startsWith('//') ? r : '/adnh/nouveaux'; };
const fin = (retour: string): never => { revalidatePath('/', 'layout'); redirect(retour); };

export async function enregistrerNouveau(_: Resultat, f: FormData): Promise<Resultat> {
  const id = txt(f, 'id');
  const fiche = { date_venue: txt(f, 'date_venue'), nom: txt(f, 'nom'), contact: txt(f, 'contact') ? phone(txt(f, 'contact')) : null, commune: txt(f, 'commune') };
  const manque = [!fiche.date_venue && 'Date de venue', !fiche.nom && 'Nom et prénoms'].filter(Boolean);
  if (manque.length) return { erreur: 'Champ obligatoire : ' + manque.join(', ') + '.' };
  const supabase = await createClient();
  const { data, error } = id ? await supabase.from('nouveau').update(fiche).eq('id', id).select('id') : await supabase.from('nouveau').insert(fiche).select('id');
  if (error) return { erreur: messageErreur(error) };
  if (!data?.length) return { erreur: "Vous n'avez pas le droit de modifier cette fiche." };
  return fin(id ? retourSur(f) : `/adnh/nouveaux?nouveau=${data[0].id}`);
}

export async function supprimerNouveau(id: string, retour: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('nouveau').delete().eq('id', id);
  if (error) return { erreur: messageErreur(error) };
  return fin(retour.startsWith('/') ? retour : '/adnh/nouveaux');
}

export async function noterAppel(_: Resultat, f: FormData): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase.from('appel').insert({ nouveau_id: txt(f, 'nouveau'), date: txt(f, 'date') ?? today(), resultat: txt(f, 'resultat') ?? 'Joint', note: txt(f, 'note') });
  if (error) return { erreur: messageErreur(error) };
  return fin(retourSur(f));
}

/** « Enregistrer » sauve l'orientation (GC, classe, berger) ; « Valider l'intégration » crée ou met à jour la fiche fidèle. */
export async function orienter(_: Resultat, f: FormData): Promise<Resultat> {
  const supabase = await createClient();
  const id = txt(f, 'nouveau');
  const classe = txt(f, 'classe');
  const v = { gc_id: txt(f, 'gc_id'), classe: classe ? Number(classe) : null, berger_id: txt(f, 'berger_id') };
  if (f.get('intention') === 'integrer') {
    if (!v.gc_id || !v.classe) return { erreur: 'Choisissez le GC et la classe.' };
    const { error } = await supabase.rpc('valider_integration', { p_nouveau: id, p_gc: v.gc_id, p_classe: v.classe, p_berger: v.berger_id });
    if (error) return { erreur: messageErreur(error) };
  } else {
    const { error } = await supabase.from('nouveau').update(v).eq('id', id);
    if (error) return { erreur: messageErreur(error) };
  }
  return fin(retourSur(f));
}
