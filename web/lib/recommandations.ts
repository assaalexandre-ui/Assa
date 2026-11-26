// Règles automatiques des recommandations, reprises de l'artefact (recoRules).
// Elles travaillent sur le résumé chiffré renvoyé par la fonction de base donnees_recommandations().

export type Theme = 'performance' | 'problemes' | 'objectifs' | 'alternatives';
export type Niveau = 'haute' | 'moyenne' | 'conseil';
export type Reco = { niveau: Niveau; domaine: string; constat: string; conseil: string; lien: string };

export const THEMES: Record<Theme, string> = {
  performance: 'Amélioration de la performance',
  problemes: 'Résoudre les problèmes',
  objectifs: 'Atteindre les objectifs',
  alternatives: "Propositions d'alternatives",
};
export const NIVEAUX: Record<Niveau, [string, 'b' | 'w' | 'a']> = { haute: ['Priorité haute', 'b'], moyenne: ['À surveiller', 'w'], conseil: ['Conseil', 'a'] };

export type Projet = { nom: string; statut: string; echeance: string; budget: number | null; depense: number; actions: number; faites: number };
export type Objectif = { libelle: string; mesure: string; cible: number; valeur: number; debut: string | null; fin: string; statut: string };
export type Donnees = {
  jour: string;
  presence: { recents: number; nbRecents: number; precedents: number; nbPrecedents: number; total: number };
  nouveaux: number; integres: number; jamaisAppeles72h: number; injoignables: number;
  bergers: number; relevesSemaine: number; semaine: string; sansBerger: number; bergersSurcharges: number;
  cellulesSansRapport: string[]; departements: number; departementsSansRapport: number; departementsVides: number;
  inscritsAbsents: number; tachesEnRetard: string[]; actionsEnRetard: number; projets: Projet[];
  gcIncomplets: number; articlesAReparer: number; entretiensDepasses: number; objectifs: Objectif[];
  finances: null | { encaisseMois: number; moyenne3Mois: number; encaisseAnnee: number; mobileAnnee: number; donsAnnee: number; donsNonValides: number; depensesEnAttente: number; lignesDepassees: number };
};

const nombre = (v: number) => Math.round(v).toLocaleString('fr-FR').replace(/[  ]/g, ' ');
const argent = (v: number) => nombre(v) + ' F';
const s = (n: number, un = '', plusieurs = 's') => (n > 1 ? plusieurs : un);
const frDate = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); };
const jours = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 864e5;

const CONSEILS_MESURE: Record<string, string> = {
  nouveaux: "Programmer des sorties d'évangélisation régulières et un culte d'invitation par trimestre.",
  integres: "Raccourcir le délai entre l'arrivée et l'orientation en cellule ; suivre chaque nouveau jusqu'à la classe 1.",
  appeles: "Planifier une séance d'appels ADNH chaque lundi soir.",
  presence: "Relancer les absents par les bergers et soigner la qualité de l'accueil.",
  suivis: 'Nommer des bergers supplémentaires parmi les fidèles de la classe 4.',
  formation: 'Ouvrir une nouvelle session de classe 1 et y inscrire les nouveaux intégrés.',
  valides: "Suivre l'assiduité et organiser des rattrapages pour les inscrits en difficulté.",
  cellules: 'Ouvrir des cellules dans les communes où vivent beaucoup de fidèles sans cellule.',
  rapports: 'Rendre le rapport de cellule hebdomadaire obligatoire et le vérifier en réunion des bergers.',
  dons: 'Communiquer sur les projets financés et faciliter le don par Mobile Money.',
  fideles: 'Mettre à jour le fichier des fidèles et enregistrer chaque nouveau intégré.',
  manuel: 'Mettre à jour le résultat régulièrement et désigner un responsable du suivi.',
};

