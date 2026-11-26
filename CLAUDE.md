# CLAUDE.md — SaaS EMCV

Ce fichier explique le projet à Claude Code. Lis-le en entier avant toute modification.

## Le projet en bref

Logiciel de gestion complète de l'église **EMCV** (Église Missionnaire Christ Vivant), à Abidjan, Côte d'Ivoire.
Porteur du projet : Alexandre (DG de Carmixt Mobility, designer graphique). Il travaille en **français** ; toute l'interface, les textes et les échanges sont en français.

- **v1 actuelle** : une seule église (EMCV, Abidjan). Le modèle doit rester extensible à plusieurs assemblées et pays (ministère international) sans réécriture.
- **Forme actuelle** : une application web d'une seule page, `app/index.html` (~1 840 lignes, HTML + CSS + JavaScript sans framework), publiée comme artefact claude.ai.
- **Version de test Next.js + Supabase** (« petit test », nov. 2026) : `web/` + `supabase/`. Lot 1 : Accueil, Fidèles, Bergers, ADNH, Administration. Lot 2 (20 nov.) : Cellules, GC, Programmation, Jour de culte. Lot 3 (21 nov.) : Formations, Départements, Réunions, Organigramme. Lot 4 (22 nov.) : Requêtes de prière (visibilité appliquée par la base), Enfants, Rendez-vous pastoraux, Événements. Lot 5 (23 nov.) : Supervision, Statistiques, Objectifs à atteindre, Projets (statistiques et mesures automatiques calculées par la base, chiffres agrégés sans noms ; « Statistiques › Finances » et les dépenses des projets arrivent avec le lot 6). Lot 6 (24 nov.) : Dîmes et offrandes, Budget et dépenses, Communication, Patrimoine ; règle des quatre yeux appliquée par la base (qui saisit un encaissement ou une dépense ne le valide pas) ; annonces publiées sur l'Accueil. Lot 7 (26 nov.) : Évangélisation (contacts transmis à l'ADNH par `transmettre_contact`), Sacrements et cérémonies, Administration › Paramètres de l'église et Dernières modifications (`dernieres_modifications()`, réservé à l'administration). Connexion email + mot de passe ; droits appliqués par la base ; données fictives. Conception : `docs/superpowers/specs/2026-11-19-nextjs-supabase-petit-test-design.md` ; mise en ligne : `docs/mise-en-ligne.md`.
- **Cible de production** : Next.js (TypeScript) + Supabase (PostgreSQL avec RLS), connexion par téléphone +225 et code SMS. Voir `docs/cahier-de-conception.md`.

## Préférences du porteur de projet (à respecter)

