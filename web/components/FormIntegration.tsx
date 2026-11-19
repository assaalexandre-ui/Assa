'use client';
import { useActionState } from 'react';
import { orienter } from '@/app/(app)/adnh/actions';
import type { Resultat } from '@/lib/erreurs';

/** Intégration d'un nouveau : deux boutons, « Enregistrer » (orientation) et « Valider l'intégration ». */
export function FormIntegration({ nouveau, retour, integre, ro, children }: { nouveau: string; retour: string; integre: boolean; ro: boolean; children: React.ReactNode }) {
  const [etat, act, enCours] = useActionState<Resultat, FormData>(orienter, {});
  return (
    <form action={act} className="form" noValidate>
      <input type="hidden" name="nouveau" value={nouveau} /><input type="hidden" name="retour" value={retour} />
      {children}
      <p className="muted" style={{ gridColumn: '1/-1', margin: 0, fontSize: 12.5 }}>{integre ? 'Intégré : sa fiche fidèle est à jour.' : 'La validation crée sa fiche dans le fichier des fidèles.'}</p>
      {etat.erreur && <p className="err" role="alert" style={{ gridColumn: '1/-1', margin: 0 }}>{etat.erreur}</p>}
      {!ro && (
        <div className="actions" style={{ gridColumn: '1/-1' }}>
          <button className="btn" type="submit" name="intention" value="orienter" disabled={enCours}>Enregistrer</button>
          <button className="btn primary" type="submit" name="intention" value="integrer" disabled={enCours}>{integre ? "Mettre à jour l'intégration" : "Valider l'intégration"}</button>
        </div>
      )}
    </form>
  );
}
