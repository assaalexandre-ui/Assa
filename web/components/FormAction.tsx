'use client';
import { useActionState } from 'react';
import type { Resultat } from '@/lib/erreurs';

/** Formulaire relié à une Server Action qui renvoie { erreur } ou redirige. */
export function FormAction({ action, children, className, bouton, boutonClasse = 'btn primary sm', id }: {
  action: (etat: Resultat, f: FormData) => Promise<Resultat>; children: React.ReactNode; className?: string; bouton: string; boutonClasse?: string; id?: string;
}) {
  const [etat, act, enCours] = useActionState<Resultat, FormData>(action, {});
  return (
    <form action={act} className={className} id={id} noValidate>
      {children}
      {etat.erreur && <p className="err" role="alert" style={{ gridColumn: '1/-1', margin: 0 }}>{etat.erreur}</p>}
      <div className="actions" style={{ gridColumn: '1/-1' }}><button className={boutonClasse} type="submit" disabled={enCours}>{enCours ? 'Enregistrement…' : bouton}</button></div>
    </form>
  );
}
