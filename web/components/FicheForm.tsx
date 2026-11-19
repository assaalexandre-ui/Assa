'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { enregistrerFiche, supprimerFiche } from '@/app/(app)/fiches/actions';
import { ENTITES, type EntiteCle, type EntiteDef } from '@/lib/entites';
import type { Resultat } from '@/lib/erreurs';
import { Champ } from './Champ';
import { DeleteButton } from './DeleteButton';

type Opt = [string, string];

/** Formulaire générique d'une fiche (voir lib/entites.ts). ro = consultation seule. */
export function FicheForm({ entite, id, valeurs, dyn, ro, suppression, retour, fixes }: {
  entite: EntiteCle; id?: string | null; valeurs?: Record<string, string | number | null>; dyn?: Partial<Record<'bergers' | 'cellules' | 'assemblees', Opt[]>>;
  ro: boolean; suppression?: boolean; retour: string; fixes?: Record<string, string>;
}) {
  const [etat, action, enCours] = useActionState<Resultat, FormData>(enregistrerFiche, {});
  const def: EntiteDef = ENTITES[entite];
  return (
    <>
      {ro && <p className="banner info" style={{ margin: 0 }}>Consultation seule : votre rôle ne permet pas de modifier cette fiche.</p>}
      <form id="fform" className="form" action={action} noValidate>
        <input type="hidden" name="_entite" value={entite} />
        <input type="hidden" name="_id" value={id ?? ''} />
        <input type="hidden" name="_retour" value={retour} />
        {Object.entries(fixes ?? {}).map(([k, v]) => <input key={k} type="hidden" name={'_fixe_' + k} value={v} />)}
        {def.champs.map(c => c.type === 'select'
          ? <Champ key={c.k} k={c.k} label={c.label} type="select" options={c.dyn ? (dyn?.[c.dyn] ?? []) : (c.options ?? [])} req={c.req} full={c.full} ro={ro} v={valeurs?.[c.k]} />
          : <Champ key={c.k} k={c.k} label={c.label} type={c.type ?? 'text'} req={c.req} full={c.full} ro={ro} v={valeurs?.[c.k]} />)}
      </form>
      {etat.erreur && <p className="err" role="alert">{etat.erreur}</p>}
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <div>{suppression && id && !ro && <DeleteButton action={() => supprimerFiche(entite, id, retour)} />}</div>
        <div className="actions">
          <Link className="btn" href={retour} scroll={false}>{ro ? 'Fermer' : 'Annuler'}</Link>
          {!ro && <button className="btn primary" type="submit" form="fform" disabled={enCours}>{enCours ? 'Enregistrement…' : 'Enregistrer'}</button>}
        </div>
      </div>
    </>
  );
}
