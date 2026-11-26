// Définitions déclaratives des listes simples (comme ENT dans l'artefact) : table, menu, champs du formulaire.
import { phone } from './format';

export type TypeChamp = 'text' | 'date' | 'time' | 'month' | 'tel' | 'number' | 'textarea' | 'select' | 'check';
/** options : liste fixe, ou clé d'une liste dynamique fournie par la page (bergers, cellules, assemblées). */
export type ChampDef = { k: string; label: string; type?: TypeChamp; req?: boolean; full?: boolean; options?: (string | [string, string])[]; dyn?: Dyn; hint?: string };
export type Dyn = 'bergers' | 'cellules' | 'assemblees' | 'classes' | 'departements' | 'reunions' | 'evenements' | 'fonds' | 'fideles' | 'lignes' | 'projets' | 'articles';
export type EntiteDef = { table: string; menu: 'cellules' | 'gc' | 'agenda' | 'culte' | 'formations' | 'departements' | 'reunions' | 'organigramme' | 'priere' | 'enfants' | 'rdv' | 'evenements' | 'objectifs' | 'projets' | 'dons' | 'budget' | 'communication' | 'patrimoine' | 'evangelisation' | 'ceremonies'; nouveau: string; champs: ChampDef[] };

export const COMMUNES = ['Abobo', 'Adjamé', 'Anyama', 'Attécoubé', 'Bingerville', 'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Port-Bouët', 'Songon', 'Treichville', 'Yopougon', 'Autre'];
export const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const TYPES_ACTIVITE = ['Culte', 'Veillée de prière', 'Étude biblique', 'Convention', 'Séminaire', 'Retraite', 'Croisade', 'Réunion', 'Formation', 'Autre'];
export const CULTES = ['Culte du dimanche – 1er service', 'Culte du dimanche – 2e service', 'Culte de semaine', 'Veillée', 'Autre'];
export const INSTANCES = ['Conseil', 'Pasteurs', 'Responsables', 'Assemblée générale', 'Autre'];
export const STATUTS_TACHE = ['À faire', 'En cours', 'Terminée'];
export const STATUTS_RAPPORT = ['Soumis', 'Validé', 'À revoir'];
export const NIVEAUX = ['Direction', 'Pasteurs', 'Conseil', 'Responsables de ministère'];
export const VISIBILITES = ['Confidentielle', "Équipe d'intercession", 'Publique'];
export const SUIVIS_PRIERE = ['Reçue', 'En prière', 'Exaucée'];
export const AGES = ['0–3 ans', '4–6 ans', '7–9 ans', '10–12 ans', '13 ans et plus'];
export const TYPES_RDV = ['Bureau', 'Visite à domicile', "Visite à l'hôpital", 'Appel'];
export const STATUTS_RDV = ['Prévu', 'Fait', 'Reporté', 'Annulé'];
export const CANAUX = ['Espèces', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Wave', 'Virement', 'Chèque'];
// Mesures des objectifs : automatiques (calculées par la base) ou saisie manuelle. Reprises de l'artefact.
export const MESURES: [string, string][] = [
  ['manuel', 'Saisie manuelle'], ['fideles', 'Fidèles enregistrés (total)'], ['nouveaux', 'Nouveaux venus sur la période'],
  ['appeles', 'Nouveaux appelés sur la période'], ['integres', 'Nouveaux intégrés sur la période'], ['presence', 'Présence moyenne aux cultes sur la période'],
  ['suivis', 'Fidèles suivis par un berger'], ['formation', 'Fidèles en formation'], ['valides', 'Classes validées sur la période'],
  ['cellules', 'Nombre de cellules'], ['rapports', 'Rapports de cellule remis sur la période'],
];
export const MOBILE_MONEY = ['Orange Money', 'MTN MoMo', 'Moov Money', 'Wave'];
export const STATUTS_DON = ['Saisi', 'Validé'];
export const STATUTS_DEPENSE = ['Demandée', 'Validée', 'Payée', 'Refusée'];
export const CATEGORIES_ARTICLE = ['Sono et instruments', 'Mobilier', 'Informatique', 'Véhicule', 'Bâtiment', 'Autre'];
export const ETATS_ARTICLE = ['Bon', 'À réparer', 'Hors service'];
export const TYPES_CEREMONIE = ['Baptême', 'Sainte-Cène', 'Mariage', "Présentation d'enfant", 'Consécration', 'Obsèques'];
export const PRIORITES = ['Haute', 'Moyenne', 'Basse'];
export const STATUTS_PROJET = ['À lancer', 'En cours', 'En pause', 'Terminé'];
export const STATUTS_ACTION = ['À faire', 'En cours', 'Fait'];
export const TYPES_JOURNAL = ['Note', 'Décision', 'Difficulté', 'Réunion'];
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
  classe: { table: 'classe', menu: 'formations', nouveau: 'Classe', champs: [
    { k: 'nom', label: 'Nom de la classe', req: true, full: true }, { k: 'role', label: 'Rôle de la classe', type: 'textarea' }, { k: 'duree', label: 'Durée (semaines)', type: 'number' }] },
  session_formation: { table: 'session_formation', menu: 'formations', nouveau: 'Nouvelle session de formation', champs: [
    { k: 'classe', label: 'Classe', type: 'select', dyn: 'classes', req: true, full: true }, { k: 'date_debut', label: 'Date de départ', type: 'date', req: true },
    { k: 'date_fin', label: 'Date de fin de formation', type: 'date', req: true }, { k: 'formateur', label: 'Formateur' }, { k: 'lieu', label: 'Lieu et horaire' }] },
  planning_service: { table: 'planning_service', menu: 'departements', nouveau: 'Nouveau créneau de service', champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'activite', label: 'Culte ou activité', req: true }, { k: 'departement_id', label: 'Département', type: 'select', dyn: 'departements', req: true },
    { k: 'poste', label: 'Poste' }, { k: 'personne', label: 'Personne' }, { k: 'contact', label: 'Contact', type: 'tel' }, { k: 'confirme', label: 'Présence confirmée', type: 'check' }] },
  rapport_departement: { table: 'rapport_departement', menu: 'departements', nouveau: 'Nouveau rapport de département', champs: [
    { k: 'departement_id', label: 'Département', type: 'select', dyn: 'departements', req: true }, { k: 'periode', label: 'Mois', type: 'month', req: true },
    { k: 'activites', label: 'Activités réalisées', type: 'textarea' }, { k: 'resultats', label: 'Résultats', type: 'textarea' }, { k: 'difficultes', label: 'Difficultés et besoins', type: 'textarea' },
    { k: 'effectif', label: 'Membres actifs', type: 'number' }, { k: 'statut', label: 'Statut', type: 'select', options: STATUTS_RAPPORT }] },
  reunion: { table: 'reunion', menu: 'reunions', nouveau: 'Nouvelle réunion', champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'instance', label: 'Instance', type: 'select', options: INSTANCES, req: true },
    { k: 'assemblee_id', label: 'Église', type: 'select', dyn: 'assemblees' }, { k: 'lieu', label: 'Lieu' }, { k: 'objet', label: 'Objet de la réunion', req: true, full: true },
    { k: 'presents', label: 'Participants', type: 'textarea' }, { k: 'discussions', label: 'Points et dimensions discutés', type: 'textarea', hint: 'Un point par ligne' },
    { k: 'decisions', label: 'Décisions', type: 'textarea', hint: 'Une décision par ligne' }] },
  tache: { table: 'tache', menu: 'reunions', nouveau: 'Nouvelle tâche du conseil', champs: [
    { k: 'titre', label: 'Tâche', req: true, full: true }, { k: 'responsable', label: 'Responsable', req: true }, { k: 'echeance', label: 'Échéance', type: 'date' },
    { k: 'statut', label: 'Statut', type: 'select', options: STATUTS_TACHE, req: true }, { k: 'reunion_id', label: "Réunion d'origine", type: 'select', dyn: 'reunions', full: true },
    { k: 'notes', label: 'Suivi', type: 'textarea' }] },
  responsable: { table: 'responsable', menu: 'organigramme', nouveau: 'Ajouter un responsable', champs: [
    { k: 'fonction', label: 'Fonction', req: true }, { k: 'nom', label: 'Nom et prénoms', req: true }, { k: 'contact', label: 'Téléphone', type: 'tel' },
    { k: 'whatsapp', label: 'WhatsApp', type: 'tel' }, { k: 'niveau', label: 'Niveau', type: 'select', options: NIVEAUX }, { k: 'ordre', label: "Ordre d'affichage", type: 'number' }] },
  priere: { table: 'priere', menu: 'priere', nouveau: 'Déposer une requête', champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'demandeur', label: 'Demandeur' }, { k: 'contact', label: 'Contact', type: 'tel' },
    { k: 'visibilite', label: 'Visibilité', type: 'select', options: VISIBILITES, req: true }, { k: 'sujet', label: 'Sujet de prière', type: 'textarea', req: true },
    { k: 'statut', label: 'Suivi', type: 'select', options: SUIVIS_PRIERE }, { k: 'temoignage', label: 'Témoignage', type: 'textarea' }] },
  enfant: { table: 'enfant', menu: 'enfants', nouveau: 'Inscrire un enfant', champs: [
    { k: 'nom', label: "Nom et prénoms de l'enfant", req: true }, { k: 'date_naissance', label: 'Date de naissance', type: 'date' },
    { k: 'groupe', label: "Classe d'âge", type: 'select', options: AGES }, { k: 'parent', label: 'Parent ou tuteur', req: true }, { k: 'contact', label: 'Contact du parent', type: 'tel' },
    { k: 'code', label: 'Code de récupération', hint: 'Remis au parent pour la sortie' }, { k: 'notes', label: 'Allergies ou remarques', type: 'textarea' }] },
  rdv: { table: 'rdv', menu: 'rdv', nouveau: 'Nouveau rendez-vous', champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'heure', label: 'Heure', type: 'time' }, { k: 'personne', label: 'Fidèle ou famille', req: true },
    { k: 'contact', label: 'Contact', type: 'tel' }, { k: 'type', label: 'Type', type: 'select', options: TYPES_RDV }, { k: 'pasteur', label: 'Pasteur' },
    { k: 'motif', label: 'Motif', full: true }, { k: 'statut', label: 'Statut', type: 'select', options: STATUTS_RDV }, { k: 'notes', label: 'Notes pastorales', type: 'textarea' }] },
  inscription_evenement: { table: 'inscription_evenement', menu: 'evenements', nouveau: 'Inscrire une personne', champs: [
    { k: 'evenement_id', label: 'Événement', type: 'select', dyn: 'evenements', req: true, full: true }, { k: 'nom', label: 'Nom et prénoms', req: true },
    { k: 'contact', label: 'Contact', type: 'tel' }, { k: 'montant', label: 'Montant payé (FCFA)', type: 'number' }, { k: 'canal', label: 'Moyen de paiement', type: 'select', options: CANAUX },
    { k: 'car', label: 'Car / transport' }, { k: 'depart', label: 'Point de départ', type: 'select', options: COMMUNES }] },
  objectif: { table: 'objectif', menu: 'objectifs', nouveau: 'Fixer un objectif', champs: [
    { k: 'libelle', label: 'Objectif à atteindre', req: true, full: true }, { k: 'but', label: 'But (pourquoi cet objectif)', type: 'textarea' },
    { k: 'mesure', label: 'Mesure du résultat', type: 'select', options: MESURES, req: true, full: true, hint: 'Choisissez une mesure automatique, ou « Saisie manuelle » pour mettre le résultat à jour vous-même.' },
    { k: 'cible', label: 'Cible à atteindre', type: 'number', req: true }, { k: 'realise', label: 'Résultat (saisie manuelle uniquement)', type: 'number' },
    { k: 'date_debut', label: 'Début de la période', type: 'date' }, { k: 'date_fin', label: 'Échéance', type: 'date', req: true },
    { k: 'departement_id', label: 'Département concerné', type: 'select', dyn: 'departements' }, { k: 'responsable', label: 'Responsable du suivi' }] },
  projet: { table: 'projet', menu: 'projets', nouveau: 'Nouveau projet', champs: [
    { k: 'nom', label: 'Nom du projet', req: true, full: true }, { k: 'description', label: 'Description et objectif', type: 'textarea' },
    { k: 'responsable', label: 'Responsable', req: true }, { k: 'departement_id', label: 'Département', type: 'select', dyn: 'departements' },
    { k: 'date_debut', label: 'Date de début', type: 'date', req: true }, { k: 'echeance', label: 'Échéance', type: 'date', req: true },
    { k: 'priorite', label: 'Priorité', type: 'select', options: PRIORITES, req: true }, { k: 'statut', label: 'Statut', type: 'select', options: STATUTS_PROJET, req: true },
    { k: 'budget', label: 'Budget prévu (FCFA)', type: 'number' }] },
  fonds: { table: 'fonds', menu: 'dons', nouveau: 'Nouveau fonds', champs: [
    { k: 'nom', label: 'Nom', req: true }, { k: 'type', label: 'Type', type: 'select', options: ['Fonds permanent', 'Campagne'], req: true },
    { k: 'objectif', label: 'Objectif (FCFA)', type: 'number' }, { k: 'fin', label: 'Date de fin de campagne', type: 'date' }, { k: 'description', label: 'Description', type: 'textarea' }] },
  don: { table: 'don', menu: 'dons', nouveau: 'Saisir un encaissement', champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'fonds_id', label: 'Fonds', type: 'select', dyn: 'fonds', req: true },
    { k: 'montant', label: 'Montant (FCFA)', type: 'number', req: true }, { k: 'canal', label: 'Moyen', type: 'select', options: CANAUX, req: true },
    { k: 'fidele_id', label: 'Fidèle (laisser vide pour une collecte)', type: 'select', dyn: 'fideles', full: true }, { k: 'reference', label: 'Référence de la transaction' },
    { k: 'statut', label: 'Statut', type: 'select', options: STATUTS_DON, hint: 'La validation est faite par une autre personne que celle qui a saisi.' }, { k: 'notes', label: 'Notes', type: 'textarea' }] },
  ligne_budget: { table: 'ligne_budget', menu: 'budget', nouveau: 'Nouvelle ligne de budget', champs: [
    { k: 'annee', label: 'Année', type: 'number', req: true }, { k: 'poste', label: 'Poste', req: true },
    { k: 'departement_id', label: 'Département', type: 'select', dyn: 'departements' }, { k: 'montant', label: 'Montant prévu (FCFA)', type: 'number', req: true }] },
  depense: { table: 'depense', menu: 'budget', nouveau: 'Nouvelle dépense', champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'objet', label: 'Objet', req: true }, { k: 'montant', label: 'Montant (FCFA)', type: 'number', req: true },
    { k: 'ligne_budget_id', label: 'Ligne de budget', type: 'select', dyn: 'lignes' }, { k: 'projet_id', label: 'Projet', type: 'select', dyn: 'projets' },
    { k: 'demandeur', label: 'Demandeur' }, { k: 'beneficiaire', label: 'Bénéficiaire' }, { k: 'canal', label: 'Moyen de paiement', type: 'select', options: CANAUX },
    { k: 'statut', label: 'Statut', type: 'select', options: STATUTS_DEPENSE, req: true, hint: 'Une autre personne que celle qui a saisi la dépense la valide ou la refuse.' },
    { k: 'notes', label: 'Justificatif et notes', type: 'textarea' }] },
  annonce: { table: 'annonce', menu: 'communication', nouveau: 'Nouvelle annonce', champs: [
    { k: 'titre', label: 'Titre', req: true, full: true }, { k: 'date', label: 'Date de publication', type: 'date', req: true }, { k: 'jusquau', label: "Visible jusqu'au", type: 'date' },
    { k: 'texte', label: 'Texte', type: 'textarea', req: true }, { k: 'publie', label: 'Visible par tous les fidèles', type: 'check' }] },
  article: { table: 'article', menu: 'patrimoine', nouveau: 'Nouvel article', champs: [
    { k: 'article', label: 'Article', req: true, full: true }, { k: 'categorie', label: 'Catégorie', type: 'select', options: CATEGORIES_ARTICLE },
    { k: 'quantite', label: 'Quantité', type: 'number' }, { k: 'affectation', label: 'Affecté à' }, { k: 'etat', label: 'État', type: 'select', options: ETATS_ARTICLE },
    { k: 'valeur', label: 'Valeur estimée (FCFA)', type: 'number' }, { k: 'date_achat', label: "Date d'acquisition", type: 'date' }, { k: 'notes', label: 'Notes', type: 'textarea' }] },
  entretien: { table: 'entretien', menu: 'patrimoine', nouveau: 'Nouvelle intervention', champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'article_id', label: 'Article', type: 'select', dyn: 'articles', req: true },
    { k: 'intervention', label: 'Intervention', req: true, full: true }, { k: 'prestataire', label: 'Prestataire' }, { k: 'cout', label: 'Coût (FCFA)', type: 'number' },
    { k: 'prochaine', label: 'Prochaine échéance', type: 'date' }] },
  sortie: { table: 'sortie', menu: 'evangelisation', nouveau: "Nouvelle sortie d'évangélisation", champs: [
    { k: 'date', label: 'Date', type: 'date', req: true }, { k: 'lieu', label: 'Lieu', req: true }, { k: 'commune', label: 'Commune', type: 'select', options: COMMUNES },
    { k: 'equipe', label: 'Équipe' }, { k: 'participants', label: 'Participants', type: 'number' }, { k: 'rencontres', label: 'Personnes rencontrées', type: 'number' },
    { k: 'contacts', label: 'Contacts recueillis', type: 'textarea', hint: 'Une personne par ligne : nom – téléphone' }, { k: 'bilan', label: 'Bilan', type: 'textarea' }] },
  ceremonie: { table: 'ceremonie', menu: 'ceremonies', nouveau: 'Ajouter au registre', champs: [
    { k: 'type', label: 'Type', type: 'select', options: TYPES_CEREMONIE, req: true }, { k: 'date', label: 'Date', type: 'date', req: true },
    { k: 'personnes', label: 'Personne(s) concernée(s)', req: true, full: true }, { k: 'officiant', label: 'Officiant' }, { k: 'lieu', label: 'Lieu' },
    { k: 'notes', label: 'Notes', type: 'textarea' }] },
} satisfies Record<string, EntiteDef>;

