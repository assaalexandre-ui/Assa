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

writeFileSync(out, [...lignes, ...lot2].join('\n'));
// Fichier de mise à jour d'une base en ligne déjà installée avec le lot 1 : migration du lot 2 + ses données fictives.
const dossier = fileURLToPath(new URL('../supabase/', import.meta.url));
const migration = readFileSync(dossier + 'migrations/20261120000001_lot2.sql', 'utf8');
writeFileSync(dossier + 'mise-a-jour-lot2.sql', "-- Mise à jour d'une base déjà installée (lot 1) vers le lot 2. À exécuter UNE fois dans l'éditeur SQL de Supabase.\n-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.\n\n" + migration + '\n\n' + lot2.join('\n'));
console.log(`seed.sql écrit : ${bergers.length} bergers, ${fideles.length} fidèles, ${nouveaux.length} nouveaux, ${appels.length} appels, ${cellules.length} cellules, ${activites.length} activités.`);
