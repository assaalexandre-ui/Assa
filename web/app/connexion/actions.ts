'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type EtatConnexion = { erreur?: string };

export async function seConnecter(_: EtatConnexion, form: FormData): Promise<EtatConnexion> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { erreur: 'Saisissez votre email et votre mot de passe.' };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { erreur: 'Email ou mot de passe incorrect.' };
  const { data: profil } = await supabase.from('profil').select('actif').eq('id', data.user.id).maybeSingle();
  if (!profil || !profil.actif) {
    await supabase.auth.signOut();
    return { erreur: "Ce compte est désactivé ou n'a pas encore d'accès. Adressez-vous à l'administration de l'église." };
  }
  redirect('/');
}

export async function seDeconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/connexion');
}
