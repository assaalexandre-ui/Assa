// Menus du test, repris de l'artefact (libellés, sous-menus, textes d'introduction et icônes).

export type Acces = 'r' | 'w';
export type Droits = Partial<Record<MenuId, Acces>>;
export type MenuId = 'accueil' | 'bergers' | 'adnh' | 'fideles' | 'admin' | 'cellules' | 'gc' | 'agenda' | 'culte' | 'formations' | 'departements' | 'reunions' | 'organigramme' | 'priere' | 'enfants' | 'rdv' | 'evenements' | 'pilotage' | 'stats' | 'objectifs' | 'projets' | 'dons' | 'budget' | 'communication' | 'patrimoine' | 'evangelisation' | 'ceremonies' | 'reco' | 'rapports';
/** Sous-menu : [id, libellé, condition] ; condition = 'w' (réservé à qui modifie le menu) ou un menu requis en lecture. */
export type SousMenu = [string, string, ('w' | MenuId)?];
export type MenuDef = { id: MenuId; t: string; section: string; vert: boolean; subs: SousMenu[]; icone: string };

const VIE = "Structure de l'église";

export const MENUS: MenuDef[] = [
  { id: 'accueil', t: 'Accueil', section: '', vert: false, subs: [['vue', "Vue d'ensemble"]],
    icone: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>' },
  { id: 'cellules', t: 'Cellules', section: VIE, vert: true, subs: [['liste', 'Liste des cellules'], ['rapports', 'Rapports de cellule'], ['membres', 'Membres par cellule']],
    icone: '<path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-5h6v5"/>' },
  { id: 'bergers', t: 'Bergers', section: VIE, vert: true, subs: [['bergers', 'Bergers'], ['brebis', 'Brebis'], ['absences', 'Absences de la semaine']],
    icone: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M17 4v16M17 4c2.2 0 3.5 1.2 3.5 3S19.2 10 17 10"/>' },
  { id: 'adnh', t: 'ADNH', section: VIE, vert: true, subs: [['nouveaux', 'Nouveaux venus'], ['appels', 'Appels à faire'], ['integration', 'Intégration'], ['stats', 'Statistiques']],
    icone: '<circle cx="10" cy="8" r="3.2"/><path d="M4 20c0-3.3 2.7-6 6-6 1.5 0 2.8.5 3.9 1.4"/><path d="M18 14v6M15 17h6"/>' },
  { id: 'formations', t: 'Formations', section: VIE, vert: true, subs: [['classes', 'Classes'], ['sessions', 'Sessions'], ['parcours', 'Parcours des fidèles']],
    icone: '<path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5"/>' },
  { id: 'departements', t: 'Départements', section: VIE, vert: true, subs: [['services', "Services de l'église"], ['autres', 'Autres départements'], ['planning', 'Planning de service'], ['rapports', 'Rapports']],
    icone: '<rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>' },
  { id: 'gc', t: 'GC', section: VIE, vert: true, subs: [['groupes', 'Groupes de communion'], ['presences', 'Présences'], ['passages', 'Passages de service']],
    icone: '<circle cx="12" cy="7" r="2.6"/><circle cx="5.5" cy="15" r="2.6"/><circle cx="18.5" cy="15" r="2.6"/><path d="M9.8 8.8l-2.6 3.8M14.2 8.8l2.6 3.8M8.3 15h7.4"/>' },
  { id: 'reunions', t: 'Réunions', section: VIE, vert: true, subs: [['historique', 'Historique'], ['objets', 'Objets et points discutés'], ['decisions', 'Décisions'], ['taches', 'Tâches du conseil']],
    icone: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>' },
  { id: 'agenda', t: 'Programmation', section: VIE, vert: true, subs: [['calendrier', 'Calendrier annuel'], ['avenir', 'À venir'], ['historique', 'Historique'], ['eglises', 'Églises']],
    icone: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>' },
  { id: 'pilotage', t: 'Supervision', section: VIE, vert: true, subs: [['departements', 'Suivi des départements'], ['rapports', 'Rapports des départements']],
    icone: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' },
  { id: 'organigramme', t: 'Organigramme', section: VIE, vert: true, subs: [['annuaire', 'Annuaire des responsables'], ['structure', 'Structure']],
    icone: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>' },
  { id: 'stats', t: 'Statistiques', section: 'Tableau de bord', vert: false, subs: [['croissance', 'Croissance et présence'], ['integration', 'Intégration et suivi'], ['formations', 'Formations'], ['finances', 'Finances', 'dons']],
    icone: '<path d="M4 20V13M9.5 20V8M15 20v-5M20.5 20V5"/><path d="M3 20.5h18"/>' },
  { id: 'objectifs', t: 'Objectifs à atteindre', section: 'Tableau de bord', vert: false, subs: [['objectifs', 'Objectifs'], ['resultats', 'Résultats']],
    icone: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>' },
  { id: 'projets', t: 'Projets', section: 'Tableau de bord', vert: false, subs: [['projets', 'Projets'], ['actions', "Plan d'actions"], ['planning', 'Planning'], ['rappels', 'Rappels']],
    icone: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M7.5 9h6M7.5 13h9M7.5 17h4"/>' },
  { id: 'reco', t: 'Recommandations', section: 'Tableau de bord', vert: false, subs: [['performance', 'Amélioration de la performance'], ['problemes', 'Résoudre les problèmes'], ['objectifs', 'Atteindre les objectifs'], ['alternatives', "Propositions d'alternatives"]],
    icone: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z"/>' },
  { id: 'rapports', t: 'Rapports', section: 'Tableau de bord', vert: false, subs: [['generer', 'Rapport complet ou partiel']],
    icone: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>' },
  { id: 'fideles', t: 'Fidèles', section: 'Fidèles et pastorale', vert: false, subs: [['liste', 'Fichier des fidèles'], ['anniversaires', 'Anniversaires']],
    icone: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M14 14.6c3.4-.6 6.5 1.6 7 5.4"/>' },
  { id: 'priere', t: 'Requêtes de prière', section: 'Fidèles et pastorale', vert: false, subs: [['requetes', 'Requêtes'], ['temoignages', 'Témoignages']],
    icone: '<path d="M12 3v18M7 8h10"/>' },
  { id: 'enfants', t: 'Enfants', section: 'Fidèles et pastorale', vert: false, subs: [['inscrits', 'Enfants inscrits'], ['pointage', 'Pointage du dimanche']],
    icone: '<circle cx="12" cy="6.5" r="2.8"/><path d="M8 21v-5l-2-4 6 1 6-1-2 4v5"/>' },
  { id: 'rdv', t: 'Rendez-vous pastoraux', section: 'Fidèles et pastorale', vert: false, subs: [['avenir', 'À venir'], ['historique', 'Historique']],
    icone: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/>' },
  { id: 'culte', t: 'Jour de culte', section: 'Cultes et activités', vert: false, subs: [['comptage', 'Comptage des présences'], ['accueil', 'Accueil et parking']],
    icone: '<path d="M12 3v5M9.5 5.5h5"/><path d="M5 21V12l7-4 7 4v9"/><path d="M10 21v-4h4v4"/>' },
  { id: 'evenements', t: 'Événements', section: 'Cultes et activités', vert: false, subs: [['inscriptions', 'Inscriptions'], ['transport', 'Transport']],
    icone: '<path d="M4 20l3-12 10 5z"/><path d="M14 4l1 2M19 6l-2 1M20 11h-2"/>' },
  { id: 'evangelisation', t: 'Évangélisation', section: 'Cultes et activités', vert: false, subs: [['sorties', 'Sorties'], ['contacts', 'Contacts recueillis']],
    icone: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.7 5.4 3.7 8.5s-1.2 5.9-3.7 8.5c-2.5-2.6-3.7-5.4-3.7-8.5s1.2-5.9 3.7-8.5z"/>' },
  { id: 'ceremonies', t: 'Sacrements et cérémonies', section: 'Cultes et activités', vert: false, subs: [['baptemes', 'Baptêmes'], ['saintecene', 'Sainte-Cène'], ['mariages', 'Mariages et présentations'], ['consecrations', 'Consécrations'], ['obseques', 'Obsèques']],
    icone: '<path d="M7 21h10M9 21v-4h6v4M8 17h8l-1-6H9z"/><path d="M12 3v5M10 5h4"/>' },
  { id: 'dons', t: 'Dîmes et offrandes', section: 'Finances et ressources', vert: false, subs: [['encaissements', 'Encaissements'], ['fonds', 'Fonds et campagnes'], ['releve', 'Relevé par fidèle']],
    icone: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="14.5" r="1.5"/>' },
  { id: 'budget', t: 'Budget et dépenses', section: 'Finances et ressources', vert: false, subs: [['budget', 'Budget'], ['depenses', 'Dépenses'], ['etats', 'États financiers']],
    icone: '<path d="M5 21V4h14v17l-3.5-2-3.5 2-3.5-2z"/><path d="M9 9h6M9 13h6"/>' },
  { id: 'communication', t: 'Communication', section: 'Finances et ressources', vert: false, subs: [['annonces', 'Annonces'], ['message', 'Préparer un message', 'w']],
    icone: '<path d="M4 5h16v11H8l-4 4z"/>' },
  { id: 'patrimoine', t: 'Patrimoine', section: 'Finances et ressources', vert: false, subs: [['inventaire', 'Inventaire'], ['entretien', 'Entretien']],
    icone: '<path d="M3 8l9-5 9 5v11H3z"/><path d="M8 19v-6h8v6"/>' },
  { id: 'admin', t: 'Administration', section: 'Administration', vert: false, subs: [['utilisateurs', 'Utilisateurs'], ['roles', 'Rôles et accès'], ['eglise', "Paramètres de l'église"], ['journal', 'Dernières modifications']],
    icone: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>' },
];

export const LEADS: Record<MenuId, string> = {
  accueil: "Vue d'ensemble de l'EMCV selon votre rôle.",
  bergers: 'Chaque berger suit quinze (15) personnes : nom et prénoms, contacts de ses brebis et absences chaque semaine.',
  adnh: "Amis des nouveaux : accueil, suivi et intégration des nouveaux, avec les appels et l'orientation vers la tribu, le GC, la classe de formation et la cellule.",
  fideles: "Le fichier central des membres de l'église.",
  admin: "Comptes des testeurs, rôles et droits d'accès.",
  cellules: "Groupes de prière et de suivi, administrés par les bergers : famille d'accueil, nom, lieu et informations.",
  gc: 'Douze (12) groupes de communion : nom de la tribu, cinq (5) responsables associés, contacts, présences, absences et passage de service.',
  agenda: 'Historique et calendriers annuels de toutes les églises.',
  culte: 'Le jour du culte : comptage des présences, accueil et parking.',
  formations: 'Les classes de formation, leur date de départ et leur date de fin.',
  departements: "Les différents services au sein de l'église et les autres départements.",
  reunions: 'Historique des réunions, points et dimensions discutés, décisions, objets des réunions et tâches du conseil, faites ou pas.',
  organigramme: 'Qui dirige quoi, et comment le joindre.',
  priere: "Requêtes déposées par les fidèles et suivies par l'équipe d'intercession.",
  enfants: "Enfants de l'école du dimanche et pointage sécurisé avec code de récupération.",
  rdv: "Rendez-vous avec les pasteurs, visites à domicile et à l'hôpital.",
  pilotage: 'Suivi opérationnel des départements et rapports des responsables.',
  stats: "Les KPI de l'église, calculés automatiquement à partir des données saisies.",
  objectifs: "Les objectifs à atteindre fixés par l'administrateur, leur but et le résultat obtenu.",
  projets: "Planifier et suivre les projets : échéances, plan d'actions, budget, journal et rappels.",
  evangelisation: "Sorties d'évangélisation, personnes rencontrées et contacts à transmettre à l'ADNH.",
  ceremonies: 'Registre des baptêmes, Sainte-Cène, mariages, présentations, consécrations et obsèques.',
  reco: "Conseils calculés à partir des données de l'église : performance, problèmes, objectifs et alternatives.",
  rapports: "Rapport complet ou partiel de l'église sur une période, à lire à l'écran ou à télécharger en PDF.",
  dons: 'Dîmes, offrandes et campagnes, par fonds et par moyen de paiement.',
  budget: 'Budget annuel, dépenses et états financiers.',
  communication: 'Annonces pour les fidèles et messages à envoyer par WhatsApp ou SMS.',
  patrimoine: "Matériel de l'église et son entretien.",
  evenements: 'Inscriptions aux conventions, séminaires et retraites, avec paiement et transport.',
};

export const menu = (id: string) => MENUS.find(m => m.id === id);

export function visibleMenus(droits: Droits): MenuDef[] {
  return MENUS.filter(m => !!droits[m.id]);
}

/** Sous-menus accessibles : les réservés à l'écriture et ceux qui exigent un autre menu sont masqués sinon. */
export function sousMenus(m: MenuDef, droits: Droits): SousMenu[] {
  return m.subs.filter(([, , c]) => !c || (c === 'w' ? droits[m.id] === 'w' : !!droits[c]));
}
