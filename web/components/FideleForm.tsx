'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { enregistrerFidele, supprimerFidele } from '@/app/(app)/fideles/actions';
import { Champ } from './Champ';
import { DeleteButton } from './DeleteButton';
import type { Resultat } from '@/lib/erreurs';

type Opt = [string, string];
export type FicheFidele = Record<string, string | number | null>;

export function FideleForm({ fiche, refs, ro, choixBerger, suppression, retour }: {
  fiche: FicheFidele | null; refs: { gc: Opt[]; classes: Opt[]; bergers: Opt[]; cellules: Opt[]; communes: string[]; statuts: string[] };
  ro: boolean; choixBerger: boolean; suppression: boolean; retour: string;
}) {
  const [etat, action, enCours] = useActionState<Resultat, FormData>(enregistrerFidele, {});
  const v = fiche ?? { statut: 'Membre' };
  return (
    <>
      {ro && <p className="banner info" style={{ margin: 0 }}>Consultation seule : votre rôle ne permet pas de modifier cette fiche.</p>}
      <form id="mform" className="form" action={action} noValidate>
        <input type="hidden" name="id" value={fiche?.id ?? ''} />
        <input type="hidden" name="retour" value={retour} />
        <Champ k="nom" label="Nom" req v={v.nom} ro={ro} />
        <Champ k="prenoms" label="Prénoms" v={v.prenoms} ro={ro} />
        <Champ k="sexe" label="Sexe" type="select" options={['Homme', 'Femme']} v={v.sexe} ro={ro} />
        <Champ k="date_naissance" label="Date de naissance" type="date" v={v.date_naissance} ro={ro} />
        <Champ k="telephone" label="Contact" type="tel" v={v.telephone} ro={ro} />
        <Champ k="commune" label="Commune" type="select" options={refs.communes} v={v.commune} ro={ro} />
        <Champ k="quartier" label="Quartier" v={v.quartier} ro={ro} />
        <Champ k="statut" label="Statut" type="select" options={refs.statuts} v={v.statut} ro={ro} />
        {choixBerger
          ? <Champ k="berger_id" label="Berger" type="select" options={refs.bergers} v={v.berger_id} ro={ro} />
          : <Champ k="berger_aff" label="Berger" type="select" options={refs.bergers} v={v.berger_id} ro hint="Le rattachement se change depuis la fiche du berger." />}
        <Champ k="cellule_id" label="Cellule" type="select" options={refs.cellules} v={v.cellule_id} ro={ro} />
        <Champ k="gc_id" label="GC (tribu)" type="select" options={refs.gc} v={v.gc_id} ro={ro} />
        <Champ k="classe" label="Classe de formation" type="select" options={refs.classes} v={v.classe} ro={ro} />
        <Champ k="notes" label="Notes" type="textarea" v={v.notes} ro={ro} />
      </form>
      {etat.erreur && <p className="err" role="alert">{etat.erreur}</p>}
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <div>{suppression && fiche?.id && <DeleteButton action={() => supprimerFidele(String(fiche.id), retour)} />}</div>
        <div className="actions">
          <Link className="btn" href={retour} scroll={false}>{ro ? 'Fermer' : 'Annuler'}</Link>
          {!ro && <button className="btn primary" type="submit" form="mform" disabled={enCours}>{enCours ? 'Enregistrement…' : 'Enregistrer'}</button>}
        </div>
      </div>
    </>
  );
}
