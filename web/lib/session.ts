import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import type { Acces, Droits, MenuId } from './menus';

export type Profil = { id: string; nom: string; email: string | null; role_code: string; fonction: string | null; berger_id: string | null; actif: boolean };
export type Session = { userId: string; profil: Profil; roleLibelle: string; droits: Droits };

/** Session courante (profil + droits par menu), ou null si personne n'est connecté ou si le compte est désactivé. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profil } = await supabase.from('profil').select('id, nom, email, role_code, fonction, berger_id, actif').eq('id', data.user.id).maybeSingle();
  if (!profil || !profil.actif) return null;
  const [{ data: rm }, { data: role }] = await Promise.all([
    supabase.from('role_menu').select('menu, acces').eq('role_code', profil.role_code),
    supabase.from('role').select('libelle').eq('code', profil.role_code).maybeSingle(),
  ]);
  const droits: Droits = {};
  (rm ?? []).forEach(r => { droits[r.menu as MenuId] = r.acces as Acces; });
  return { userId: data.user.id, profil: profil as Profil, roleLibelle: role?.libelle ?? profil.role_code, droits };
});

/** Exige l'accès au menu (lecture par défaut) ; sinon renvoie à l'accueil. */
export async function requireMenu(menu: MenuId, acces: Acces = 'r'): Promise<Session> {
  const s = await getSession();
  if (!s) redirect('/connexion');
  const d = s.droits[menu];
  if (!d || (acces === 'w' && d !== 'w')) redirect('/');
  return s;
}

export const peutEcrire = (s: Session, menu: MenuId) => s.droits[menu] === 'w';
