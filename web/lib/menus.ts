// Menus du test, repris de l'artefact (libellés, sous-menus, textes d'introduction et icônes).

export type Acces = 'r' | 'w';
export type Droits = Partial<Record<MenuId, Acces>>;
export type MenuId = 'accueil' | 'bergers' | 'adnh' | 'fideles' | 'admin';
export type MenuDef = { id: MenuId; t: string; section: string; vert: boolean; subs: [string, string][]; icone: string };

const VIE = "Structure de l'église";

export const MENUS: MenuDef[] = [
  { id: 'accueil', t: 'Accueil', section: '', vert: false, subs: [['vue', "Vue d'ensemble"]],
    icone: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>' },
  { id: 'bergers', t: 'Bergers', section: VIE, vert: true, subs: [['bergers', 'Bergers'], ['brebis', 'Brebis'], ['absences', 'Absences de la semaine']],
    icone: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M17 4v16M17 4c2.2 0 3.5 1.2 3.5 3S19.2 10 17 10"/>' },
  { id: 'adnh', t: 'ADNH', section: VIE, vert: true, subs: [['nouveaux', 'Nouveaux venus'], ['appels', 'Appels à faire'], ['integration', 'Intégration'], ['stats', 'Statistiques']],
    icone: '<circle cx="10" cy="8" r="3.2"/><path d="M4 20c0-3.3 2.7-6 6-6 1.5 0 2.8.5 3.9 1.4"/><path d="M18 14v6M15 17h6"/>' },
  { id: 'fideles', t: 'Fidèles', section: 'Fidèles et pastorale', vert: false, subs: [['liste', 'Fichier des fidèles'], ['anniversaires', 'Anniversaires']],
    icone: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M14 14.6c3.4-.6 6.5 1.6 7 5.4"/>' },
  { id: 'admin', t: 'Administration', section: 'Administration', vert: false, subs: [['utilisateurs', 'Utilisateurs'], ['roles', 'Rôles et accès']],
    icone: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>' },
];

export const LEADS: Record<MenuId, string> = {
  accueil: "Vue d'ensemble de l'EMCV selon votre rôle.",
  bergers: 'Chaque berger suit quinze (15) personnes : nom et prénoms, contacts de ses brebis et absences chaque semaine.',
  adnh: "Amis des nouveaux : accueil, suivi et intégration des nouveaux, avec les appels et l'orientation vers la tribu, le GC, la classe de formation et la cellule.",
  fideles: "Le fichier central des membres de l'église.",
  admin: "Comptes des testeurs, rôles et droits d'accès.",
};

export const menu = (id: string) => MENUS.find(m => m.id === id);

export function visibleMenus(droits: Droits): MenuDef[] {
  return MENUS.filter(m => !!droits[m.id]);
}
