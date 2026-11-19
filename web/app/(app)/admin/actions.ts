'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { messageErreur } from '@/lib/erreurs';
import { motDePasseProvisoire } from '@/lib/motdepasse';

export type EtatCompte = { erreur?: string; motDePasse?: string; email?: string };
const txt = (f: FormData, k: string) => { const v = String(f.get(k) ?? '').trim(); return v === '' ? null : v; };

/** Vérifie, avec la session de l'appelant, qu'il est administrateur (avant toute utilisation de la clé secrète). */
async function exigerAdmin() {
  const s = await getSession();
  return s && s.droits.admin === 'w' ? s : null;
}

export async function creerUtilisateur(_: EtatCompte, f: FormData): Promise<EtatCompte> {
  const s = await exigerAdmin();
  if (!s) return { erreur: "Vous n'avez pas le droit de faire cette action." };
  const nom = txt(f, 'nom'), email = txt(f, 'email')?.toLowerCase() ?? null, role = txt(f, 'role_code');
  const manque = [!nom && 'Nom', !email && 'Email', !role && 'Rôle'].filter(Boolean);
  if (manque.length) return { erreur: 'Champ obligatoire : ' + manque.join(', ') + '.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email!)) return { erreur: "L'adresse email n'est pas valide." };
  const motDePasse = motDePasseProvisoire();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email: email!, password: motDePasse, email_confirm: true });
  if (error || !data.user) return { erreur: /already|exists|registered/i.test(error?.message ?? '') ? 'Un compte existe déjà avec cet email.' : 'Création du compte impossible, réessayez.' };
  const { error: e2 } = await admin.from('profil').insert({
    id: data.user.id, eglise_id: s.profil.eglise_id, nom, email, role_code: role, fonction: txt(f, 'fonction'),
    berger_id: role === 'berger' ? txt(f, 'berger_id') : null,
  });
  if (e2) { await admin.auth.admin.deleteUser(data.user.id); return { erreur: messageErreur(e2) }; }
  revalidatePath('/admin', 'layout');
  return { motDePasse, email: email! };
}

export async function modifierUtilisateur(_: EtatCompte, f: FormData): Promise<EtatCompte> {
  const id = txt(f, 'id');
  const role = txt(f, 'role_code');
  const supabase = await createClient();
  const { data, error } = await supabase.from('profil').update({
    nom: txt(f, 'nom'), role_code: role, fonction: txt(f, 'fonction'), berger_id: role === 'berger' ? txt(f, 'berger_id') : null, actif: f.get('actif') === 'on',
  }).eq('id', id).select('id');
  if (error) return { erreur: messageErreur(error) };
  if (!data?.length) return { erreur: "Vous n'avez pas le droit de modifier ce compte." };
  revalidatePath('/', 'layout');
  redirect('/admin/utilisateurs');
}

export async function reinitialiserMotDePasse(_: EtatCompte, f: FormData): Promise<EtatCompte> {
  const s = await exigerAdmin();
  if (!s) return { erreur: "Vous n'avez pas le droit de faire cette action." };
  const id = txt(f, 'id')!;
  const supabase = await createClient();
  const { data: p } = await supabase.from('profil').select('email').eq('id', id).maybeSingle();
  if (!p) return { erreur: 'Compte introuvable.' };
  const motDePasse = motDePasseProvisoire();
  const { error } = await createAdminClient().auth.admin.updateUserById(id, { password: motDePasse });
  if (error) return { erreur: 'Réinitialisation impossible, réessayez.' };
  return { motDePasse, email: p.email ?? undefined };
}
