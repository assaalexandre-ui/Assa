// Crée le premier compte administrateur (à lancer une seule fois après la mise en ligne).
// Usage : SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/creer-admin.mjs <email> "<Nom complet>"
import { createRequire } from 'node:module';
import { randomInt } from 'node:crypto';

const require = createRequire(import.meta.url);
const { createClient } = require('../web/node_modules/@supabase/supabase-js');

const [email, ...nom] = process.argv.slice(2);
const url = process.env.SUPABASE_URL, cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!email || !nom.length || !url || !cle) {
  console.error('Usage : SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/creer-admin.mjs <email> "<Nom complet>"');
  process.exit(1);
}
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const motDePasse = Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

const sb = createClient(url, cle, { auth: { persistSession: false } });
const { data: eg, error: e0 } = await sb.from('eglise').select('id').limit(1).single();
if (e0) { console.error("Église introuvable : les migrations ont-elles été appliquées ?", e0.message); process.exit(1); }
const { data, error } = await sb.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
if (error) { console.error('Création du compte impossible :', error.message); process.exit(1); }
const { error: e2 } = await sb.from('profil').insert({ id: data.user.id, eglise_id: eg.id, nom: nom.join(' '), email, role_code: 'admin', fonction: 'Administrateur' });
if (e2) { await sb.auth.admin.deleteUser(data.user.id); console.error('Création du profil impossible :', e2.message); process.exit(1); }
console.log(`Compte administrateur créé pour ${email}.`);
console.log(`Mot de passe provisoire : ${motDePasse}`);
console.log('Changez-le après la première connexion (menu « Mon profil »).');
