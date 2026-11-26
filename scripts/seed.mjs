// Génère supabase/seed.sql : données FICTIVES pour le test (bergers, fidèles, nouveaux, appels).
// Les données de référence (rôles, droits, GC, classes, église) sont dans les migrations.
// Graine fixe : le fichier produit est identique à chaque exécution.
// Usage : node scripts/seed.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EGLISE = '00000000-0000-0000-0000-000000000001';
const out = fileURLToPath(new URL('../supabase/seed.sql', import.meta.url));

let graine = 20261119;
const hasard = () => { graine = (graine + 0x6d2b79f5) | 0; let t = Math.imul(graine ^ (graine >>> 15), 1 | graine); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const choix = arr => arr[Math.floor(hasard() * arr.length)];
const uuid = (prefixe, i) => `${prefixe}-0000-0000-0000-${String(i).padStart(12, '0')}`;
const q = v => (v === null || v === undefined ? 'null' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const pad = (x, l = 2) => String(x).padStart(l, '0');

const NOMS = ['Kouassi', 'Koffi', 'Kouamé', 'Yao', 'Konan', "N'Guessan", 'Kouadio', 'Bamba', 'Traoré', 'Coulibaly', 'Ouattara', 'Koné', 'Diomandé', 'Touré', 'Aka', 'Brou', 'Ehouman', 'Gnagne', 'Assi', 'Zadi'];
const PRENOMS = [['Jean', 'Homme'], ['Marie', 'Femme'], ['Ange', 'Homme'], ['Christelle', 'Femme'], ['Serge', 'Homme'], ['Aïcha', 'Femme'], ['Arnaud', 'Homme'], ['Grâce', 'Femme'], ['Hervé', 'Homme'], ['Prisca', 'Femme'], ['Yannick', 'Homme'], ['Esther', 'Femme'], ['Didier', 'Homme'], ['Mariam', 'Femme'], ['Franck', 'Homme'], ['Ruth', 'Femme'], ['Ismaël', 'Homme'], ['Patricia', 'Femme'], ['Fabrice', 'Homme'], ['Nadège', 'Femme']];
const COMMUNES = ['Abobo', 'Adjamé', 'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon', 'Bingerville'];
const QUARTIERS = ['Riviera', 'Angré', 'Niangon', 'Sogefiha', 'Zone 4', 'Belleville', 'Abobo-Gare', 'Williamsville', 'Vridi', 'Akouédo'];
const STATUTS = ['Membre', 'Membre', 'Membre', 'Ouvrier', 'Responsable', 'Membre'];

let tel = 0;
const telephone = () => { tel++; return `+225 07 00 0${Math.floor(tel / 10000) % 10} ${pad(Math.floor(tel / 100) % 100)} ${pad(tel % 100)}`; };

const lignes = ['-- Données FICTIVES de test, générées par scripts/seed.mjs. Ne pas y saisir de vraies personnes.', ''];

const bergers = [['Koffi', 'Jean-Marc'], ['Yao', 'Christelle'], ['Bamba', 'Ismaël'], ["N'Guessan", 'Ruth']].map(([nom, prenoms], i) => ({ id: uuid('10000000', i + 1), nom, prenoms, contact: telephone() }));
lignes.push('insert into berger (id, eglise_id, nom, prenoms, contact) values');
lignes.push(bergers.map(b => `  (${q(b.id)}, ${q(EGLISE)}, ${q(b.nom)}, ${q(b.prenoms)}, ${q(b.contact)})`).join(',\n') + ';', '');

// 40 fidèles : 12, 10, 6 et 4 brebis pour les quatre bergers, 8 sans berger.
const repartition = [...Array(12).fill(0), ...Array(10).fill(1), ...Array(6).fill(2), ...Array(4).fill(3), ...Array(8).fill(null)];
const fideles = repartition.map((b, i) => {
  const [prenom, sexe] = choix(PRENOMS);
  const an = 1960 + Math.floor(hasard() * 48), mois = 1 + Math.floor(hasard() * 12), jour = 1 + Math.floor(hasard() * 28);
  return {
    id: uuid('20000000', i + 1), nom: choix(NOMS), prenoms: prenom, sexe, date_naissance: `${an}-${pad(mois)}-${pad(jour)}`,
    telephone: telephone(), commune: choix(COMMUNES), quartier: choix(QUARTIERS), statut: choix(STATUTS),
    berger_id: b === null ? null : bergers[b].id, gc_id: `gc${pad(1 + Math.floor(hasard() * 12))}`, classe: 1 + Math.floor(hasard() * 4),
    origine: null,
  };
});

// 10 nouveaux venus ; les 3 premiers sont intégrés (leur fiche fidèle est parmi les fidèles sans berger).
const resultats = ['Joint', 'Pas de réponse', 'Rappeler plus tard'];
const nouveaux = Array.from({ length: 10 }, (_, i) => {
  const [prenom] = choix(PRENOMS);
  const date = `2026-${pad(8 + Math.floor(i / 3))}-${pad(2 + ((i * 5) % 17))}`;
  return { id: uuid('30000000', i + 1), date_venue: date, nom: `${choix(NOMS)} ${prenom}`, contact: telephone(), commune: choix(COMMUNES), integre: i < 3 };
});
nouveaux.filter(n => n.integre).forEach((n, k) => {
  const f = fideles[32 + k];
  [f.nom, f.prenoms] = [n.nom.split(' ')[0], n.nom.split(' ').slice(1).join(' ')];
  Object.assign(f, { telephone: n.contact, commune: n.commune, statut: 'Nouveau', origine: 'ADNH' });
  n.fidele_id = f.id; n.gc_id = f.gc_id; n.classe = f.classe;
});

lignes.push('insert into fidele (id, eglise_id, nom, prenoms, sexe, date_naissance, telephone, commune, quartier, statut, berger_id, gc_id, classe, notes, origine) values');
lignes.push(fideles.map(f => `  (${[f.id, EGLISE, f.nom, f.prenoms, f.sexe, f.date_naissance, f.telephone, f.commune, f.quartier, f.statut, f.berger_id, f.gc_id, f.classe, 'Fiche fictive de test', f.origine].map(q).join(', ')})`).join(',\n') + ';', '');

lignes.push('insert into nouveau (id, eglise_id, date_venue, nom, contact, commune, origine, statut, gc_id, classe, fidele_id) values');
lignes.push(nouveaux.map(n => `  (${[n.id, EGLISE, n.date_venue, n.nom, n.contact, n.commune, 'Culte du dimanche', n.integre ? 'intégré' : 'en suivi', n.gc_id ?? null, n.classe ?? null, n.fidele_id ?? null].map(q).join(', ')})`).join(',\n') + ';', '');

// Appels : les 3 intégrés et 2 nouveaux en suivi.
const appels = [];
nouveaux.slice(0, 5).forEach((n, i) => {
  const jour = Number(n.date_venue.slice(8)) + 2;
  appels.push([uuid('40000000', appels.length + 1), EGLISE, n.id, `${n.date_venue.slice(0, 8)}${pad(Math.min(jour, 28))}`, i < 3 ? 'Joint' : choix(resultats), i < 3 ? 'A confirmé sa venue au culte.' : 'À rappeler en semaine.']);
});
lignes.push('insert into appel (id, eglise_id, nouveau_id, date, resultat, note) values');
lignes.push(appels.map(a => `  (${a.map(q).join(', ')})`).join(',\n') + ';', '');

// ===================== Lot 2 : cellules, GC, programmation, jour de culte =====================
const lot2 = ['-- Données FICTIVES du lot 2 (cellules, GC, programmation, jour de culte).', ''];

// 6 cellules : 2 pour chacun des deux premiers bergers, 1 pour les deux autres.
const JOURS = ['Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const cellules = [[0, 'Cellule Riviera', 'Cocody'], [0, 'Cellule Angré', 'Cocody'], [1, 'Cellule Niangon', 'Yopougon'], [1, 'Cellule Sogefiha', 'Yopougon'], [2, 'Cellule Zone 4', 'Marcory'], [3, 'Cellule Abobo-Gare', 'Abobo']]
  .map(([b, nom, commune], i) => ({ id: uuid('50000000', i + 1), nom, commune, berger: bergers[b].id, lieu: `Domicile de la famille ${choix(NOMS)}`, famille: `Famille ${choix(NOMS)}`, jour: choix(JOURS) }));
lot2.push('insert into cellule (id, eglise_id, nom, lieu, commune, famille_accueil, berger_id, jour, infos) values');
lot2.push(cellules.map(c => `  (${[c.id, EGLISE, c.nom, c.lieu, c.commune, c.famille, c.berger, c.jour, 'Cellule fictive de test'].map(q).join(', ')})`).join(',\n') + ';', '');

// Chaque brebis rejoint une cellule de son berger.
const parCellule = {};
fideles.filter(f => f.berger_id).forEach((f, i) => {
  const siennes = cellules.filter(c => c.berger === f.berger_id);
  const c = siennes[i % siennes.length];
  (parCellule[c.id] ??= []).push(f.id);
});
Object.entries(parCellule).forEach(([c, ids]) => lot2.push(`update fidele set cellule_id = ${q(c)} where id in (${ids.map(q).join(', ')});`));
lot2.push('');

// 2 rapports par cellule (les deux dernières semaines).
const rapports = [];
cellules.forEach(c => ['2026-11-04', '2026-11-11'].forEach(d => {
  const membres = (parCellule[c.id] ?? []).length;
  rapports.push([uuid('51000000', rapports.length + 1), EGLISE, c.id, d, Math.max(2, membres - Math.floor(hasard() * 3)), Math.floor(hasard() * 2), 1000 * (3 + Math.floor(hasard() * 8)), 'Prière pour les familles et les malades.']);
}));
lot2.push('insert into rapport_cellule (id, eglise_id, cellule_id, date, presents, nouveaux, offrande, sujets) values');
lot2.push(rapports.map(r => `  (${r.map(q).join(', ')})`).join(',\n') + ';', '');

// GC : tribus et responsables fictifs, présences du 15 nov. pour 3 GC, passages de service.
const TRIBUS = ['Juda', 'Lévi', 'Benjamin', 'Éphraïm', 'Manassé', 'Ruben', 'Siméon', 'Issacar', 'Zabulon', 'Dan', 'Nephtali', 'Gad'];
TRIBUS.forEach((t, i) => {
  const resp = Array.from({ length: 3 }, () => `${choix(NOMS)} ${choix(PRENOMS)[0]}`).concat(['', '']);
  lot2.push(`update gc set tribu = ${q(t)}, responsables = array[${resp.map(q).join(', ')}] where id = ${q('gc' + pad(i + 1))};`);
});
lot2.push('');
const presences = ['gc01', 'gc02', 'gc03'].map((g, i) => {
  const membres = fideles.filter(f => f.gc_id === g);
  const absents = membres.slice(0, Math.min(2, membres.length));
  return { id: uuid('52000000', i + 1), g, presents: membres.length - absents.length, absents: absents.map(f => f.id) };
});
lot2.push('insert into gc_presence (id, eglise_id, gc_id, date, presents) values');
lot2.push(presences.map(p => `  (${[p.id, EGLISE, p.g, '2026-11-15', p.presents].map(q).join(', ')})`).join(',\n') + ';');
const abs = presences.flatMap(p => p.absents.map(f => `  (${q(p.id)}, ${q(f)})`));
if (abs.length) lot2.push('insert into gc_absence (presence_id, fidele_id) values', abs.join(',\n') + ';');
lot2.push('');
const passages = [['gc01', '2026-11-08', 'Accueil du culte du dimanche'], ['gc02', '2026-11-15', 'Placement dans la nef'], ['gc03', '2026-11-22', 'Accueil du culte du dimanche'], ['gc04', '2026-11-29', 'Nettoyage du temple']];
lot2.push('insert into gc_passage (id, eglise_id, gc_id, date, note) values');
lot2.push(passages.map((p, i) => `  (${[uuid('53000000', i + 1), EGLISE, ...p].map(q).join(', ')})`).join(',\n') + ';', '');

// Programmation : 3 assemblées et 14 activités sur l'année.
const assemblees = [['EMCV Abidjan (siège)', 'Abidjan', 'Cocody'], ['EMCV Yopougon', 'Abidjan', 'Yopougon'], ['EMCV Bouaké', 'Bouaké', 'Centre']]
  .map(([nom, ville, commune], i) => ({ id: uuid('54000000', i + 1), nom, ville, commune }));
lot2.push('insert into assemblee (id, eglise_id, nom, ville, commune, pasteur) values');
lot2.push(assemblees.map(a => `  (${[a.id, EGLISE, a.nom, a.ville, a.commune, `Pasteur ${choix(NOMS)}`].map(q).join(', ')})`).join(',\n') + ';', '');
const activites = [
  ['Convention annuelle', 'Convention', 0, '2026-01-16', '2026-01-18'], ['Retraite des responsables', 'Retraite', 0, '2026-02-20', '2026-02-22'],
  ['Séminaire des couples', 'Séminaire', 1, '2026-03-14', null], ['Culte de Pâques', 'Culte', 0, '2026-04-05', null],
  ['Croisade d\'évangélisation', 'Croisade', 2, '2026-05-22', '2026-05-24'], ['Veillée de prière', 'Veillée de prière', 0, '2026-06-26', null],
  ['Séminaire des jeunes', 'Séminaire', 1, '2026-08-08', null], ['Rentrée des cellules', 'Réunion', 0, '2026-09-06', null],
  ['Formation des bergers', 'Formation', 0, '2026-10-10', null], ['Veillée de prière', 'Veillée de prière', 1, '2026-11-27', null],
  ['Étude biblique', 'Étude biblique', 0, '2026-12-02', null], ['Veillée de Noël', 'Veillée de prière', 0, '2026-12-24', null],
  ['Culte de Noël', 'Culte', 0, '2026-12-25', null], ['Culte de fin d\'année', 'Culte', 2, '2026-12-31', null],
];
lot2.push('insert into evenement (id, eglise_id, titre, type, assemblee_id, date, date_fin, heure, lieu, responsable, description) values');
lot2.push(activites.map(([t, ty, a, d, f], i) => `  (${[uuid('55000000', i + 1), EGLISE, t, ty, assemblees[a].id, d, f, ty === 'Veillée de prière' ? '21:00' : '08:30', ['Temple principal', 'Salle polyvalente', 'Esplanade du temple'][i % 3], `Pasteur ${choix(NOMS)}`, 'Activité fictive de test'].map(q).join(', ')})`).join(',\n') + ';', '');

// Jour de culte : 8 dimanches comptés, 4 postes d'accueil le dernier dimanche.
const dimanches = ['2026-09-27', '2026-10-04', '2026-10-11', '2026-10-18', '2026-10-25', '2026-11-01', '2026-11-08', '2026-11-15'];
lot2.push('insert into comptage (id, eglise_id, date, culte, hommes, femmes, enfants, nouveaux) values');
lot2.push(dimanches.map((d, i) => `  (${[uuid('56000000', i + 1), EGLISE, d, 'Culte du dimanche – 1er service', 290 + Math.floor(hasard() * 40), 420 + Math.floor(hasard() * 50), 110 + Math.floor(hasard() * 30), Math.floor(hasard() * 8)].map(q).join(', ')})`).join(',\n') + ';', '');
const postes = [['Entrée principale', null], ['Parking', 64], ['Accueil des nouveaux', null], ['Salle des enfants', null]];
lot2.push('insert into poste_accueil (id, eglise_id, date, poste, agent, contact, places) values');
lot2.push(postes.map(([p, pl], i) => `  (${[uuid('57000000', i + 1), EGLISE, '2026-11-15', p, `${choix(NOMS)} ${choix(PRENOMS)[0]}`, telephone(), pl].map(q).join(', ')})`).join(',\n') + ';', '');

// ===================== Lot 3 : formations, départements, réunions, organigramme =====================
const lot3 = ['-- Données FICTIVES du lot 3 (formations, départements, réunions, organigramme).', ''];
const nomPersonne = () => `${choix(NOMS)} ${choix(PRENOMS)[0]}`;

// 3 sessions : classe 1 en cours, classe 2 à venir, classe 3 terminée ; 5 inscrits chacune.
const sessions = [[1, '2026-09-07', '2026-12-13'], [2, '2027-01-11', '2027-04-18'], [3, '2026-03-02', '2026-06-14']]
  .map(([classe, d, f], i) => ({ id: uuid('60000000', i + 1), classe, d, f, formateur: `Formateur ${choix(NOMS)}` }));
lot3.push('insert into session_formation (id, eglise_id, classe, date_debut, date_fin, formateur, lieu) values');
lot3.push(sessions.map(x => `  (${[x.id, EGLISE, x.classe, x.d, x.f, x.formateur, 'Salle de formation'].map(q).join(', ')})`).join(',\n') + ';', '');
const inscrits = [];
sessions.forEach((x, k) => fideles.filter(f => f.classe === x.classe).slice(0, 5).forEach((f, i) =>
  inscrits.push([uuid('61000000', inscrits.length + 1), x.id, f.id, Math.floor(hasard() * 3), k === 2 && i < 4])));
while (inscrits.length < 15) { const x = sessions[inscrits.length % 3]; const f = fideles[inscrits.length]; if (!inscrits.some(i => i[1] === x.id && i[2] === f.id)) inscrits.push([uuid('61000000', inscrits.length + 1), x.id, f.id, 0, false]); }
lot3.push('insert into inscription_formation (id, session_id, fidele_id, absences, valide) values');
lot3.push(inscrits.map(i => `  (${i.map(v => typeof v === 'boolean' ? String(v) : q(v)).join(', ')})`).join(',\n') + ';', '');

// Départements : responsable, contact, jour et quelques membres fictifs.
const JOURS_DEP = ['Mardi soir', 'Jeudi soir', 'Samedi matin'];
for (let i = 1; i <= 12; i++) {
  const membres = Array.from({ length: 2 + Math.floor(hasard() * 4) }, nomPersonne);
  lot3.push(`update departement set responsable = ${q(nomPersonne())}, contact = ${q(telephone())}, jour = ${q(choix(JOURS_DEP))}, membres = array[${membres.map(q).join(', ')}] where id = ${q('d' + pad(i))};`);
}
lot3.push('');
const creneaux = [['2026-11-22', 'd01', 'Entrée principale'], ['2026-11-22', 'd04', 'Caméra 1'], ['2026-11-22', 'd05', 'Console son'], ['2026-11-29', 'd01', 'Placement'], ['2026-11-29', 'd07', 'Chant'], ['2026-11-29', 'd08', 'Classe des 6-9 ans']];
lot3.push('insert into planning_service (id, eglise_id, date, activite, departement_id, poste, personne, contact, confirme) values');
lot3.push(creneaux.map(([d, dep, poste], i) => `  (${[uuid('62000000', i + 1), EGLISE, d, 'Culte du dimanche', dep, poste, nomPersonne(), telephone()].map(q).join(', ')}, ${i % 3 !== 2})`).join(',\n') + ';', '');
const rapportsDep = [['d04', '2026-10', 'Validé'], ['d04', '2026-11', 'Soumis'], ['d07', '2026-11', 'Soumis'], ['d08', '2026-10', 'À revoir']];
lot3.push('insert into rapport_departement (id, eglise_id, departement_id, periode, activites, resultats, difficultes, effectif, statut) values');
lot3.push(rapportsDep.map(([dep, per, st], i) => `  (${[uuid('63000000', i + 1), EGLISE, dep, per, 'Service assuré à chaque culte du mois.', 'Équipe au complet trois dimanches sur quatre.', 'Besoin de deux volontaires supplémentaires.', 4 + Math.floor(hasard() * 8), st].map(q).join(', ')})`).join(',\n') + ';', '');

// Réunions et tâches du conseil.
const reunions = [
  ['2026-09-08', 'Conseil', 'Rentrée des cellules', 'Calendrier de rentrée\nRépartition des bergers', 'Rentrée des cellules le 6 septembre'],
  ['2026-10-13', 'Responsables', 'Préparation de la convention 2027', 'Lieu et budget\nTransport des participants', 'Réserver la salle avant fin novembre\nFrais d\'inscription fixés à 5 000 FCFA'],
  ['2026-11-10', 'Conseil', 'Budget 2027', 'Prévisions de dépenses\nTravaux du temple', 'Adopter le budget en décembre'],
  ['2026-11-17', 'Pasteurs', 'Suivi des nouveaux', 'Taux d\'intégration\nAppels non faits', 'Appeler chaque nouveau dans la semaine'],
].map(([d, inst, obj, disc, dec], i) => ({ id: uuid('64000000', i + 1), d, inst, obj, disc, dec }));
lot3.push('insert into reunion (id, eglise_id, date, instance, assemblee_id, lieu, objet, presents, discussions, decisions) values');
lot3.push(reunions.map(r => `  (${[r.id, EGLISE, r.d, r.inst, assemblees[0].id, 'Bureau pastoral', r.obj, 'Membres du conseil (fictifs)', r.disc, r.dec].map(q).join(', ')})`).join(',\n') + ';', '');
const taches = [
  ['Réserver la salle de la convention', '2026-11-30', 'En cours', 1], ['Publier les frais d\'inscription', '2026-11-15', 'À faire', 1],
  ['Préparer le projet de budget', '2026-12-05', 'En cours', 2], ['Obtenir les devis des travaux', '2026-11-12', 'À faire', 2],
  ['Envoyer la liste des nouveaux aux bergers', '2026-11-20', 'Terminée', 3], ['Former deux nouveaux bergers', '2026-10-30', 'Terminée', 0],
];
lot3.push('insert into tache (id, eglise_id, titre, responsable, echeance, statut, reunion_id) values');
lot3.push(taches.map(([t, e, st, r], i) => `  (${[uuid('65000000', i + 1), EGLISE, t, nomPersonne(), e, st, reunions[r].id].map(q).join(', ')})`).join(',\n') + ';', '');

// Organigramme : 8 responsables fictifs.
const resp = [['Pasteur principal', 'Direction'], ['Pasteur adjoint', 'Pasteurs'], ['Pasteur des jeunes', 'Pasteurs'], ['Ancien', 'Conseil'], ['Ancien', 'Conseil'], ['Secrétaire du conseil', 'Conseil'], ['Responsable de la louange', 'Responsables de ministère'], ['Responsable de l\'ADNH', 'Responsables de ministère']];
lot3.push('insert into responsable (id, eglise_id, fonction, nom, contact, whatsapp, niveau, ordre) values');
lot3.push(resp.map(([f, niv], i) => { const t = telephone(); return `  (${[uuid('66000000', i + 1), EGLISE, f, nomPersonne(), t, t, niv, i + 1].map(q).join(', ')})`; }).join(',\n') + ';', '');

// ===================== Lot 4 : prière, enfants, rendez-vous, événements =====================
const lot4 = ['-- Données FICTIVES du lot 4 (requêtes de prière, enfants, rendez-vous pastoraux, événements).', ''];
const prieres = [
  ['2026-11-02', 'Publique', 'Pour la convention de janvier.', 'En prière', null], ['2026-11-05', 'Équipe d\'intercession', 'Pour un travail stable.', 'Reçue', null],
  ['2026-11-08', 'Confidentielle', 'Situation familiale difficile.', 'En prière', null], ['2026-11-09', 'Publique', 'Pour la santé de ma mère.', 'Exaucée', 'Ma mère est sortie de l\'hôpital, gloire à Dieu.'],
  ['2026-11-12', 'Équipe d\'intercession', 'Pour la réussite aux examens.', 'Reçue', null], ['2026-11-15', 'Confidentielle', 'Décision importante à prendre.', 'Reçue', null],
  ['2026-10-20', 'Publique', 'Pour un logement.', 'Exaucée', 'Nous avons trouvé un logement à Cocody.'], ['2026-11-17', 'Publique', 'Pour les nouveaux de l\'église.', 'En prière', null],
];
lot4.push('insert into priere (id, eglise_id, date, demandeur, visibilite, sujet, statut, temoignage) values');
lot4.push(prieres.map(([d, v, sujet, st, tem], i) => `  (${[uuid('70000000', i + 1), EGLISE, d, nomPersonne(), v, sujet, st, tem].map(q).join(', ')})`).join(',\n') + ';', '');
const GROUPES = ['0–3 ans', '4–6 ans', '7–9 ans', '10–12 ans', '13 ans et plus'];
const enfants = Array.from({ length: 10 }, (_, i) => ({ id: uuid('71000000', i + 1), nom: `${choix(NOMS)} ${choix(PRENOMS)[0]}`, groupe: GROUPES[i % 5], parent: nomPersonne(), contact: telephone(), code: Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(hasard() * 32)]).join('') }));
lot4.push('insert into enfant (id, eglise_id, nom, groupe, parent, contact, code, notes) values');
lot4.push(enfants.map(e => `  (${[e.id, EGLISE, e.nom, e.groupe, e.parent, e.contact, e.code, 'Fiche fictive de test'].map(q).join(', ')})`).join(',\n') + ';', '');
lot4.push('insert into pointage_enfant (id, eglise_id, enfant_id, date, arrivee, sortie) values');
lot4.push(enfants.slice(0, 7).map((e, i) => `  (${[uuid('72000000', i + 1), EGLISE, e.id, '2026-11-15'].map(q).join(', ')}, true, ${i < 5})`).join(',\n') + ';', '');
const rdvs = [['2026-11-10', 'Bureau', 'Fait', 'Conseil conjugal'], ['2026-11-13', 'Visite à l\'hôpital', 'Fait', 'Visite après une opération'], ['2026-11-18', 'Visite à domicile', 'Reporté', 'Présentation d\'un nouveau-né'],
  ['2026-11-26', 'Bureau', 'Prévu', 'Préparation au mariage'], ['2026-11-28', 'Appel', 'Prévu', 'Suivi d\'un nouveau'], ['2026-12-03', 'Visite à domicile', 'Prévu', 'Visite de soutien']];
lot4.push('insert into rdv (id, eglise_id, date, heure, personne, contact, type, pasteur, motif, statut) values');
lot4.push(rdvs.map(([d, t, st, motif], i) => `  (${[uuid('73000000', i + 1), EGLISE, d, '10:00', `Famille ${choix(NOMS)}`, telephone(), t, `Pasteur ${choix(NOMS)}`, motif, st].map(q).join(', ')})`).join(',\n') + ';', '');
const convention = uuid('55000000', 15);
lot4.push('insert into evenement (id, eglise_id, titre, type, assemblee_id, date, date_fin, heure, lieu, responsable, frais, description) values');
lot4.push(`  (${[convention, EGLISE, 'Convention annuelle 2027', 'Convention', assemblees[0].id, '2027-01-15', '2027-01-17', '08:30', 'Esplanade du temple', `Pasteur ${choix(NOMS)}`, 5000, 'Activité fictive de test'].map(q).join(', ')});`, '');
const CANAUX = ['Espèces', 'Orange Money', 'MTN MoMo', 'Wave'];
lot4.push('insert into inscription_evenement (id, eglise_id, evenement_id, nom, contact, montant, canal, car, depart) values');
lot4.push(Array.from({ length: 12 }, (_, i) => `  (${[uuid('74000000', i + 1), EGLISE, convention, nomPersonne(), telephone(), i % 4 === 3 ? 2000 : 5000, choix(CANAUX), `Car ${1 + (i % 2)}`, i % 2 ? 'Yopougon' : 'Cocody'].map(q).join(', ')})`).join(',\n') + ';', '');

const lot5 = ['-- Données FICTIVES du lot 5 (objectifs, projets).', ''];
const objectifs = [
  ['Accueillir 40 nouveaux venus en 2026', 'Faire grandir l\'église par l\'accueil.', 'nouveaux', 40, null, '2026-01-01', '2026-12-31', null],
  ['Intégrer la moitié des nouveaux', 'Que chaque nouveau trouve sa place.', 'integres', 5, null, '2026-01-01', '2026-12-31', null],
  ['Confier chaque fidèle à un berger', 'Aucun fidèle sans suivi.', 'suivis', 40, null, '2026-01-01', '2026-12-31', null],
  ['Six cellules actives', 'Couvrir les communes d\'Abidjan.', 'cellules', 6, null, '2026-01-01', '2026-12-31', null],
  ['Former 8 opérateurs caméra', 'Assurer la diffusion des cultes.', 'manuel', 8, 5, '2026-01-01', '2026-12-31', 'd04'],
  ['Deux nouveaux chants par mois', 'Renouveler la louange.', 'manuel', 12, 12, '2026-06-01', '2026-11-30', 'd07'],
  ['Présence moyenne de 350 au 1er semestre', 'Mesurer la fidélité aux cultes.', 'presence', 350, null, '2026-01-01', '2026-06-30', null],
];
lot5.push('insert into objectif (id, eglise_id, libelle, but, mesure, cible, realise, date_debut, date_fin, departement_id, responsable) values');
lot5.push(objectifs.map((o, i) => `  (${[uuid('75000000', i + 1), EGLISE, ...o, `Responsable ${choix(NOMS)}`].map(q).join(', ')})`).join(',\n') + ';', '');
const projets = [
  ['Réfection de la toiture du temple', 'Remplacer les tôles abîmées avant la saison des pluies.', 'd06', '2026-10-01', '2027-03-31', 'Haute', 'En cours', 4500000],
  ['Convention annuelle 2027', 'Organisation, hébergement et transport des participants.', null, '2026-09-15', '2027-01-17', 'Haute', 'En cours', 3000000],
  ['Équipement de la régie vidéo', 'Deuxième caméra et ordinateur de diffusion.', 'd04', '2026-11-01', '2027-02-28', 'Moyenne', 'À lancer', 1800000],
  ['Rentrée de l\'école du dimanche', 'Nouveaux supports et formation des moniteurs.', 'd08', '2026-08-01', '2026-10-15', 'Basse', 'Terminé', 350000],
];
lot5.push('insert into projet (id, eglise_id, nom, description, departement_id, date_debut, echeance, priorite, statut, budget, responsable) values');
lot5.push(projets.map((p, i) => `  (${[uuid('76000000', i + 1), EGLISE, ...p, `Frère ${choix(NOMS)}`].map(q).join(', ')})`).join(',\n') + ';', '');
const actionsProjet = [
  [1, 'Obtenir trois devis', '2026-11-10', 'Fait'], [1, 'Choisir l\'entreprise', '2026-11-18', 'En cours'], [1, 'Collecte spéciale pour la toiture', '2026-11-23', 'À faire'], [1, 'Début des travaux', '2027-01-12', 'À faire'],
  [2, 'Réserver l\'esplanade', '2026-10-01', 'Fait'], [2, 'Louer les cars', '2026-11-27', 'À faire'], [2, 'Ouvrir les inscriptions', '2026-11-05', 'Fait'], [2, 'Programme des orateurs', '2026-12-15', 'À faire'],
  [3, 'Comparer les caméras', '2026-11-20', 'À faire'], [3, 'Présenter le budget au conseil', '2026-12-05', 'À faire'],
  [4, 'Commander les supports', '2026-08-20', 'Fait'], [4, 'Former les moniteurs', '2026-09-26', 'Fait'],
];
lot5.push('insert into projet_action (id, eglise_id, projet_id, titre, echeance, statut, responsable) values');
lot5.push(actionsProjet.map(([p, t, e, st], i) => `  (${[uuid('77000000', i + 1), EGLISE, uuid('76000000', p), t, e, st, nomPersonne()].map(q).join(', ')})`).join(',\n') + ';', '');
const journal = [[1, '2026-10-05', 'Décision', 'Le conseil valide le lancement du projet.'], [1, '2026-11-12', 'Difficulté', 'Un devis dépasse le budget prévu de 15 %.'], [2, '2026-11-05', 'Note', 'Les inscriptions sont ouvertes.'], [4, '2026-10-15', 'Note', 'Projet terminé dans les temps.']];
lot5.push('insert into projet_journal (id, eglise_id, projet_id, date, type, texte) values');
lot5.push(journal.map(([p, d, t, x], i) => `  (${[uuid('78000000', i + 1), EGLISE, uuid('76000000', p), d, t, x].map(q).join(', ')})`).join(',\n') + ';', '');

const lot6 = ['-- Données FICTIVES du lot 6 (finances, communication, patrimoine).', ''];
const fondsListe = [['Dîmes', 'Fonds permanent', null, null], ['Offrandes', 'Fonds permanent', null, null], ['Construction du temple', 'Campagne', 15000000, '2027-06-30'], ['Missions', 'Fonds permanent', null, null]];
lot6.push('insert into fonds (id, eglise_id, nom, type, objectif, fin, description) values');
lot6.push(fondsListe.map((f, i) => `  (${[uuid('80000000', i + 1), EGLISE, ...f, 'Fonds fictif de test'].map(q).join(', ')})`).join(',\n') + ';', '');
const CANAUX_DON = ['Espèces', 'Espèces', 'Orange Money', 'MTN MoMo', 'Wave', 'Moov Money'];
const dons = [];
for (let k = 11; k >= 0; k--) {
  const d0 = new Date(Date.UTC(2026, 10 - k, 1));
  const ym = d0.toISOString().slice(0, 7);
  const jours = ['03', '10', '17', '24'].filter(j => ym + '-' + j <= '2026-11-20');
  for (const j of jours) {
    dons.push([ym + '-' + j, 2, 150000 + Math.round(hasard() * 80) * 1000, 'Espèces', null]);
    if (hasard() < 0.5) dons.push([ym + '-' + j, 3, 25000 + Math.round(hasard() * 50) * 1000, choix(CANAUX_DON), null]);
  }
  for (let t = 0; t < 4; t++) dons.push([ym + '-' + pad(5 + t * 5), 1, 10000 + Math.round(hasard() * 40) * 1000, choix(CANAUX_DON), choix(fideles).id]);
  if (k % 3 === 0) dons.push([ym + '-15', 4, 50000, 'Virement', null]);
}
lot6.push('insert into don (id, eglise_id, date, fonds_id, montant, canal, fidele_id, reference, statut) values');
lot6.push(dons.map(([d, f, m, c, fid], i) => `  (${[uuid('81000000', i + 1), EGLISE, d, uuid('80000000', f), m, c, fid, c === 'Espèces' ? null : 'TX' + pad(i + 1, 6), d < '2026-11-01' ? 'Validé' : 'Saisi'].map(q).join(', ')})`).join(',\n') + ';', '');
const lignesBudget = [['Loyer et charges du temple', 'd06', 6000000], ['Électricité et eau', 'd06', 2400000], ['Sono et médias', 'd04', 1800000], ['École du dimanche', 'd08', 600000], ['Œuvres caritatives', 'd10', 1500000], ['Évangélisation et missions', null, 2000000], ['Entretien et hygiène', 'd03', 900000], ['Toiture du temple', 'd06', 4500000]];
lot6.push('insert into ligne_budget (id, eglise_id, annee, poste, departement_id, montant) values');
lot6.push(lignesBudget.map((l, i) => `  (${[uuid('82000000', i + 1), EGLISE, 2026, ...l].map(q).join(', ')})`).join(',\n') + ';', '');
const depenses = [
  ['2026-01-05', 'Loyer de janvier', 500000, 1, null, 'Payée'], ['2026-02-05', 'Loyer de février', 500000, 1, null, 'Payée'], ['2026-03-05', 'Loyer de mars', 500000, 1, null, 'Payée'],
  ['2026-04-12', 'Facture CIE (électricité)', 210000, 2, null, 'Payée'], ['2026-05-20', 'Câbles et micros', 320000, 3, null, 'Payée'], ['2026-06-08', 'Supports de l\'école du dimanche', 180000, 4, null, 'Payée'],
  ['2026-07-14', 'Dons alimentaires aux familles', 400000, 5, null, 'Payée'], ['2026-08-22', 'Croisade de Yopougon', 650000, 6, null, 'Payée'], ['2026-09-10', 'Produits d\'entretien', 95000, 7, null, 'Payée'],
  ['2026-10-05', 'Loyer d\'octobre', 500000, 1, null, 'Payée'], ['2026-11-05', 'Loyer de novembre', 500000, 1, null, 'Validée'], ['2026-11-12', 'Acompte toiture (tôles)', 1200000, 8, 1, 'Validée'],
  ['2026-11-16', 'Facture SODECI (eau)', 75000, 2, null, 'Demandée'], ['2026-11-18', 'Location de cars pour la convention', 900000, 6, 2, 'Demandée'], ['2026-11-19', 'Ordinateur de diffusion', 650000, 3, 3, 'Refusée'],
];
lot6.push('insert into depense (id, eglise_id, date, objet, montant, ligne_budget_id, projet_id, demandeur, beneficiaire, canal, statut) values');
lot6.push(depenses.map(([d, o, m, l, p, st], i) => `  (${[uuid('83000000', i + 1), EGLISE, d, o, m, uuid('82000000', l), p ? uuid('76000000', p) : null, nomPersonne(), 'Prestataire fictif', choix(['Espèces', 'Virement', 'Orange Money']), st].map(q).join(', ')})`).join(',\n') + ';', '');
const annonces = [['Veillée de prière', '2026-11-16', '2026-11-28', 'Veillée de prière vendredi 27 novembre à 22 h au temple. Venez nombreux.', true], ['Inscriptions à la convention 2027', '2026-11-05', '2027-01-10', 'Les inscriptions à la convention annuelle sont ouvertes auprès du secrétariat (5 000 F, transport compris).', true],
  ['Collecte pour la toiture', '2026-11-12', null, 'Une collecte spéciale pour la réfection de la toiture aura lieu le dimanche 23 novembre.', true], ['Programme de Noël', '2026-11-19', null, 'Brouillon à compléter : horaires des cultes de Noël et du Nouvel An.', false]];
lot6.push('insert into annonce (id, eglise_id, titre, date, jusquau, texte, publie) values');
lot6.push(annonces.map((a, i) => `  (${[uuid('84000000', i + 1), EGLISE, ...a.slice(0, 4)].map(q).join(', ')}, ${a[4]})`).join(',\n') + ';', '');
const articles = [['Console de mixage 24 pistes', 'Sono et instruments', 1, 'Régie', 'Bon', 1800000, '2024-03-10'], ['Micros sans fil', 'Sono et instruments', 6, 'Louange', 'Bon', 90000, '2025-01-15'], ['Clavier numérique', 'Sono et instruments', 1, 'Louange', 'À réparer', 650000, '2022-06-01'],
  ['Chaises en plastique', 'Mobilier', 400, 'Nef', 'Bon', 6000, '2023-09-01'], ['Bancs en bois', 'Mobilier', 60, 'Nef', 'Bon', 45000, '2019-05-20'], ['Vidéoprojecteur', 'Informatique', 2, 'Médias', 'Bon', 420000, '2024-11-02'],
  ['Ordinateur portable', 'Informatique', 1, 'Secrétariat', 'À réparer', 380000, '2021-02-14'], ['Minicar 22 places', 'Véhicule', 1, 'Transport', 'Bon', 14000000, '2020-08-30'], ['Groupe électrogène', 'Autre', 1, 'Temple', 'Hors service', 2500000, '2018-04-11'], ['Climatiseurs', 'Bâtiment', 4, 'Salle des enfants', 'Bon', 350000, '2023-03-03']];
lot6.push('insert into article (id, eglise_id, article, categorie, quantite, affectation, etat, valeur, date_achat, notes) values');
lot6.push(articles.map((a, i) => `  (${[uuid('85000000', i + 1), EGLISE, ...a, 'Article fictif de test'].map(q).join(', ')})`).join(',\n') + ';', '');
const entretiens = [['2026-06-10', 8, 'Vidange et révision', 'Garage fictif', 85000, '2026-12-10'], ['2026-09-02', 9, 'Diagnostic de panne', 'Électricien fictif', 25000, '2026-10-15'], ['2026-10-20', 10, 'Nettoyage des filtres', 'Froid fictif', 40000, '2027-01-20'], ['2026-11-03', 1, 'Mise à jour et réglages', 'Technicien fictif', 30000, null], ['2026-11-14', 3, 'Remplacement de touches', 'Technicien fictif', 60000, '2026-11-25']];
lot6.push('insert into entretien (id, eglise_id, date, article_id, intervention, prestataire, cout, prochaine) values');
lot6.push(entretiens.map(([d, a, it, pr, c, nx], i) => `  (${[uuid('86000000', i + 1), EGLISE, d, uuid('85000000', a), it, pr, c, nx].map(q).join(', ')})`).join(',\n') + ';', '');
lot6.push('insert into objectif (id, eglise_id, libelle, but, mesure, cible, date_debut, date_fin, responsable) values');
lot6.push(`  (${[uuid('75000000', 8), EGLISE, 'Collecter 15 millions pour le temple en 2026', 'Financer les travaux sans emprunt.', 'dons', 15000000, '2026-01-01', '2026-12-31', 'Trésorier'].map(q).join(', ')});`, '');

const lot7 = ['-- Données FICTIVES du lot 7 (évangélisation, cérémonies, paramètres de l\'église).', ''];
const sorties = [
  ['2026-09-12', 'Marché de Treichville', 'Treichville', 'Équipe A', 12, 45, 3], ['2026-10-03', 'Gare de Yopougon', 'Yopougon', 'Équipe B', 9, 38, 2],
  ['2026-10-24', 'Quartier Angré', 'Cocody', 'Équipe A', 14, 52, 4], ['2026-11-07', 'Abobo-Gare', 'Abobo', 'Équipe C', 8, 30, 2], ['2026-11-21', 'Marché de Koumassi', 'Koumassi', 'Équipe B', 11, 41, 3],
];
lot7.push('insert into sortie (id, eglise_id, date, lieu, commune, equipe, participants, rencontres, contacts, bilan) values');
lot7.push(sorties.map(([d, l, c, e, p, r, k], i) => `  (${[uuid('87000000', i + 1), EGLISE, d, l, c, e, p, r, Array.from({ length: k }, () => `${nomPersonne()} – ${telephone().replace('+225 ', '')}`).join('\n'), 'Sortie fictive de test'].map(q).join(', ')})`).join(',\n') + ';', '');
const ceremonies = [['Baptême', '2026-08-30', 6], ['Baptême', '2026-11-15', 4], ['Sainte-Cène', '2026-10-04', 0], ['Sainte-Cène', '2026-11-01', 0], ['Mariage', '2026-09-19', 1], ['Présentation d\'enfant', '2026-10-11', 1], ['Consécration', '2026-10-25', 2], ['Obsèques', '2026-11-08', 1]];
lot7.push('insert into ceremonie (id, eglise_id, type, date, personnes, officiant, lieu, notes) values');
lot7.push(ceremonies.map(([t, d, k], i) => `  (${[uuid('88000000', i + 1), EGLISE, t, d, t === 'Sainte-Cène' ? 'Assemblée réunie' : t === 'Mariage' ? `${nomPersonne()} et ${nomPersonne()}` : Array.from({ length: k }, () => nomPersonne()).join(', '), `Pasteur ${choix(NOMS)}`, 'Temple principal', 'Fiche fictive de test'].map(q).join(', ')})`).join(',\n') + ';', '');
lot7.push(`update eglise set nom_complet = 'Église Missionnaire Christ Vivant', pasteur = 'Pasteur principal (fictif)', telephone = '+225 07 00 00 00 99', adresse = 'Adresse du temple (fictive)', commune = 'Cocody', email = 'contact@exemple.org', horaires = 'Dimanche : 1er culte 7 h 30, 2e culte 10 h\nMercredi : étude biblique 18 h 30\nVendredi : veillée 22 h' where id = ${q(EGLISE)};`, '');

writeFileSync(out, [...lignes, ...lot2, ...lot3, ...lot4, ...lot5, ...lot6, ...lot7].join('\n'));
// Fichier de mise à jour d'une base en ligne déjà installée avec le lot 1 : migration du lot 2 + ses données fictives.
const dossier = fileURLToPath(new URL('../supabase/', import.meta.url));
const migration = readFileSync(dossier + 'migrations/20261120000001_lot2.sql', 'utf8');
writeFileSync(dossier + 'mise-a-jour-lot2.sql', "-- Mise à jour d'une base déjà installée (lot 1) vers le lot 2. À exécuter UNE fois dans l'éditeur SQL de Supabase.\n-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.\n\n" + migration + '\n\n' + lot2.join('\n'));
const migration3 = readFileSync(dossier + 'migrations/20261121000001_lot3.sql', 'utf8');
writeFileSync(dossier + 'mise-a-jour-lot3.sql', "-- Mise à jour d'une base déjà au lot 2 vers le lot 3. À exécuter UNE fois dans l'éditeur SQL de Supabase.\n-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.\n\n" + migration3 + '\n\n' + lot3.join('\n'));
const migration4 = readFileSync(dossier + 'migrations/20261122000001_lot4.sql', 'utf8');
writeFileSync(dossier + 'mise-a-jour-lot4.sql', "-- Mise à jour d'une base déjà au lot 3 vers le lot 4. À exécuter UNE fois dans l'éditeur SQL de Supabase.\n-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.\n\n" + migration4 + '\n\n' + lot4.join('\n'));
const migration5 = readFileSync(dossier + 'migrations/20261123000001_lot5.sql', 'utf8');
writeFileSync(dossier + 'mise-a-jour-lot5.sql', "-- Mise à jour d'une base déjà au lot 4 vers le lot 5. À exécuter UNE fois dans l'éditeur SQL de Supabase.\n-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.\n\n" + migration5 + '\n\n' + lot5.join('\n') + "\n\nnotify pgrst, 'reload schema';\n");
const migration6 = readFileSync(dossier + 'migrations/20261124000001_lot6.sql', 'utf8');
writeFileSync(dossier + 'mise-a-jour-lot6.sql', "-- Mise à jour d'une base déjà au lot 5 vers le lot 6. À exécuter UNE fois dans l'éditeur SQL de Supabase.\n-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.\n\n" + migration6 + '\n\n' + lot6.join('\n') + "\n\nnotify pgrst, 'reload schema';\n");
const migration7 = readFileSync(dossier + 'migrations/20261126000001_lot7.sql', 'utf8');
writeFileSync(dossier + 'mise-a-jour-lot7.sql', "-- Mise à jour d'une base déjà au lot 6 vers le lot 7. À exécuter UNE fois dans l'éditeur SQL de Supabase.\n-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.\n\n" + migration7 + '\n\n' + lot7.join('\n') + "\n\nnotify pgrst, 'reload schema';\n");
console.log(`seed.sql écrit : ${bergers.length} bergers, ${fideles.length} fidèles, ${nouveaux.length} nouveaux, ${appels.length} appels, ${cellules.length} cellules, ${activites.length} activités.`);
