// Regroupe les migrations et les données fictives en un seul fichier SQL,
// à coller dans l'éditeur SQL de Supabase (base vide). Usage : npm run sql:installation
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../supabase/', import.meta.url));
const parts = readdirSync(dir + 'migrations').filter(f => f.endsWith('.sql')).sort()
  .map(f => `-- ===== ${f} =====\n` + readFileSync(dir + 'migrations/' + f, 'utf8'));
parts.push('-- ===== seed.sql (données FICTIVES) =====\n' + readFileSync(dir + 'seed.sql', 'utf8'));
const tete = "-- Installation complète de la base EMCV (version de test), à exécuter UNE fois sur un projet Supabase vide.\n-- Fichier généré par scripts/installation-sql.mjs : ne pas le modifier à la main.\n\n";
writeFileSync(dir + 'installation-complete.sql', tete + parts.join('\n\n'));
console.log('supabase/installation-complete.sql écrit.');
