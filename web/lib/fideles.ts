import 'server-only';
import type { Session } from './session';
import { COMMUNES, STATUTS, type Refs } from './ref';

export const COLONNES_FIDELE = 'id, nom, prenoms, sexe, date_naissance, telephone, commune, quartier, statut, berger_id, gc_id, classe, cellule_id, notes, origine';

/** Qui peut modifier une fiche : droit d'écriture sur Fidèles, ou le berger de cette brebis (droit Bergers). */
export function peutModifierFidele(s: Session, f: { berger_id: string | null } | null): boolean {
  if (s.droits.fideles === 'w') return true;
  return !!f && s.profil.role_code === 'berger' && s.droits.bergers === 'w' && !!s.profil.berger_id && f.berger_id === s.profil.berger_id;
}

export const refsFormulaire = (r: Refs) => ({ gc: r.gc, classes: r.classes, bergers: r.bergers, cellules: r.cellules, communes: COMMUNES, statuts: STATUTS });
