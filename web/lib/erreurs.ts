type ErreurBase = { code?: string; message?: string } | null | undefined;

/** Message lisible à partir d'une erreur Supabase/PostgreSQL. */
export function messageErreur(e: ErreurBase): string {
  if (e?.code === 'P0001' && e.message) return e.message;
  if (e?.code === '42501' || /row-level security/i.test(e?.message ?? '')) return "Vous n'avez pas le droit de faire cette action.";
  return 'Enregistrement impossible, réessayez.';
}

export type Resultat = { ok?: true; erreur?: string };

/** Message pour l'administrateur quand Supabase refuse de créer un compte ou de changer un mot de passe. */
export function messageCreationCompte(e: { status?: number; message?: string } | null | undefined, cleDefinie: boolean): string {
  if (!cleDefinie) return "La clé secrète Supabase (SUPABASE_SERVICE_ROLE_KEY) n'est pas configurée dans Vercel.";
  if (e?.status === 401 || e?.status === 403 || /invalid api key|not allowed|jwt/i.test(e?.message ?? '')) {
    return 'La clé secrète Supabase configurée dans Vercel est refusée : vérifiez qu’elle commence par sb_secret_ et qu’elle est complète.';
  }
  if (/already|exists|registered/i.test(e?.message ?? '')) return 'Un compte existe déjà avec cet email.';
  return e?.message ? `Création du compte impossible (${e.message}).` : 'Création du compte impossible, réessayez.';
}
