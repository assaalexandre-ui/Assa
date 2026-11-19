// Génère supabase/seed.sql : données FICTIVES pour le test (bergers, fidèles, nouveaux, appels).
// Les données de référence (rôles, droits, GC, classes, église) sont dans les migrations.
// Graine fixe : le fichier produit est identique à chaque exécution.
// Usage : node scripts/seed.mjs
import { writeFileSync } from 'node:fs';
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

writeFileSync(out, lignes.join('\n'));
console.log(`seed.sql écrit : ${bergers.length} bergers, ${fideles.length} fidèles, ${nouveaux.length} nouveaux, ${appels.length} appels.`);
