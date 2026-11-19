// Menus du test, repris de l'artefact (libellés, sous-menus, textes d'introduction et icônes).

export type Acces = 'r' | 'w';
export type Droits = Partial<Record<MenuId, Acces>>;
export type MenuId = 'accueil' | 'bergers' | 'adnh' | 'fideles' | 'admin' | 'cellules' | 'gc' | 'agenda' | 'culte' | 'formations' | 'departements' | 'reunions' | 'organigramme';
export type MenuDef = { id: MenuId; t: string; section: string; vert: boolean; subs: [string, string][]; icone: string };

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
  { id: 'organigramme', t: 'Organigramme', section: VIE, vert: true, subs: [['annuaire', 'Annuaire des responsables'], ['structure', 'Structure']],
    icone: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>' },
  { id: 'fideles', t: 'Fidèles', section: 'Fidèles et pastorale', vert: false, subs: [['liste', 'Fichier des fidèles'], ['anniversaires', 'Anniversaires']],
    icone: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M14 14.6c3.4-.6 6.5 1.6 7 5.4"/>' },
  { id: 'culte', t: 'Jour de culte', section: 'Cultes et activités', vert: false, subs: [['comptage', 'Comptage des présences'], ['accueil', 'Accueil et parking']],
    icone: '<path d="M12 3v5M9.5 5.5h5"/><path d="M5 21V12l7-4 7 4v9"/><path d="M10 21v-4h4v4"/>' },
  { id: 'admin', t: 'Administration', section: 'Administration', vert: false, subs: [['utilisateurs', 'Utilisateurs'], ['roles', 'Rôles et accès']],
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
};

export const menu = (id: string) => MENUS.find(m => m.id === id);

export function visibleMenus(droits: Droits): MenuDef[] {
  return MENUS.filter(m => !!droits[m.id]);
}
