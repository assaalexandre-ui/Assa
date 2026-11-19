'use server';
import { createClient } from '@/lib/supabase/server';

export type Etat = { erreur?: string; ok?: string };

export async function changerMotDePasse(_: Etat, form: FormData): Promise<Etat> {
  const mdp = String(form.get('mdp') ?? '');
  const conf = String(form.get('confirmation') ?? '');
  if (mdp.length < 8) return { erreur: 'Le mot de passe doit contenir au moins 8 caractères.' };
  if (mdp !== conf) return { erreur: 'Les deux mots de passe ne sont pas identiques.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: mdp });
  if (error) return { erreur: 'Le changement a échoué, réessayez.' };
  return { ok: 'Mot de passe changé.' };
}
