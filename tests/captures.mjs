// Captures d'écran (ordinateur + téléphone) avec une fausse base de données.
// Usage : npm install && node tests/captures.mjs   → images dans tests/captures/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = root + 'tests/captures/';
mkdirSync(outDir, { recursive: true });

// Faux window.claude (base + utilisateur) avec des données d'exemple
const mock = `window.claude={use:async n=>{if(n==='user')return{me:async()=>({id:'u0',name:'Alexandre Assa',avatarUrl:'',isOwner:true,canEdit:true}),profiles:async ids=>Object.fromEntries(ids.map(i=>[i,{name:'Personne '+i}])),search:async()=>[]};
const data={classes:[{id:'c1',numero:1,nom:'Membership'},{id:'c2',numero:2,nom:'Discipleship'},{id:'c3',numero:3,nom:'Être leader'},{id:'c4',numero:4,nom:'Départ (bergers)'}],gc:Array.from({length:12},(_,i)=>({id:'g'+i,nom:'GC '+(i+1),tribu:i<3?'Juda':'',ordre:i+1,responsables:[]})),bergers:[{id:'b1',nom:'Koffi',prenoms:'Jean',contact:'+225 07 07 12 34 56'}],nouveaux:[{id:'n1',nom:'Ange Kouadio',date:'2026-11-02',contact:'+225 05 45 22 18 90',appels:[]},{id:'n2',nom:'B',date:'2026-10-02',appels:[{}],statut:'intégré'},{id:'n3',nom:'C',date:'2026-10-12',appels:[]},{id:'n4',nom:'D',date:'2026-08-12',appels:[]}],fideles:[{id:'f1',nom:'Yao',prenoms:'Christelle',bergerId:'b1',telephone:'+225 01 02 03 04 05',statut:'Membre',commune:'Cocody'},{id:'f2',nom:'Bamba',statut:'Ouvrier',commune:'Yopougon'},{id:'f3',nom:'Koné',statut:'Membre',commune:'Cocody'}],analyses:[{id:'problemes',texte:'**Appeler les nouveaux** - Repartir les appels lundi soir',date:'2026-11-06'}],projets:[{id:'p1',nom:'Réfection de la toiture',responsable:'Pasteur Koffi',dateDebut:'2026-03-01',echeance:'2026-11-09',statut:'En cours',budget:2500000,actions:[{id:'a1',titre:'Obtenir 3 devis',echeance:'2026-04-10',statut:'Fait'},{id:'a2',titre:'Lancer les travaux',echeance:'2026-11-03',statut:'À faire'}]},{id:'p2',nom:'Convention annuelle',responsable:'Secrétariat',dateDebut:'2026-09-15',echeance:'2026-12-14',statut:'En cours',actions:[{id:'a3',titre:'Réserver la salle',echeance:'2026-11-12',statut:'À faire'}]},{id:'p3',nom:'Sonorisation',responsable:'Ismaël',dateDebut:'2026-01-10',echeance:'2026-06-30',statut:'Terminé',actions:[]}],comptages:[{id:'k1',date:'2026-09-06',hommes:300,femmes:420,enfants:120},{id:'k2',date:'2026-10-04',hommes:320,femmes:450,enfants:130},{id:'k3',date:'2026-11-01',hommes:310,femmes:440,enfants:125}],dons:[{id:'d1',date:'2026-10-05',montant:1250000,canal:'Wave'},{id:'d2',date:'2026-11-02',montant:980000,canal:'Espèces'}]};
const coll=c=>({orderBy(){return this},limit(){return this},doc:()=>({set:async()=>{},update:async()=>{},delete:async()=>{},id:'x'}),onSnapshot(fn){setTimeout(()=>fn({docs:(data[c]||[]).map(d=>({id:d.id,exists:true,data:()=>d}))}),10);return()=>{}}});
return n==='db'?{collection:coll,doc:()=>({})}:null}};`;

const app = readFileSync(root + 'app/index.html', 'utf8');
const page = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body><script>' + mock + '</script>' + app + '</body></html>';
writeFileSync(outDir + 'preview.html', page);

const shots = [
  [1360, 860, 'accueil-ordinateur', '#accueil-vue'],
  [1360, 1000, 'statistiques', '#stats-croissance'],
  [1360, 1000, 'projets', '#projets-projets'],
  [1360, 860, 'recommandations', '#reco-problemes'],
  [400, 820, 'accueil-telephone', '#accueil-vue'],
];
const browser = await chromium.launch();
let errors = 0;
for (const [w, h, name, hash] of shots) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + outDir + 'preview.html' + hash);
  await p.waitForTimeout(700);
  await p.screenshot({ path: outDir + name + '.png' });
  console.log(name.padEnd(22), errs.length ? 'ERREURS : ' + errs.join(' | ') : 'ok');
  errors += errs.length;
}
await browser.close();
process.exit(errors ? 1 : 0);
