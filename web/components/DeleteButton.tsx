'use client';
import { useState, useTransition } from 'react';

/**
 * Suppression en deux clics, comme dans l'artefact.
 * Depuis un composant serveur, passer une Server Action liée (action.bind(null, id)), jamais une fonction fléchée.
 */
export function DeleteButton({ action, label = 'Supprimer', confirmation = 'Confirmer la suppression' }: { action: () => Promise<unknown>; label?: string; confirmation?: string }) {
  const [arme, setArme] = useState(false);
  const [enCours, start] = useTransition();
  return (
    <button className="btn danger" type="button" disabled={enCours} onClick={() => (arme ? start(async () => { await action(); }) : setArme(true))}>
      {arme ? confirmation : label}
    </button>
  );
}
