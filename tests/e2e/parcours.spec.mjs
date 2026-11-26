// Parcours de bout en bout contre la pile locale (supabase start + next start sur le port 3100).
// Usage : npm run test:e2e   (le script lance et arrête lui-même le serveur Next.js)
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { createClient } = require('../../web/node_modules/@supabase/supabase-js');

const racine = fileURLToPath(new URL('../..', import.meta.url));
const env = Object.fromEntries(readFileSync(racine + 'web/.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = 'http://127.0.0.1:3100';
const admin = createClient(URL_SB, SECRET, { auth: { persistSession: false } });

async function nettoyer() {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  for (const u of data.users.filter(u => u.email?.endsWith('@e2e.local'))) await admin.auth.admin.deleteUser(u.id);
}

const etape = (t) => console.log('•', t);
let serveur;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
try {
  await nettoyer();
  etape('création du premier administrateur par le script');
  const sortie = execFileSync('node', [racine + 'scripts/creer-admin.mjs', 'admin@e2e.local', 'Admin E2E'], { env: { ...process.env, SUPABASE_URL: URL_SB, SUPABASE_SERVICE_ROLE_KEY: SECRET } }).toString();
  const mdpAdmin = sortie.match(/Mot de passe provisoire : (\S+)/)?.[1];
  assert.ok(mdpAdmin, 'le script affiche le mot de passe provisoire');

  serveur = spawn('npx', ['next', 'start', '-p', '3100'], { cwd: racine + 'web', stdio: 'ignore', detached: true });
  for (let i = 0; i < 60; i++) { try { await fetch(BASE + '/connexion'); break; } catch { await new Promise(r => setTimeout(r, 500)); } }

  const page = await browser.newPage();
  const connexion = async (email, mdp) => {
    await page.goto(BASE + '/connexion');
    await page.fill('#email', email);
    await page.fill('#password', mdp);
    await Promise.all([page.waitForURL(BASE + '/'), page.click('button[type=submit]')]);
  };
  const menus = () => page.$$eval('aside nav a', as => as.map(a => a.textContent.trim()));

  etape('sans session, renvoi vers la connexion');
  await page.goto(BASE + '/fideles/liste');
  assert.equal(new URL(page.url()).pathname, '/connexion');

  etape('mauvais mot de passe refusé');
  await page.fill('#email', 'admin@e2e.local'); await page.fill('#password', 'faux-mot-de-passe');
  await page.click('button[type=submit]');
  await page.getByText('Email ou mot de passe incorrect.').waitFor();

  etape('connexion administrateur');
  await connexion('admin@e2e.local', mdpAdmin);
  assert.deepEqual(await menus(), ['Accueil', 'Cellules', 'Bergers', 'ADNH', 'Formations', 'Départements', 'GC', 'Réunions', 'Programmation', 'Supervision', 'Organigramme', 'Statistiques', 'Objectifs à atteindre', 'Projets', 'Recommandations', 'Rapports', 'Fidèles', 'Requêtes de prière', 'Enfants', 'Rendez-vous pastoraux', 'Jour de culte', 'Événements', 'Évangélisation', 'Sacrements et cérémonies', 'Dîmes et offrandes', 'Budget et dépenses', 'Communication', 'Patrimoine', 'Administration']);
  await page.getByText('Version de test : données fictives').first().waitFor();

  etape("l'administrateur ouvre la fiche d'un berger et celle d'un nouveau (boutons de suppression)");
  await page.goto(BASE + '/bergers/bergers?berger=10000000-0000-0000-0000-000000000001');
  await page.getByRole('button', { name: 'Supprimer le berger' }).waitFor({ timeout: 10000 });
  await page.goto(BASE + '/adnh/nouveaux?nouveau=30000000-0000-0000-0000-000000000004');
  await page.getByRole('button', { name: 'Supprimer' }).waitFor({ timeout: 10000 });

  etape("création d'un compte berger relié à la fiche « Koffi Jean-Marc »");
  await page.goto(BASE + '/admin/utilisateurs');
  await page.fill('#f-nom', 'Berger E2E');
  await page.fill('#f-email', 'berger@e2e.local');
  await page.selectOption('#f-role_code', 'berger');
  await page.selectOption('#f-berger_id', { label: 'Koffi Jean-Marc' });
  await page.click('form#creer button[type=submit]');
  const mdpBerger = (await page.locator('.secret').textContent({ timeout: 10000 }))?.trim();
  assert.ok(mdpBerger && mdpBerger.length >= 12, 'mot de passe provisoire affiché');

  etape("lot 2 : saisie d'un comptage au jour de culte");
  await page.goto(BASE + '/culte/comptage?fiche=nouveau');
  await page.fill('#f-hommes', '301'); await page.fill('#f-femmes', '402'); await page.fill('#f-enfants', '103');
  await page.click('.modal button[type=submit]');
  await page.waitForURL(BASE + '/culte/comptage');
  await page.locator('main table tbody tr', { hasText: '806' }).first().waitFor();

  etape('lot 4 : dépôt d’une requête de prière confidentielle');
  await page.goto(BASE + '/priere/requetes?fiche=nouveau');
  await page.selectOption('#f-visibilite', 'Confidentielle');
  await page.fill('#f-sujet', 'Sujet confidentiel E2E');
  await page.click('.modal button[type=submit]');
  await page.waitForURL(BASE + '/priere/requetes');
  await page.getByText('Sujet confidentiel E2E').first().waitFor();

  etape('lot 5 : statistiques calculées par la base et objectif automatique');
  await page.goto(BASE + '/stats/croissance');
  await page.getByRole('heading', { name: 'Nouveaux venus par mois' }).waitFor();
  await page.goto(BASE + '/objectifs/resultats');
  await page.getByText('Six cellules actives').first().waitFor();

  etape("lot 5 : création d'un projet, ajout d'une action puis « Marquer fait »");
  await page.goto(BASE + '/projets/projets?fiche=nouveau');
  await page.fill('#f-nom', 'Projet E2E');
  await page.fill('#f-responsable', 'Responsable E2E');
  await page.fill('#f-date_debut', '2026-11-01'); await page.fill('#f-echeance', '2027-02-01');
  await page.selectOption('#f-priorite', 'Haute'); await page.selectOption('#f-statut', 'En cours');
  await page.click('.modal button[type=submit]');
  await page.waitForURL(BASE + '/projets/projets');
  await page.locator('.card', { hasText: 'Projet E2E' }).click();
  await page.fill('#f-titre', 'Action E2E');
  await page.click('.modal button:has-text("Ajouter l\'action")');
  await page.locator('.modal tr', { hasText: 'Action E2E' }).waitFor({ timeout: 10000 });
  await page.locator('.modal tr', { hasText: 'Action E2E' }).getByRole('button', { name: 'Marquer fait' }).click();
  await page.locator('.modal tr', { hasText: 'Action E2E' }).getByRole('button', { name: 'Rouvrir' }).waitFor({ timeout: 10000 });

  etape('lot 6 : une dépense saisie par l’administrateur attend une autre personne ; il valide celle d’un autre');
  await page.goto(BASE + '/budget/depenses?fiche=nouveau');
  await page.fill('#f-objet', 'Dépense E2E'); await page.fill('#f-montant', '12000');
  await page.selectOption('#f-statut', 'Demandée');
  await page.click('.modal button[type=submit]');
  await page.waitForURL(BASE + '/budget/depenses');
  await page.locator('main tr', { hasText: 'Dépense E2E' }).getByText('À valider par une autre personne').waitFor();
  const facture = page.locator('main tr', { hasText: 'Facture SODECI' });
  await facture.getByRole('button', { name: 'Valider' }).click();
  await facture.getByRole('button', { name: 'Marquer payée' }).waitFor({ timeout: 10000 });
  await page.goto(BASE + '/stats/finances');
  await page.getByRole('heading', { name: 'Encaissements par mois' }).waitFor();

  etape('lot 7 : transmettre un contact d’évangélisation à l’ADNH, voir le registre et le journal');
  await page.goto(BASE + '/evangelisation/contacts');
  const premier = page.locator('main tbody tr', { has: page.getByRole('button', { name: "Transmettre à l'ADNH" }) }).first();
  const contact = (await premier.locator('td').nth(1).textContent()).trim();
  await premier.getByRole('button', { name: "Transmettre à l'ADNH" }).click();
  await page.locator('main tbody tr', { hasText: contact }).getByText("Transmis à l'ADNH").waitFor({ timeout: 10000 });
  await page.goto(BASE + '/ceremonies/baptemes');
  assert.equal(await page.locator('main tbody tr').count(), 2);
  await page.goto(BASE + '/admin/eglise');
  await page.fill('#f-pasteur', 'Pasteur E2E');
  await page.click('main form button[type=submit]');
  await page.goto(BASE + '/admin/journal');
  await page.locator('main tbody tr', { hasText: "Paramètres de l'église" }).first().waitFor();

  etape('lot 8 : recommandations calculées et rapport complet téléchargé en PDF');
  await page.goto(BASE + '/reco/problemes');
  await page.locator('.reco-item').first().waitFor();
  await page.goto(BASE + '/rapports/generer?voir=1&type=complet&periode=annee');
  await page.getByRole('heading', { name: 'Finances' }).waitFor();
  const [pdf] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.getByRole('button', { name: 'Télécharger en PDF' }).click()]);
  assert.match(pdf.suggestedFilename(), /^Rapport EMCV .*\.pdf$/);

  etape('lot 3 : marquer une tâche du conseil comme faite');
  await page.goto(BASE + '/reunions/taches?f=nonfaites');
  const avant = await page.locator('main table tbody tr').count();
  await page.locator('main table tbody tr').first().getByRole('button', { name: 'Marquer fait' }).click();
  await page.waitForFunction(n => document.querySelectorAll('main table tbody tr').length === n - 1, avant);

  etape("lot 3 : création d'un responsable de département relié à « Médias et audiovisuel »");
  await page.goto(BASE + '/admin/utilisateurs');
  await page.fill('#f-nom', 'Resp Dép E2E'); await page.fill('#f-email', 'respdep@e2e.local');
  await page.selectOption('#f-role_code', 'resp_dep');
  await page.selectOption('#f-departement_id', 'd04');
  await page.click('form#creer button[type=submit]');
  const mdpDep = (await page.locator('.secret').textContent({ timeout: 10000 }))?.trim();

  etape("lot 2 : création d'un responsable de GC relié au GC 1");
  await page.goto(BASE + '/admin/utilisateurs');
  await page.fill('#f-nom', 'Resp GC E2E'); await page.fill('#f-email', 'respgc@e2e.local');
  await page.selectOption('#f-role_code', 'resp_gc');
  await page.selectOption('#f-gc_id', 'gc01');
  await page.click('form#creer button[type=submit]');
  const mdpGc = (await page.locator('.secret').textContent({ timeout: 10000 }))?.trim();

  etape('déconnexion puis connexion du berger');
  await page.click('aside .links button');
  await page.waitForURL(BASE + '/connexion');
  await connexion('berger@e2e.local', mdpBerger);
  assert.deepEqual(await menus(), ['Accueil', 'Cellules', 'Bergers', 'Programmation', 'Organigramme', 'Fidèles', 'Requêtes de prière', 'Communication']);
  await page.getByText('Veillée de prière').first().waitFor();

  etape('lot 2 : le berger ne voit que ses 2 cellules');
  await page.goto(BASE + '/cellules/liste');
  assert.equal(await page.locator('main table tbody tr').count(), 2);

  etape('le berger ne voit que ses 12 brebis');
  await page.goto(BASE + '/fideles/liste');
  assert.equal(await page.locator('main table tbody tr').count(), 12);
  await page.goto(BASE + '/admin/utilisateurs');
  assert.equal(new URL(page.url()).pathname, '/', "l'administration lui est fermée");

  etape('rattacher un fidèle sans berger depuis sa fiche');
  await page.goto(BASE + '/bergers/bergers');
  await page.click('.card');
  await page.getByText('12 / 15').first().waitFor();
  const choix = page.locator('select[name=fidele]');
  await choix.selectOption({ index: 1 });
  await page.click('button:has-text("Rattacher")');
  await page.getByText('13 / 15').first().waitFor({ timeout: 10000 });

  etape('appel direct à l’API avec la session du berger : seulement ses brebis');
  const sb = createClient(URL_SB, PUB, { auth: { persistSession: false } });
  await sb.auth.signInWithPassword({ email: 'berger@e2e.local', password: mdpBerger });
  const { data: f } = await sb.from('fidele').select('id, berger_id');
  assert.equal(f.length, 13);
  assert.equal(new Set(f.map(x => x.berger_id)).size, 1);
  const { data: pr } = await sb.from('priere').select('sujet');
  assert.ok(!pr.some(x => x.sujet === 'Sujet confidentiel E2E'), 'le berger ne lit pas la requête confidentielle');
  const { data: dn } = await sb.from('don').select('id');
  assert.equal(dn.length, 0, 'le berger ne lit aucun don');
  const { data: n } = await sb.from('nouveau').select('id');
  assert.equal(n.length, 0, 'aucun accès aux nouveaux');
  const { error } = await sb.from('profil').update({ role_code: 'admin' }).eq('email', 'berger@e2e.local');
  assert.ok(error, 'le berger ne peut pas se donner le rôle administrateur');

  etape('lot 2 : le responsable de GC ne voit que son GC et ses membres');
  await page.goto(BASE + '/');
  await page.click('aside .links button');
  await page.waitForURL(BASE + '/connexion');
  await connexion('respgc@e2e.local', mdpGc);
  assert.deepEqual(await menus(), ['Accueil', 'GC', 'Programmation', 'Organigramme', 'Fidèles']);
  await page.goto(BASE + '/gc/groupes');
  assert.equal(await page.locator('.card').count(), 1);
  const sbGc = createClient(URL_SB, PUB, { auth: { persistSession: false } });
  await sbGc.auth.signInWithPassword({ email: 'respgc@e2e.local', password: mdpGc });
  const { data: fg } = await sbGc.from('fidele').select('gc_id');
  assert.ok(fg.length > 0 && fg.every(x => x.gc_id === 'gc01'), 'seulement les membres du GC 1');

  etape('lot 3 : le responsable de département ne voit que son département');
  await page.goto(BASE + '/');
  await page.click('aside .links button');
  await page.waitForURL(BASE + '/connexion');
  await connexion('respdep@e2e.local', mdpDep);
  assert.deepEqual(await menus(), ['Accueil', 'Départements', 'Programmation', 'Supervision', 'Organigramme', 'Objectifs à atteindre', 'Projets', 'Patrimoine']);
  await page.goto(BASE + '/departements/services');
  assert.equal(await page.locator('.card').count(), 1);
  await page.goto(BASE + '/departements/autres');
  assert.equal(await page.locator('.card').count(), 0);

  etape('lot 5 : le responsable de département voit les objectifs généraux et ceux de son département, pas les autres');
  await page.goto(BASE + '/objectifs/objectifs');
  await page.getByText('Former 8 opérateurs caméra').first().waitFor();
  assert.equal(await page.getByText('Deux nouveaux chants par mois').count(), 0);
  assert.equal(await page.getByRole('link', { name: '+ Fixer un objectif' }).count(), 0);

  console.log('\nParcours complet : OK');
} finally {
  await browser.close();
  if (serveur) try { process.kill(-serveur.pid); } catch {}
  await nettoyer();
}
