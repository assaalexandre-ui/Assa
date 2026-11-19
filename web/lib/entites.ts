// Définitions déclaratives des listes simples (comme ENT dans l'artefact) : table, menu, champs du formulaire.
import { phone } from './format';

export type TypeChamp = 'text' | 'date' | 'time' | 'tel' | 'number' | 'textarea' | 'select';
/** options : liste fixe, ou clé d'une liste dynamique fournie par la page (bergers, cellules, assemblées). */
export type ChampDef = { k: string; label: string; type?: TypeChamp; req?: boolean; full?: boolean; options?: string[]; dyn?: 'bergers' | 'cellules' | 'assemblees' };
export type EntiteDef = { table: string; menu: 'cellules' | 'gc' | 'agenda' | 'culte'; nouveau: string; champs: ChampDef[] };

export const COMMUNES = ['Abobo', 'Adjamé', 'Anyama', 'Attécoubé', 'Bingerville', 'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Port-Bouët', 'Songon', 'Treichville', 'Yopougon', 'Autre'];
export const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const TYPES_ACTIVITE = ['Culte', 'Veillée de prière', 'Étude biblique', 'Convention', 'Séminaire', 'Retraite', 'Croisade', 'Réunion', 'Formation', 'Autre'];
export const CULTES = ['Culte du dimanche – 1er service', 'Culte du dimanche – 2e service', 'Culte de semaine', 'Veillée', 'Autre'];
export const POSTES = ['Entrée principale', 'Placement – nef', 'Placement – balcon', 'Parking', 'Accueil des nouveaux', 'Salle des enfants', 'Sécurité'];

export const ENTITES = {
  cellule: { table: 'cellule', menu: 'cellules', nouveau: 'Nouvelle cellule', champs: [
    { k: 'nom', label: 'Nom de la cellule', req: true }, { k: 'lieu', label: 'Lieu' }, { k: 'commune', label: 'Commune', type: 'select', options: COMMUNES },
    { k: 'famille_accueil', label: "Nom de la famille d'accueil" }, { k: 'berger_id', label: 'Berger', type: 'select', dyn: 'bergers' },
    { k: 'jour', label: 'Jour de rencontre', type: 'select', options: JOURS }, { k: 'infos', label: 'Informations', type: 'textarea' }] },
  rapport_cellule: { table: 'rapport_cellule', menu: 'cellules', nouveau: 'Rapport de cellule', champs: [
    { k: 'cellule_id', label: 'Cellule', type: 'select', dyn: 'cellules', req: true }, { k: 'date', label: 'Date de la rencontre', type: 'date', req: true },
    { k: 'presents', label: 'Présents', type: 'number' }, { k: 'nouveaux', label: 'Nouveaux', type: 'number' }, { k: 'offrande', label: 'Offrande (FCFA)', type: 'number' },
    { k: 'sujets', label: 'Sujets de prière et informations', type: 'textarea' }] },
  gc: { table: 'gc', menu: 'gc', nouveau: 'Nouveau groupe de communion', champs: [
    { k: 'nom', label: 'Nom du GC', req: true }, { k: 'tribu', label: 'Nom de la tribu' }] },
  gc_passage: { table: 'gc_passage', menu: 'gc', nouveau: 'Passage de service', champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'note', label: 'Service' }] },
  assemblee: { table: 'assemblee', menu: 'agenda', nouveau: 'Ajouter une église', champs: [
    { k: 'nom', label: "Nom de l'église ou de l'assemblée", req: true, full: true }, { k: 'ville', label: 'Ville' }, { k: 'commune', label: 'Commune ou quartier' },
    { k: 'pasteur', label: 'Pasteur responsable' }, { k: 'contact', label: 'Contact', type: 'tel' }] },
  evenement: { table: 'evenement', menu: 'agenda', nouveau: 'Programmer une activité', champs: [
    { k: 'titre', label: 'Titre', req: true, full: true }, { k: 'type', label: 'Type', type: 'select', options: TYPES_ACTIVITE, req: true },
    { k: 'assemblee_id', label: 'Église', type: 'select', dyn: 'assemblees' }, { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'heure', label: 'Heure', type: 'time' },
    { k: 'date_fin', label: 'Date de fin (si plusieurs jours)', type: 'date' }, { k: 'lieu', label: 'Lieu' }, { k: 'responsable', label: 'Responsable' },
    { k: 'frais', label: "Frais d'inscription (FCFA)", type: 'number' }, { k: 'description', label: 'Description', type: 'textarea' },
    { k: 'bilan', label: "Bilan (après l'activité)", type: 'textarea' }] },
  comptage: { table: 'comptage', menu: 'culte', nouveau: 'Saisir un comptage', champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'culte', label: 'Culte', type: 'select', options: CULTES, req: true },
    { k: 'hommes', label: 'Hommes', type: 'number' }, { k: 'femmes', label: 'Femmes', type: 'number' }, { k: 'enfants', label: 'Enfants', type: 'number' },
    { k: 'nouveaux', label: 'Nouveaux', type: 'number' }, { k: 'notes', label: 'Observations', type: 'textarea' }] },
  poste_accueil: { table: 'poste_accueil', menu: 'culte', nouveau: "Affecter un poste d'accueil", champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'poste', label: 'Poste', type: 'select', options: POSTES, req: true }, { k: 'agent', label: 'Agent', req: true },
    { k: 'contact', label: 'Contact', type: 'tel' }, { k: 'places', label: 'Places de parking occupées', type: 'number' },
    { k: 'observations', label: 'Observations ou incidents', type: 'textarea' }] },
} satisfies Record<string, EntiteDef>;

export type EntiteCle = keyof typeof ENTITES;

/** Lit et vérifie les champs d'un formulaire selon la définition : vides à null, nombres entiers, téléphone normalisé. */
export function lireChamps(def: EntiteDef, f: FormData): { ok: true; valeurs: Record<string, string | number | null> } | { ok: false; erreur: string } {
  const valeurs: Record<string, string | number | null> = {};
  const manque: string[] = [];
  for (const c of def.champs) {
    const brut = String(f.get(c.k) ?? '').trim();
    if (!brut) { valeurs[c.k] = null; if (c.req) manque.push(c.label); continue; }
    if (c.type === 'number') {
      const n = Number(brut.replace(/\s/g, ''));
      if (!Number.isFinite(n) || n < 0) return { ok: false, erreur: `${c.label} : saisissez un nombre positif.` };
      valeurs[c.k] = Math.round(n);
    } else valeurs[c.k] = c.type === 'tel' ? phone(brut) : brut;
  }
  if (manque.length) return { ok: false, erreur: 'Champ obligatoire : ' + manque.join(', ') + '.' };
  if (valeurs.date_fin && valeurs.date && String(valeurs.date_fin) < String(valeurs.date)) return { ok: false, erreur: 'La date de fin doit suivre la date de début.' };
  return { ok: true, valeurs };
}
