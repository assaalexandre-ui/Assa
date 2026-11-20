'use client';
import { useState, useTransition } from 'react';

/** Bouton qui appelle une Server Action liée (action.bind(null, …)) ; affiche le refus éventuel de la base. */
export function BoutonAction({ action, children, className = 'btn sm', label }: { action: () => Promise<unknown>; children: React.ReactNode; className?: string; label?: string }) {
  const [enCours, start] = useTransition();
  const [erreur, setErreur] = useState('');
  return (
    <>
      <button className={className} type="button" aria-label={label} disabled={enCours} onClick={() => start(async () => {
        setErreur('');
        const r = await action();
        if (r && typeof r === 'object' && 'erreur' in r && typeof r.erreur === 'string') setErreur(r.erreur);
      })}>{children}</button>
      {erreur && <span className="err" role="alert" style={{ display: 'block', margin: '4px 0 0', fontSize: 12.5, whiteSpace: 'normal', textAlign: 'left' }}>{erreur}</span>}
    </>
  );
}
