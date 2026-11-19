'use client';
import { useTransition } from 'react';

/** Bouton qui appelle une Server Action liée (action.bind(null, …)). */
export function BoutonAction({ action, children, className = 'btn sm', label }: { action: () => Promise<unknown>; children: React.ReactNode; className?: string; label?: string }) {
  const [enCours, start] = useTransition();
  return <button className={className} type="button" aria-label={label} disabled={enCours} onClick={() => start(async () => { await action(); })}>{children}</button>;
}
