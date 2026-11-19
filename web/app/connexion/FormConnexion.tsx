'use client';
import { useActionState } from 'react';
import { seConnecter, type EtatConnexion } from './actions';

export function FormConnexion() {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(seConnecter, {});
  return (
    <form action={action} noValidate>
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required /></div>
      <div className="field"><label htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {etat.erreur && <p className="err" role="alert">{etat.erreur}</p>}
      <button className="btn primary" type="submit" disabled={enCours}>{enCours ? 'Connexion…' : 'Se connecter'}</button>
    </form>
  );
}