export type EntiteCle = keyof typeof ENTITES;

/** Lit et vérifie les champs d'un formulaire selon la définition : vides à null, nombres entiers, téléphone normalisé. */
export function lireChamps(def: EntiteDef, f: FormData): { ok: true; valeurs: Record<string, string | number | boolean | null> } | { ok: false; erreur: string } {
  const valeurs: Record<string, string | number | boolean | null> = {};
  const manque: string[] = [];
  for (const c of def.champs) {
    if (c.type === 'check') { valeurs[c.k] = f.get(c.k) === 'on'; continue; }
    const brut = String(f.get(c.k) ?? '').trim();
    if (!brut) { valeurs[c.k] = null; if (c.req) manque.push(c.label); continue; }
    if (c.type === 'number') {
      const n = Number(brut.replace(/\s/g, ''));
      if (!Number.isFinite(n) || n < 0) return { ok: false, erreur: `${c.label} : saisissez un nombre positif.` };
      valeurs[c.k] = Math.round(n);
    } else valeurs[c.k] = c.type === 'tel' ? phone(brut) : brut;
  }
  if (manque.length) return { ok: false, erreur: 'Champ obligatoire : ' + manque.join(', ') + '.' };
  const debut = valeurs.date ?? valeurs.date_debut;
  if (valeurs.date_fin && debut && String(valeurs.date_fin) < String(debut)) return { ok: false, erreur: 'La date de fin doit suivre la date de début.' };
  if (valeurs.jusquau && valeurs.date && String(valeurs.jusquau) < String(valeurs.date)) return { ok: false, erreur: 'La date de fin de visibilité doit suivre la date de publication.' };
  if (def.champs.some(c => c.k === 'montant' && c.req) && valeurs.montant === 0 && (def.table === 'don' || def.table === 'depense')) return { ok: false, erreur: 'Montant : saisissez un montant supérieur à zéro.' };
  if (valeurs.echeance && valeurs.date_debut && String(valeurs.echeance) < String(valeurs.date_debut)) return { ok: false, erreur: "L'échéance doit suivre la date de début." };
  return { ok: true, valeurs };
}