- **Poser des questions de clarification avant de construire**, « à chaque niveau » : il veut valider les choix (structure, contenu, forme) avant le travail lourd. Questions courtes, ton professionnel et conciliant.
- **Langage humain et professionnel**, qui ne sonne pas « IA » : phrases simples, pas de formules creuses.
- **Ne rien ajouter ni retirer** quand il fournit un contenu de référence (ex. le Word des compétences) : on reformule et on structure, on signale les trous, on n'invente pas.
- Interface **claire mais pas trop blanche** : barre latérale bleu nuit, fond bleu-gris, couleurs bien présentes.
- Design retenu le 20 nov. pour la version Next.js : **piste A « Vitrail »** (planche https://claude.ai/artifact/T9ys4Q2hxK4hUHjxiKmF1t). Barre latérale bleu nuit à grandes icônes empilées, regroupées par section avec sous-menus dépliables ; icônes en « billes de verre » (pastille bombée de couleur, pictogramme blanc en relief : composant `Bille`, classe `.pico`) dans la barre, les blocs titrés (`Panel icone=… ton=…`, sinon choisie d'après le titre) et les chiffres clés (`Kpis`, d'après le libellé) ; filets dorés (`--lead`) ; couleurs de vitrail `--saphir`, `--rubis`, `--emeraude`, `--ambre`, `--amethyste`, `--ciel` ; titres en Bricolage Grotesque, texte en Sora ; graphiques `Rosace`, `Anneau`, `BarresEmpilees` dans `web/components/Graphiques.tsx`.

## Où est l'application en ligne

- **Version de test Next.js** : https://emcv-test.vercel.app (Vercel, projet `emcv-test`, dossier `web`, serveur à Paris). Base Supabase `smbhlxhspfhdwgdtueee` (Europe). Chaque envoi sur `main` redéploie le site.
- Mise à jour d'une base en ligne : coller dans l'éditeur SQL le fichier `supabase/mise-a-jour-lotN.sql` du lot (migration + données fictives du lot), **avant** de fusionner le code du lot dans `main` (le nouveau code lit les nouvelles colonnes).
- Les listes simples des lots 2+ sont déclarées dans `web/lib/entites.ts` (champs, menu) et enregistrées par `web/app/(app)/fiches/actions.ts` ; les droits restent vérifiés par la base.
- Après toute modification de `supabase/migrations/` ou `supabase/seed.sql`, lancer `npm run sql:installation` pour régénérer `supabase/installation-complete.sql` (installation par l'éditeur SQL de Supabase). Une nouvelle migration sur une base déjà en ligne se colle seule dans l'éditeur SQL.

- Artefact claude.ai (privé, propriétaire Alexandre) : https://claude.ai/artifact/ELRbehENjkRz9YHePCL1RX
- Les données saisies vivent dans la base de l'artefact (capacité `db`), **pas dans ce dépôt**.
- Pour republier après modification de `app/index.html` : depuis une session Claude qui a l'outil Artifact, publier ce fichier avec `url` = l'adresse ci-dessus. Sans `capabilities`, la déclaration existante est conservée.
- Capacités déclarées (à redonner telles quelles si on les repasse) :

```json
{
  "db": {"rules": [
    {"path": "", "read": "interact", "write": "interact"},
    {"path": "roles", "read": "interact", "write": "admin"},
    {"path": "objectifs", "read": "interact", "write": "admin"},
    {"path": "demandes", "read": "admin", "write": "admin"},
    {"path": "demandes/{self}", "read": "interact", "write": "interact"}
  ]},
  "user": {"scopes": ["profile"]},
  "downloads": true,
  "sample": {}
}
```

## Arborescence

```
app/index.html                  L'application complète (source de vérité)
docs/cahier-de-conception.md    Spécification à jour : menus, rôles, données, cible Next.js/Supabase
docs/historique-des-decisions.md Toutes les demandes d'Alexandre, dans l'ordre, et ce qui a été fait
docs/recherche-nomenclature-cote-divoire.md  Étude : logiciels d'église, réalités ivoiriennes, ARTCI, Mobile Money
docs/competences-par-menu.docx  Le Word des 7 menus, corrigé (mise en page claire)
docs/sources/                   Notes manuscrites d'origine (photos), Word original, anciennes versions
brand/logo-emcv*.svg            Logo retenu (concept 1 « Lumière »)
brand/canevas-logo/             Sources du canevas de logo (2 concepts + déclinaisons)
data/seed/*.json                Données de référence (classes, départements, 12 GC, églises) — aucune donnée personnelle
tests/smoke.mjs                 Rend chaque écran pour chaque rôle avec des données d'exemple (node)
tests/captures.mjs              Captures d'écran ordinateur + téléphone (Playwright)
web/                            Version de test Next.js (voir web/README.md)
supabase/migrations/            Schéma, fonctions et règles d'accès (RLS) de la version de test
supabase/seed.sql               Données FICTIVES de test (généré par scripts/seed.mjs)
supabase/installation-complete.sql  Migrations + données fictives en un fichier (npm run sql:installation)
scripts/creer-admin.mjs         Crée le premier compte administrateur
tests/db/                       Tests des droits contre la base locale (vitest + pg)
tests/e2e/parcours.spec.mjs     Parcours complet : admin, création d'un berger, périmètre, API directe
docs/mise-en-ligne.md           Guide pas à pas : Supabase + Vercel
```

## Architecture de `app/index.html`

Une seule page, rendu par chaînes de caractères (`innerHTML`), sans dépendance sauf jsPDF + jspdf-autotable (cdnjs) pour le PDF.
Sections du script, dans l'ordre (repères `/* ==== … ==== */`) :

| Section | Rôle |
|---|---|
| Structure des menus | `IC` (icônes SVG), `SECTIONS` (sections → menus → sous-menus), `VIE`, `TDB`, `MENU` |
| Rôles | `ROLES` (13 rôles, permissions par menu `'w'`/`'r'`/`''`, `_` = défaut), `perm()` |
| État | `COLLS` (39 collections synchronisées), `S` (données en mémoire), `ROLE`, `ME`, `cur` |
| Outils | `esc`, dates, `isoWeek`, `phone` (+225), `money` (FCFA entiers), `save()`/`remove()` |
| Fenêtres | `modal`, `openForm`, `fieldHtml`, `readForm`, `armDelete` (suppression en 2 clics) |
| Périmètre | `scope()` : berger → ses brebis, resp. GC → son GC, resp. département → son département |
| Moteur de listes | `ENT` : définitions déclaratives (collection, champs, colonnes, recherche, filtre) + `entList`/`openEnt` |
| Navigation / Rendu | `go(menu, sous-menu)`, routes `#menu-sousmenu`, `render()` |
| Écrans | `VIEWS[menu + '_' + sousmenu]` |
| Tableau de bord | graphiques (`vbars`, `hbars`), objectifs (`MESURES`, `objValue`, `objStatut`), projets (rappels, planning), rapports (`buildReport`, `rapportPdf`) |
| Recommandations | `recoRules()` (règles automatiques), `recoIA()` (analyse Claude via capacité `sample`, données agrégées sans noms) |
| Fiches détaillées | `openBerger`, `openNouveau`, `openSession`, `openGc`, `openProjet` |
| Démarrage | `claude.use('db')`, `claude.use('user')`, abonnements `onSnapshot`, attribution du rôle |

### Ajouter un menu ou un sous-menu

1. Ajouter l'entrée dans `SECTIONS` (id sans tiret, sous-menus `[id, libellé, réservéÉcriture?, menuRequisEnLecture?]`) et son icône dans `IC`, son texte dans `LEADS`.
2. Donner les droits dans `ROLES` (sinon le menu n'apparaît que pour l'administrateur).
3. Écrire `VIEWS['menu_sousmenu'] = () => html`. Pour une liste simple, déclarer une entrée dans `ENT` et appeler `entList('cle')`.
4. Nouvelle collection → l'ajouter à `COLLS`.
5. Lancer `node tests/smoke.mjs` : il échoue si un sous-menu n'a pas d'écran.

### Conventions

- Tout texte venant des données passe par `esc()`. Ne jamais injecter de données brutes dans le HTML.
- Téléphones normalisés en `+225 XX XX XX XX XX` (10 chiffres, mobiles en 01/05/07). Montants en **entiers FCFA**, affichés avec `money()`.
- Couleurs uniquement par jetons CSS (`:root` + 2 blocs sombres). Section « Structure de l'église » en vert (`--third`), le reste en bleu (`--accent`), or (`--gold`) pour les accents.
- Police : Sora (Google Fonts) ; chiffres en `tabular-nums`.
- Les données d'exemple ne doivent jamais apparaître comme de vraies données.

## Structure actuelle des menus (29 menus, 81 sous-menus)

- **Accueil** — vue d'ensemble selon le rôle, rappels de projets
- **Structure de l'église** (vert) — Cellules, Bergers, ADNH (amis des nouveaux), Formations, Départements, GC (groupes de communion), Réunions, Programmation, Supervision, Organigramme
- **Tableau de bord** — Statistiques, Objectifs à atteindre (fixés par l'administrateur, mesure auto ou manuelle), Projets (plan d'actions, budget, journal, planning, rappels J-7/J-3/J/retard), Recommandations (performance, problèmes, objectifs, alternatives ; règles + Claude), Rapports (complet ou partiel, PDF)
- **Fidèles et pastorale** — Fidèles, Requêtes de prière, Enfants, Rendez-vous pastoraux
- **Cultes et activités** — Jour de culte, Événements, Évangélisation, Sacrements et cérémonies
- **Finances et ressources** — Dîmes et offrandes, Budget et dépenses, Communication, Patrimoine
- **Administration** — Utilisateurs, Rôles et accès, Paramètres de l'église, Dernières modifications

Détail complet : `docs/cahier-de-conception.md`.

## Sécurité : ce qui est vraiment protégé

### Version de test Next.js + Supabase (`web/`, `supabase/`)

- **Tout est appliqué par la base** (RLS) : droits par rôle et par menu (table `role_menu`, fonction `peut()`), périmètre du berger (`mon_berger()`), limite de 15 brebis (déclencheur), un administrateur ne peut pas se retirer son propre accès.
- Les actions sensibles passent par des fonctions SQL qui vérifient elles-mêmes les droits : `rattacher_brebis`, `creer_brebis`, `enregistrer_releve`, `valider_integration`, `fideles_sans_berger` (noms seulement).
- La vue `annuaire` n'expose que des noms (jamais de contact) à tout compte actif.
- La clé secrète Supabase ne sert qu'à créer les comptes, côté serveur, après vérification que l'appelant est administrateur.
- Toute nouvelle table doit avoir la RLS activée et un test dans `tests/db/`.

### Version artefact (`app/index.html`)

- **Verrouillé au niveau des données** : seuls les administrateurs de l'artefact écrivent dans `roles` et `objectifs` ; chaque personne n'écrit que sa propre demande d'accès.
- **Filtré seulement dans l'interface** : les menus par rôle et le périmètre des bergers/responsables. Toute personne qui a accès au lien peut techniquement lire les autres collections. C'est la limite principale de la version artefact ; la version Next.js + Supabase doit appliquer ces règles en RLS.
- L'appartenance religieuse est une **donnée sensible** (loi ivoirienne n° 2013-450) : autorisation préalable de l'ARTCI avant la mise en production, attention au lieu d'hébergement.
- Ne jamais committer de données de fidèles dans ce dépôt.

## Tester

```bash
npm install            # Playwright pour les captures (le test de rendu n'a besoin que de Node)
npm test               # tests/smoke.mjs : chaque sous-menu, pour chaque rôle, avec données d'exemple
npm run captures       # tests/captures.mjs : captures dans tests/captures/
```

Version de test Next.js + Supabase (Docker nécessaire pour la base locale) :

```bash
npx supabase start     # base locale (migrations + données fictives)
npm run test:db        # droits par rôle, périmètre berger, fonctions SQL
npm --prefix web run test
npm run test:e2e       # parcours complet dans un navigateur (lance next start sur le port 3100)
```

Après `test:e2e`, relancer `npx supabase db reset` pour retrouver les données fictives d'origine.

Le PDF dépend de jsPDF chargé depuis cdnjs : sans réseau, la génération est désactivée proprement (message à l'écran).

## Points ouverts (à confirmer avec l'église)

- Nom de la **classe 5** (le Word annonce 5 classes, 4 sont nommées : Membership, Discipleship, Être leader, Départ (bergers)).
- Contenu du menu **Accueil** du Word (colonne vide dans l'original).
- « Département de la Sainte… » et « Départements, table des matières » : libellés incomplets dans le Word.
- Différence exacte entre **cellule** et **GC**.
- Agrégateur Mobile Money (CinetPay, PayDunya ou Moneroo) et lieu d'hébergement pour l'ARTCI.

## Suite prévue

1. Passage en production : lots 1 à 7 faits (27 menus). Lot 8 : Recommandations (règles automatiques ; analyse rédigée par Claude plus tard) et Rapports (PDF). Ensuite : refonte de l'interface avec navigation en haut (choix du 25 nov., couleurs Vitrail conservées), connexion par SMS, PWA hors ligne.
2. Paiements Mobile Money réels et envoi WhatsApp/SMS (aujourd'hui : messages à copier).
3. Application mobile des fidèles (React Native / Expo).
