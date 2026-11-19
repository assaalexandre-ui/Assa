'use client';
import { useActionState } from 'react';
import { changerMotDePasse, type Etat } from './actions';

export function FormMdp() {
  const [etat, action, enCours] = useActionState<Etat, FormData>(changerMotDePasse, {});
  return (
    <form action={action} className="form" noValidate>
      <div className="field"><label htmlFor="mdp">Nouveau mot de passe</label><input id="mdp" name="mdp" type="password" autoComplete="new-password" minLength={8} required /></div>
      <div className="field"><label htmlFor="confirmation">Confirmation</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required /></div>
      <div className="field full">
        {etat.erreur && <p className="err" role="alert">{etat.erreur}</p>}
        {etat.ok && <p className="banner info" role="status" style={{ margin: 0 }}>{etat.ok}</p>}
        <div className="actions"><button className="btn primary" type="submit" disabled={enCours}>Changer le mot de passe</button></div>
      </div>
    </form>
  );
}