/** Toutes les recommandations, rangées par thème puis par niveau (haute, à surveiller, conseil). */
export function recommandations(d: Donnees): Record<Theme, Reco[]> {
  const out: Record<Theme, Reco[]> = { performance: [], problemes: [], objectifs: [], alternatives: [] };
  const add = (t: Theme, niveau: Niveau, domaine: string, constat: string, conseil: string, lien: string) => out[t].push({ niveau, domaine, constat, conseil, lien });
  const t = d.jour;
  const p = d.presence;

  /* ---- Performance ---- */
  if (p.nbRecents >= 2 && p.nbPrecedents >= 2) {
    const a = Math.round(p.recents), b = Math.round(p.precedents), v = Math.round((a - b) / b * 100);
    if (v <= -5) add('performance', 'haute', 'Présence', `La présence moyenne baisse de ${-v} % : ${a} sur les 4 derniers cultes contre ${b} auparavant.`, "Faire relancer les absents par les bergers cette semaine, annoncer le programme du mois sur WhatsApp et vérifier l'accueil et le parking aux derniers cultes.", '/culte/comptage');
    else if (v >= 5) add('performance', 'conseil', 'Présence', `La présence progresse de ${v} % (${a} contre ${b}).`, "Renforcer l'accueil et le placement pour absorber la hausse et s'assurer que chaque nouveau est bien enregistré dans l'ADNH.", '/culte/accueil');
  } else if (!p.total) {
    add('performance', 'moyenne', 'Présence', "Aucun comptage des présences n'a été saisi.", "Faire saisir le comptage à chaque culte par l'équipe d'accueil : c'est la base de tous les indicateurs de croissance.", '/culte/comptage');
  }
  if (d.nouveaux >= 5 && d.integres / d.nouveaux < 0.5) add('performance', 'haute', 'Intégration', `Seulement ${Math.round(d.integres / d.nouveaux * 100)} % des nouveaux sont intégrés (${d.integres} sur ${d.nouveaux}).`, "Fixer un délai : appel sous 72 h, visite sous 2 semaines, orientation vers une cellule, un GC et la classe 1 dans le mois. Confier chaque nouveau à un membre de l'ADNH nommément.", '/adnh/integration');
  if (d.bergers) {
    const r = Math.round(d.relevesSemaine / d.bergers * 100);
    if (r < 80) add('performance', r < 50 ? 'haute' : 'moyenne', 'Suivi pastoral', `${r} % des bergers ont relevé les absences cette semaine ${Number(d.semaine.split('-W')[1])} (${d.relevesSemaine} sur ${d.bergers}).`, 'Rappeler aux bergers de faire le relevé chaque dimanche soir et faire un point mensuel avec ceux qui ne le font pas.', '/bergers/absences');
  }
  if (d.sansBerger) add('performance', d.sansBerger > 15 ? 'haute' : 'moyenne', 'Suivi pastoral', `${d.sansBerger} fidèle${d.sansBerger > 1 ? "s n'ont" : " n'a"} pas de berger.`, `Répartir ces fidèles entre les bergers qui ont de la place ; il faudrait environ ${Math.ceil(d.sansBerger / 15)} berger(s) de plus.`, '/bergers/brebis');
  const cs = d.cellulesSansRapport;
  if (cs.length) add('performance', 'moyenne', 'Cellules', `${cs.length} cellule${s(cs.length)} sans rapport depuis 2 semaines : ${cs.slice(0, 5).join(', ')}${cs.length > 5 ? '…' : ''}.`, 'Vérifier avec les bergers si ces cellules se réunissent toujours, et rendre le rapport hebdomadaire obligatoire.', '/cellules/rapports');
  if (d.departements && d.departementsSansRapport) add('performance', 'conseil', 'Départements', `${d.departementsSansRapport} département${s(d.departementsSansRapport)} sur ${d.departements} sans rapport ce mois-ci.`, 'Demander à chaque responsable un rapport court avant le 5 du mois suivant, à présenter en réunion du conseil.', '/pilotage/departements');
  if (d.inscritsAbsents) add('performance', 'moyenne', 'Formations', `${d.inscritsAbsents} inscrit${d.inscritsAbsents > 1 ? 's ont' : ' a'} 3 absences ou plus dans une formation en cours.`, 'Faire appeler ces fidèles par leur formateur ou leur berger et proposer un rattrapage avant la fin de la session.', '/formations/sessions');
  const f = d.finances;
  if (f) {
    const avance = Number(t.slice(8, 10)) / 30;
    if (f.moyenne3Mois > 0 && avance > 0.6 && f.encaisseMois < f.moyenne3Mois * 0.85) add('performance', 'moyenne', 'Finances', `Les encaissements du mois (${argent(f.encaisseMois)}) sont en dessous de la moyenne des 3 mois précédents (${argent(f.moyenne3Mois)}).`, 'Rappeler les moyens de don Mobile Money lors des annonces et vérifier que toutes les offrandes du culte ont été saisies.', '/dons/encaissements');
    if (f.donsAnnee >= 10 && f.mobileAnnee / Math.max(1, f.encaisseAnnee) < 0.3) add('performance', 'conseil', 'Finances', `Le Mobile Money ne représente que ${Math.round(f.mobileAnnee / f.encaisseAnnee * 100)} % des encaissements de l'année.`, "Afficher les numéros Wave et Orange Money à l'entrée et dans les annonces : les dons à distance réduisent les manques les semaines d'absence.", '/communication/annonces');
  }

  /* ---- Problèmes ---- */
  if (d.jamaisAppeles72h) add('problemes', 'haute', 'ADNH', `${d.jamaisAppeles72h} nouveau${s(d.jamaisAppeles72h, '', 'x')} venu${s(d.jamaisAppeles72h)} depuis plus de 72 h sans aucun appel.`, "Répartir immédiatement ces appels entre les membres de l'ADNH et les noter dans l'application le jour même.", '/adnh/appels');
  const tr = d.tachesEnRetard;
  if (tr.length) add('problemes', 'haute', 'Conseil', `${tr.length} tâche${s(tr.length)} du conseil en retard : ${tr.slice(0, 3).join(', ')}${tr.length > 3 ? '…' : ''}.`, "Faire un point avec chaque responsable : fixer une nouvelle date réaliste ou réattribuer la tâche, et l'inscrire à l'ordre du jour de la prochaine réunion.", '/reunions/taches');
  if (d.actionsEnRetard) add('problemes', 'haute', 'Projets', `${d.actionsEnRetard} action${s(d.actionsEnRetard)} de projet en retard.`, "Revoir le plan d'actions avec les responsables : découper les actions trop grosses, donner une date ferme et noter les difficultés dans le journal du projet.", '/projets/actions');
  const avancement = (x: Projet) => (x.actions ? Math.round(x.faites / x.actions * 100) : x.statut === 'Terminé' ? 100 : 0);
  d.projets.filter(x => x.statut !== 'Terminé' && x.echeance < t).forEach(x => add('problemes', 'haute', 'Projets', `Le projet « ${x.nom} » a dépassé son échéance (${frDate(x.echeance)}) à ${avancement(x)} %.`, 'Décider en conseil : nouvelle échéance, réduction du périmètre ou mise en pause officielle.', '/projets/projets'));
  d.projets.filter(x => x.budget && x.depense > x.budget).forEach(x => add('problemes', 'haute', 'Projets', `Le projet « ${x.nom} » dépasse son budget : ${argent(x.depense)} dépensés pour ${argent(x.budget!)} prévus.`, "Geler les nouvelles dépenses du projet jusqu'à validation d'un budget révisé par le conseil.", '/projets/projets'));
  if (f && f.depensesEnAttente) add('problemes', 'moyenne', 'Finances', `${f.depensesEnAttente} demande${s(f.depensesEnAttente)} de dépense en attente depuis plus d'une semaine.`, 'Fixer un jour fixe de validation des dépenses (par exemple chaque lundi) avec le trésorier et le pasteur principal.', '/budget/depenses');
  if (f && f.donsNonValides > 20) add('problemes', 'moyenne', 'Finances', `${f.donsNonValides} encaissements ne sont pas encore validés.`, "Faire valider les encaissements par une deuxième personne chaque semaine : c'est la garantie de transparence des comptes.", '/dons/encaissements');
  if (d.gcIncomplets) add('problemes', 'conseil', 'GC', `${d.gcIncomplets} groupe${s(d.gcIncomplets)} de communion sans nom de tribu ou avec moins de 5 responsables.`, 'Compléter les fiches GC : nom de la tribu et 5 responsables associés, comme prévu.', '/gc/groupes');
  if (d.articlesAReparer || d.entretiensDepasses) add('problemes', 'moyenne', 'Patrimoine', `${d.articlesAReparer} article${s(d.articlesAReparer)} à réparer et ${d.entretiensDepasses} entretien${s(d.entretiensDepasses)} dépassé${s(d.entretiensDepasses)}.`, 'Programmer les réparations avant le prochain grand événement et rattacher les coûts à une ligne de budget.', '/patrimoine/inventaire');
  if (d.bergersSurcharges) add('problemes', 'moyenne', 'Suivi pastoral', `${d.bergersSurcharges} berger${d.bergersSurcharges > 1 ? 's suivent' : ' suit'} plus de 15 personnes.`, 'Réduire leur charge à 15 brebis : un berger surchargé ne peut plus suivre correctement.', '/bergers/bergers');

  /* ---- Objectifs ---- */
  if (!d.objectifs.length) add('objectifs', 'moyenne', 'Objectifs', "Aucun objectif n'est défini.", "Fixer 3 à 5 objectifs annuels mesurables (intégration, présence, formation, finances) avec une mesure automatique pour suivre l'avancement sans saisie.", '/objectifs/objectifs');
  d.objectifs.forEach(o => {
    const fmt = (v: number) => (o.mesure === 'dons' ? argent(v) : nombre(v));
    const v = Number(o.valeur) || 0, c = Number(o.cible) || 0;
    if (o.statut === 'Atteint') { add('objectifs', 'conseil', 'Objectifs', `« ${o.libelle} » est atteint : ${fmt(v)} pour une cible de ${fmt(c)}.`, "Féliciter l'équipe et envisager de relever la cible ou de fixer l'objectif suivant.", '/objectifs/resultats'); return; }
    if (o.statut === 'Non atteint') { add('objectifs', 'haute', 'Objectifs', `« ${o.libelle} » n'a pas été atteint à l'échéance : ${fmt(v)} sur ${fmt(c)}.`, "Analyser les causes en conseil, puis reconduire l'objectif avec une cible réaliste et un plan d'actions dans Projets.", '/objectifs/resultats'); return; }
    const debut = o.debut || o.fin.slice(0, 4) + '-01-01';
    if (!c) return;
    const total = Math.max(1, jours(debut, o.fin)), ecoule = Math.min(1, Math.max(0, jours(debut, t) / total)), prog = v / c;
    const reste = Math.max(0, c - v), moisRestants = Math.max(1, Math.ceil(jours(t, o.fin) / 30));
    if (prog < ecoule - 0.1) add('objectifs', prog < ecoule - 0.3 ? 'haute' : 'moyenne', 'Objectifs', `« ${o.libelle} » est en retard sur le rythme : ${Math.round(prog * 100)} % atteint alors que ${Math.round(ecoule * 100)} % de la période est écoulée.`, `Il reste ${fmt(reste)} à obtenir en ${moisRestants} mois, soit environ ${fmt(Math.ceil(reste / moisRestants))} par mois. ${CONSEILS_MESURE[o.mesure] ?? CONSEILS_MESURE.manuel}`, '/objectifs/objectifs');
    else add('objectifs', 'conseil', 'Objectifs', `« ${o.libelle} » avance au bon rythme : ${Math.round(prog * 100)} % pour ${Math.round(ecoule * 100)} % du temps écoulé.`, "Maintenir l'effort et vérifier l'avancement chaque mois en réunion.", '/objectifs/objectifs');
  });

  /* ---- Alternatives ---- */
  if (d.injoignables) add('alternatives', 'moyenne', 'ADNH', `${d.injoignables} nouveau${s(d.injoignables, '', 'x')} injoignable${s(d.injoignables)} au téléphone après 2 tentatives.`, 'Alternative : envoyer un message WhatsApp de bienvenue, demander au berger du quartier une visite, ou accueillir la personne en personne au prochain culte.', '/adnh/appels');
  if (d.bergersSurcharges || d.sansBerger > 15) add('alternatives', 'moyenne', 'Suivi pastoral', 'Le nombre de bergers ne suffit pas pour suivre tous les fidèles.', 'Alternative : nommer des bergers assistants parmi les fidèles de la classe 4 (Départ / bergers), ou confier temporairement le suivi aux responsables de GC.', '/formations/parcours');
  d.projets.filter(x => x.statut !== 'Terminé' && ((x.budget && x.depense > x.budget * 0.9) || x.echeance < t)).forEach(x => add('alternatives', 'moyenne', 'Projets', `Le projet « ${x.nom} » est sous tension (délai ou budget).`, 'Alternatives : réaliser le projet par phases, lancer une campagne de dons dédiée dans « Fonds et campagnes », solliciter des dons en nature ou du bénévolat des départements.', '/dons/fonds'));
  if (p.nbRecents >= 2 && p.nbPrecedents >= 2 && p.recents < p.precedents * 0.95) add('alternatives', 'conseil', 'Présence', 'La présence baisse.', 'Alternatives : diffuser le culte en direct pour garder le lien, ouvrir un second service si la salle est pleine aux heures de pointe, ou organiser des cultes de quartier avec les cellules.', '/agenda/calendrier');
  if (cs.length) add('alternatives', 'conseil', 'Cellules', 'Certaines cellules ne remettent pas leur rapport.', "Alternative : faire envoyer le rapport par un simple message WhatsApp au secrétariat, qui le saisit, au lieu d'exiger la saisie par le berger.", '/cellules/rapports');
  if (f && (f.depensesEnAttente || f.lignesDepassees)) add('alternatives', 'moyenne', 'Finances', 'Des lignes de budget sont dépassées ou des dépenses attendent.', 'Alternatives : réaffecter une ligne sous-consommée, reporter les dépenses non urgentes au mois suivant, ou demander au conseil un arbitrage écrit.', '/budget/etats');
  if (d.departementsVides) add('alternatives', 'conseil', 'Départements', `${d.departementsVides} département${s(d.departementsVides)} sans membre enregistré.`, 'Alternative : recruter parmi les fidèles en classe 3 (Être leader) et organiser une journée de présentation des départements.', '/departements/services');

  const ordre = (r: Reco) => ['haute', 'moyenne', 'conseil'].indexOf(r.niveau);
  (Object.keys(out) as Theme[]).forEach(k => out[k].sort((a, b) => ordre(a) - ordre(b)));
  return out;
}
