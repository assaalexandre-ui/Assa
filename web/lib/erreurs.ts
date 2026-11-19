type ErreurBase = { code?: string; message?: string } | null | undefined;

/** Message lisible à partir d'une erreur Supabase/PostgreSQL. */
export function messageErreur(e: ErreurBase): string {
  if (e?.code === 'P0001' && e.message) return e.message;
  if (e?.code === '42501' || /row-level security/i.test(e?.message ?? '')) return "Vous n'avez pas le droit de faire cette action.";
  return 'Enregistrement impossible, réessayez.';
}

export type Resultat = { ok?: true; erreur?: string };
