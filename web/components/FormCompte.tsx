'use client';
import { useActionState, useState } from 'react';
import type { EtatCompte } from '@/app/(app)/admin/actions';

/** Formulaire de compte : affiche une seule fois le mot de passe provisoire renvoyé par l'action. */
export function FormCompte({ action, id, className = 'form', bouton, boutonClasse = 'btn primary', children }: {
  action: (e: EtatCompte, f: FormData) => Promise<EtatCompte>; id?: string; className?: string; bouton: string; boutonClasse?: string; children: React.ReactNode;
}) {
  const [etat, act, enCours] = useActionState<EtatCompte, FormData>(action, {});
  const [copie, setCopie] = useState(false);
  return (
    <form action={act} id={id} className={className} noValidate>
      {children}
      {etat.erreur && <p className="err" role="alert" style={{ gridColumn: '1/-1', margin: 0 }}>{etat.erreur}</p>}
      {etat.motDePasse && (
        <div className="field full" role="status">
          <label>Mot de passe provisoire pour {etat.email} (affiché une seule fois)</label>
          <div className="actions"><span className="secret">{etat.motDePasse}</span>
            <button className="btn sm" type="button" onClick={async () => { try { await navigator.clipboard.writeText(etat.motDePasse!); setCopie(true); } catch { /* copie manuelle */ } }}>{copie ? 'Copié' : 'Copier'}</button>
          </div>
          <span className="muted" style={{ fontSize: 12 }}>Transmettez-le à la personne : elle le changera dans « Mon profil ».</span>
        </div>
      )}
      <div className="actions" style={{ gridColumn: '1/-1' }}><button className={boutonClasse} type="submit" disabled={enCours}>{enCours ? 'En cours…' : bouton}</button></div>
    </form>
  );
}
