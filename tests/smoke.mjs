// Test de rendu : chaque sous-menu, pour chaque rôle, avec des données d'exemple.
// Usage : node tests/smoke.mjs   (aucune dépendance)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../app/index.html', import.meta.url)), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error('Script principal introuvable dans app/index.html');
// On retire le démarrage (connexion à la base claude.ai) pour garder le moteur seul.
const engine = m[1].replace(/\(async \(\) => \{\n  const route[\s\S]*$/, '');

// Faux DOM minimal
const mk = () => ({ innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add() {}, remove() {} },
  addEventListener() {}, querySelectorAll: () => [], querySelector: () => null, focus() {}, setSelectionRange() {}, onclick: null });
const els = {};
globalThis.document = { querySelector: s => els[s] || (els[s] = mk()), querySelectorAll: () => [], addEventListener() {}, activeElement: null, contains: () => false };
globalThis.window = { claude: null, addEventListener() {}, scrollTo() {} };
globalThis.location = { hash: '' };
globalThis.history = { replaceState() {} };
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.MutationObserver = class { observe() {} };
try { globalThis.navigator = {}; } catch {}

const fixture = `
S.classes=[{id:'c1',numero:1,nom:'Membership'},{id:'c2',numero:2,nom:'Disc'}];S.gc=[{id:'g1',nom:'GC 1',tribu:'Juda',responsables:[],passages:[{date:'2026-11-10',note:'x'}],ordre:1}];
S.bergers=[{id:'b1',nom:'Koffi'}];S.fideles=[{id:'f1',nom:'Yao',bergerId:'b1',gcId:'g1',classe:1,dateNaissance:'1990-11-05',telephone:'+225 07 07'}];S.cellules=[{id:'ce1',nom:'Angré',bergerId:'b1'}];
S.nouveaux=[{id:'n1',nom:'Ange',date:today(),appels:[]},{id:'n2',nom:'B',date:'2026-10-01',appels:[{date:'2026-10-02'}],statut:'intégré'}];S.sessions=[{id:'s1',classe:1,dateDebut:'2026-10-01',dateFin:'2026-12-01',inscrits:[{fideleId:'f1',absences:1}]}];
S.departements=[{id:'d1',nom:'Accueil et ordre',groupe:'service',ordre:1}];S.dons=[{id:'x',date:today(),montant:5000,fondsId:'fo',canal:'Wave',fideleId:'f1'}];S.fonds=[{id:'fo',nom:'Dîme',objectif:100000}];
S.sorties=[{id:'so',date:today(),lieu:'Adjamé',contacts:'Jean – 0707070707\\nPaul'}];S.reunions=[{id:'r',date:today(),instance:'Conseil',objet:'o',decisions:'a\\nb'}];S.taches=[{id:'t',titre:'t',echeance:'2026-01-01',statut:'À faire'}];
S.evenements=[{id:'e',titre:'Convention',type:'Convention',date:'2026-12-12',frais:5000}];S.inscriptions=[{id:'i',evenementId:'e',nom:'z',montant:5000,car:'Car 1'}];S.enfants=[{id:'en',nom:'K',parent:'P'}];
S.roles=[{id:'u1',role:'berger',bergerId:'b1'}];S.demandes=[{id:'u2'}];S.eglises=[{id:'emcv',nom:'EMCV'}];S.rapportsdep=[{id:'rd',departementId:'d1',periode:'2026-11',statut:'Soumis'}];S.objectifs=[{id:'o',libelle:'x',cible:10,realise:12,departementId:'d1',but:'b'},{id:'o2',libelle:'y',cible:10,realise:2,periode:'2025'}];S.reunions[0].discussions='p1 p2';S.projets=[{id:'p1',nom:'Toiture',responsable:'K',dateDebut:'2026-09-01',echeance:'2026-11-08',statut:'En cours',budget:500000,actions:[{id:'a1',titre:'Devis',echeance:'2026-11-01',statut:'À faire'},{id:'a2',titre:'Choix',echeance:'2026-11-20',statut:'Fait'}],journal:[{date:'2026-11-01',type:'Note',texte:'x'}]}];S.objectifs.push({id:'o3',libelle:'Nouveaux',mesure:'nouveaux',cible:5,dateDebut:'2026-01-01',dateFin:'2026-12-31'});S.comptages=[{id:'cc',date:today(),hommes:10,femmes:20,enfants:5}];S.budget=[{id:'bu',annee:2026,poste:'p',montant:1000}];S.depenses=[{id:'de',date:today(),objet:'o',montant:200,statut:'Payée',budgetId:'bu'}];
let n=0;UI.rapShow=true;UI.rap={type:'partiel',periode:'annee',rubs:['structure','projets','finances','stats'],debut:'',fin:''};for(const r of Object.keys(ROLES)){ROLE={role:r,bergerId:'b1'};for(const m of Object.values(MENU)){if(!R(m.id))continue;for(const s of visibleSubs(m.id)){const f=VIEWS[m.id+'_'+s[0]];if(!f)throw new Error('missing '+m.id+'_'+s[0]);f();n++;}}}
for(const s of SECTIONS)for(const m of s.items)for(const sub of m.subs)if(!VIEWS[m.id+'_'+sub[0]])throw new Error('missing view '+m.id+'_'+sub[0]);
console.log('OK :',n,'écrans rendus pour tous les rôles ; menus',Object.keys(MENU).length,'; sous-menus',Object.values(MENU).reduce((a,m)=>a+m.subs.length,0));
`;
// new Function : exécution en mode non strict, comme dans le navigateur.
new Function(engine + ';' + fixture)();
