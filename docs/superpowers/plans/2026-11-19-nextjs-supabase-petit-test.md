# Petit test Next.js + Supabase — plan de construction

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** mettre en ligne une première version Next.js + Supabase de l'application EMCV (Accueil, Fidèles, Bergers, ADNH, Administration) avec des droits appliqués par la base.

**Architecture :** le schéma, les fonctions et les politiques RLS vivent dans `supabase/migrations/` et sont testés contre une pile Supabase locale (CLI + Docker). L'application `web/` (Next.js App Router) lit les données dans des composants serveur avec la session de l'utilisateur (la RLS s'applique) et écrit par des Server Actions. Seule la création de comptes utilise la clé de service, côté serveur.

**Tech Stack :** Next.js 16, React 19, TypeScript 5.9, `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.119, Supabase CLI 3.2 (PostgreSQL 17), Vitest 5, `pg` pour les tests SQL, Playwright (préinstallé) pour le parcours de bout en bout.

**Spec :** `docs/superpowers/specs/2026-11-19-nextjs-supabase-petit-test-design.md`

## Global Constraints

- Tout texte visible en français. Ton simple et professionnel.
- Design repris de `app/index.html` : jetons CSS `:root` + deux blocs sombres copiés tels quels ; police Sora (+ JetBrains Mono pour les numéros) ; « Structure de l'église » en vert (`--third`) ; pas d'Inter, pas de dégradé violet-bleu, pas de cartes imbriquées.
- Téléphone : normalisé `+225 XX XX XX XX XX` (même algorithme que `phone()` de l'artefact).
- Données fictives uniquement ; bandeau permanent « Version de test : données fictives ».
- Aucune clé de service dans le navigateur ni dans le dépôt (`.env*` ignorés ; `.env.example` seulement).
- `app/index.html` n'est pas modifié.
- Toute donnée affichée passe par React (pas de `dangerouslySetInnerHTML`).
- Inscription libre désactivée (`enable_signup = false`).

## Review Focus

1. Un berger qui appelle l'API REST directement (sans l'interface) pour lire ou modifier un fidèle d'un autre berger → refusé (tests Tâche 2).
2. Un berger sans fiche reliée (`profil.berger_id` vide) → ne voit aucune brebis, aucun fidèle sans berger (tests Tâche 2 et 3).
3. Une 16e brebis, par n'importe quel chemin (formulaire Fidèles, fiche berger, intégration ADNH) → refusée avec un message en français (tests Tâche 2 et 3).
4. Un compte désactivé avec une session encore ouverte → plus aucune donnée lisible (tests Tâche 1).
5. Un administrateur qui se retire lui-même son rôle ou se désactive → refusé, pour ne pas perdre le dernier accès admin (test Tâche 3).

---

## Structure des fichiers

```
supabase/config.toml                 (créé par `supabase init`, project_id = "emcv", enable_signup = false)
supabase/migrations/20261119000001_socle.sql      église, rôles, droits, profils, références, fonctions d'aide
supabase/migrations/20261119000002_metier.sql     bergers, fidèles, nouveaux, appels, relevés + RLS + limite 15
supabase/migrations/20261119000003_fonctions.sql  actions du berger, intégration, relevé, annuaire, garde admin
supabase/seed.sql                    généré par scripts/seed.mjs
scripts/seed.mjs                     produit seed.sql depuis data/seed/*.json + rôles + données fictives
scripts/creer-admin.mjs              crée le premier administrateur (une fois)
tests/db/helpers.ts                  connexion pg + asUser(uid, fn) (rôle authenticated, claims JWT, ROLLBACK)
tests/db/*.test.ts                   tests des droits
web/                                 application Next.js
docs/mise-en-ligne.md                guide pas à pas pour Alexandre
```

---

### Task 1 : Socle de la base (église, rôles, profils, fonctions d'aide)

**Files :**
- Create : `supabase/migrations/20261119000001_socle.sql`, `tests/db/helpers.ts`, `tests/db/socle.test.ts`, `vitest.config.ts`
- Modify : `package.json` (racine : devDependencies `vitest`, `pg`, `@types/pg`, `typescript` ; scripts `test:db`, `db:reset`)

**Interfaces :**
- Produit (SQL, schéma `public`) :
  - tables `eglise(id uuid pk, nom, ville)`, `role(code text pk, libelle, description, ordre int)`, `role_menu(role_code, menu text, acces char(1) check in ('r','w'), pk(role_code, menu))`, `profil(id uuid pk → auth.users on delete cascade, eglise_id, nom, email, role_code, fonction, berger_id uuid null, actif bool default true, cree_le, maj_le)`, `gc(id text pk, eglise_id, nom, tribu, ordre)`, `classe(id text pk, eglise_id, numero int, nom)`.
  - `berger_id` de `profil` reçoit sa clé étrangère en Tâche 2.
  - fonctions `security definer`, `stable`, `set search_path = public` : `mon_eglise() → uuid`, `mon_role() → text`, `mon_berger() → uuid`, `peut(menu text, acces text) → boolean` (`'r'` est satisfait par `'r'` ou `'w'` ; faux si profil absent ou `actif = false`).
  - menus valides : `accueil`, `fideles`, `bergers`, `adnh`, `admin`.
- Produit (TS) : `asUser<T>(uid: string | null, fn: (c: PoolClient) => Promise<T>): Promise<T>` ; `uid = null` → rôle `anon`. Variables : `DB_URL` (défaut `postgresql://postgres:postgres@127.0.0.1:54322/postgres`).
- Produit : `fixtures(c)` dans `helpers.ts` qui crée dans la transaction des utilisateurs `auth.users` + `profil` pour chaque rôle de test et renvoie leurs uid (`admin`, `pasteur`, `secretariat`, `berger1`, `berger2`, `bergerSansFiche`, `adnh`, `membre`, `desactive`).

- [ ] **Step 1 : tests** — `socle.test.ts` :
  - `anon ne lit aucun profil` : `select count(*) from profil` en anon → 0.
  - `chacun lit son profil, l'admin les lit tous`.
  - `seul l'admin écrit dans role_menu et role` : insert par `pasteur` → erreur RLS ; par `admin` → ok.
  - `un utilisateur ne change pas son propre rôle` : `update profil set role_code='admin' where id = moi` par `membre` → 0 ligne modifiée.
  - `peut()` : `pasteur` → `peut('bergers','w')` vrai, `peut('admin','r')` faux ; `desactive` → tout faux.
  - `compte désactivé ne lit rien` : `select count(*) from gc` par `desactive` → 0.
- [ ] **Step 2 :** `npx supabase db reset` puis `npm run test:db` → échec (tables absentes).
- [ ] **Step 3 :** écrire la migration. RLS activée sur toutes les tables. `gc`, `classe`, `role`, `role_menu`, `eglise` : lecture pour tout profil actif de l'église (`mon_eglise() is not null`), écriture admin (`peut('admin','w')`). `profil` : lecture de son propre profil ou admin ; écriture admin ; un utilisateur peut modifier son `nom` seulement (politique update `id = auth.uid()` + déclencheur qui refuse le changement de `role_code`, `berger_id`, `actif`, `eglise_id` si l'appelant n'est pas admin).
- [ ] **Step 4 :** `npx supabase db reset && npm run test:db` → tout passe.
- [ ] **Step 5 :** commit `feat(db): socle église, rôles, profils et fonctions de droits`.

### Task 2 : Tables métier et RLS (bergers, fidèles, ADNH, relevés)

**Files :**
- Create : `supabase/migrations/20261119000002_metier.sql`, `tests/db/metier.test.ts`

**Interfaces :**
- Consomme : `mon_eglise()`, `peut()`, `mon_role()`, `mon_berger()`, `fixtures()`.
- Produit (tables, toutes avec `id uuid default gen_random_uuid()`, `eglise_id default mon_eglise()`, `cree_le`, `maj_le`, `maj_par default auth.uid()` via déclencheur `touch()`) :
  - `berger(nom, prenoms, contact)`
  - `fidele(nom not null, prenoms, sexe, date_naissance date, telephone, commune, quartier, statut default 'Membre', berger_id → berger on delete set null, gc_id → gc, classe int, notes, origine)`
  - `nouveau(date_venue date not null, nom not null, contact, commune, origine, statut default 'en suivi' check in ('en suivi','intégré'), gc_id, classe, berger_id, fidele_id → fidele on delete set null)`
  - `appel(nouveau_id → nouveau on delete cascade, date date, resultat check in ('Joint','Pas de réponse','Rappeler plus tard','Numéro erroné'), note, auteur_id default auth.uid())`
  - `releve_absence(berger_id → berger on delete cascade, semaine text /* '2026-W47' */, unique(berger_id, semaine))` + `absence(releve_id → releve_absence on delete cascade, fidele_id → fidele on delete cascade, pk(releve_id, fidele_id))`
  - `alter table profil add foreign key (berger_id) references berger on delete set null`.
  - déclencheur `limite_brebis()` sur `fidele` (insert/update de `berger_id`) : si le berger a déjà 15 fidèles → `raise exception 'Ce berger suit déjà 15 brebis.' using errcode = 'P0001'`.
- Règles RLS (`eglise_id = mon_eglise()` partout) :
  - `fidele` lecture : `peut('fideles','r')` et (rôle ≠ `berger` ou `berger_id = mon_berger()`). Un rôle `berger` avec `mon_berger()` nul ne voit rien. Écriture : `peut('fideles','w')` ; ou rôle `berger` avec `peut('bergers','w')` en update seulement, si `berger_id = mon_berger()` avant et après.
  - `berger` lecture : `peut('bergers','r')` et (rôle ≠ `berger` ou `id = mon_berger()`) ; écriture : `peut('bergers','w')` et rôle ≠ `berger` (le berger modifie sa propre fiche : update si `id = mon_berger()`).
  - `nouveau`, `appel` : lecture `peut('adnh','r')`, écriture `peut('adnh','w')`.
  - `releve_absence`, `absence` : lecture/écriture via `peut('bergers', …)` + périmètre berger sur `berger_id` (pour `absence`, via le relevé parent).

- [ ] **Step 1 : tests** — `metier.test.ts` (données créées dans la transaction : 2 bergers B1/B2 reliés à `berger1`/`berger2`, 3 fidèles de B1, 2 de B2, 2 sans berger) :
  - `berger1 ne lit que ses 3 brebis` ; `bergerSansFiche lit 0 fidèle`.
  - `berger1 ne peut pas modifier une brebis de B2` (update → 0 ligne).
  - `berger1 ne peut pas déplacer sa brebis vers B2` (update `berger_id` → erreur RLS).
  - `berger1 ne peut pas insérer directement dans fidele` (→ erreur).
  - `secretariat lit tous les fidèles, ne crée pas de berger`.
  - `membre ne lit ni fidèles ni nouveaux`.
  - `adnh crée un nouveau et note un appel` ; `pasteur lit les appels`.
  - `16e brebis refusée` : avec 15 fidèles sur B1, insert par `admin` d'un 16e → erreur `Ce berger suit déjà 15 brebis.`
  - `berger1 enregistre son relevé, pas celui de B2`.
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** écrire la migration.
- [ ] **Step 4 :** `npx supabase db reset && npm run test:db` → tout passe.
- [ ] **Step 5 :** commit `feat(db): tables métier et règles d'accès par rôle et par berger`.

### Task 3 : Fonctions métier (actions du berger, intégration, relevé, annuaire, garde admin)

**Files :**
- Create : `supabase/migrations/20261119000003_fonctions.sql`, `tests/db/fonctions.test.ts`

**Interfaces (RPC appelées par `web/`, toutes `security definer`, `set search_path = public`, qui vérifient elles-mêmes rôle, église et périmètre, puis lèvent `P0001` avec un message français en cas de refus) :**
- `fideles_sans_berger() → table(id uuid, nom text)` : autorisé si `peut('bergers','w')` et (rôle ≠ berger ou `mon_berger()` non nul). Renvoie `nom || ' ' || prenoms` uniquement.
- `rattacher_brebis(p_fidele uuid, p_berger uuid) → void` : le fidèle doit être sans berger ; un rôle berger ne peut viser que `mon_berger()`.
- `creer_brebis(p_berger uuid, p_fiche jsonb) → uuid` : crée un fidèle rattaché à `p_berger` (mêmes contrôles) ; champs acceptés : ceux de `fidele` sauf `berger_id`, `eglise_id`.
- `enregistrer_releve(p_berger uuid, p_semaine text, p_absents uuid[]) → void` : remplace le relevé (upsert + remplacement des absences) ; chaque absent doit être une brebis de `p_berger`.
- `valider_integration(p_nouveau uuid, p_gc text, p_classe int, p_berger uuid) → uuid` : exige `peut('adnh','w')`, `p_gc` et `p_classe` non nuls ; crée ou met à jour la fiche fidèle (nom, téléphone = contact, commune, gc, classe, berger, statut `Nouveau` si création, origine `ADNH`), passe le nouveau en `intégré` avec `fidele_id` ; une seule transaction ; la limite de 15 s'applique.
- vue `annuaire` (`security_invoker = false`, propriétaire postgres) : `select id, 'berger' as type, nom || coalesce(' ' || prenoms,'') as nom, (select count(*) from fidele f where f.berger_id = b.id) as brebis from berger b where eglise_id = mon_eglise() and peut('accueil','r') union all select id, 'profil', nom, null from profil where eglise_id = mon_eglise() and peut('accueil','r')`. Tout profil actif a `accueil = 'r'`.
- déclencheur `garde_admin()` sur `profil` (update/delete) : refuse qu'un admin change son propre `role_code`, passe son propre `actif` à faux ou supprime son profil (`'Vous ne pouvez pas retirer votre propre accès administrateur.'`).

- [ ] **Step 1 : tests** — `fonctions.test.ts` :
  - `berger1 voit les noms des fidèles sans berger, sans contact` (colonnes renvoyées = `id`, `nom`).
  - `bergerSansFiche → fideles_sans_berger refusé`.
  - `berger1 rattache un fidèle sans berger à B1` ; `→ vers B2 refusé` ; `fidèle déjà suivi refusé`.
  - `berger1 crée une brebis` : la fiche existe avec `berger_id = B1`.
  - `enregistrer_releve` : 2 absents enregistrés, réenregistrement avec 1 absent → 1 ligne ; absent hors brebis → refusé.
  - `valider_integration` par `adnh` : fiche fidèle créée, nouveau `intégré` ; second appel met à jour la même fiche ; par `membre` → refusé ; sans GC → `'Choisissez le GC et la classe.'`.
  - `intégration vers un berger à 15 brebis → refusée et rien n'est modifié` (le nouveau reste `en suivi`).
  - `annuaire` : `secretariat` lit les noms des bergers et des profils ; `anon` → 0.
  - `l'admin ne peut pas se retirer son propre rôle`.
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** écrire la migration ; `grant execute` des fonctions à `authenticated` seulement, `revoke` de `anon` et `public`.
- [ ] **Step 4 :** `npx supabase db reset && npm run test:db` → tout passe.
- [ ] **Step 5 :** commit `feat(db): actions du berger, intégration ADNH, relevé et annuaire`.

### Task 4 : Données de référence et données fictives

**Files :**
- Create : `scripts/seed.mjs`, `supabase/seed.sql` (généré, commité), `tests/db/seed.test.ts`

**Interfaces :**
- `node scripts/seed.mjs` écrit `supabase/seed.sql` à partir de `data/seed/classes.json`, `data/seed/gc.json`, de la table de droits ci-dessous et d'un générateur de données fictives à graine fixe (même résultat à chaque exécution).
- Église : id fixe `00000000-0000-0000-0000-000000000001`, `EMCV`, `Abidjan`.
- Rôles : les 13 de l'artefact (codes `admin, pasteur, secretariat, conseil, berger, adnh, formateur, resp_dep, resp_gc, tresorier, intercession, moniteur, membre` ; libellés et descriptions copiés de l'objet `ROLES` de `app/index.html`).
- `role_menu` : `accueil = 'r'` pour tous ; puis, exactement :
  - bergers : admin w, pasteur w, secretariat r, berger w
  - adnh : admin w, pasteur w, secretariat w, adnh w
  - fideles : admin w, pasteur w, secretariat w, conseil r, berger r, adnh w, formateur r, resp_gc r, tresorier r
  - admin : admin w
- Données fictives : 4 bergers, 40 fidèles (≤ 12 par berger, 8 sans berger), 10 nouveaux (3 intégrés, 4 avec appels), prénoms et noms ivoiriens courants combinés au hasard, téléphones `+225 07 00 0X XX XX` (série visiblement fictive), notes `Fiche fictive de test`.
- Pas de comptes utilisateurs dans le seed.

- [ ] **Step 1 : test** — `seed.test.ts` (après `db reset`, en `postgres`) : 13 rôles ; 12 GC ; 4 classes ; 40 fidèles ; aucun berger > 15 ; tous les téléphones commencent par `+225 07 00 0`.
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** écrire `scripts/seed.mjs`, générer `seed.sql`.
- [ ] **Step 4 :** `npx supabase db reset && npm run test:db` → tout passe (y compris Tâches 1 à 3).
- [ ] **Step 5 :** commit `feat(db): données de référence et données fictives de test`.

### Task 5 : Application Next.js — socle, connexion, coque

**Files :**
- Create : `web/package.json`, `web/next.config.ts`, `web/tsconfig.json`, `web/.env.example`, `web/app/globals.css`, `web/app/layout.tsx`, `web/app/connexion/page.tsx`, `web/app/connexion/actions.ts`, `web/app/(app)/layout.tsx`, `web/app/(app)/profil/page.tsx`, `web/lib/supabase/server.ts`, `web/lib/supabase/client.ts`, `web/lib/supabase/admin.ts`, `web/proxy.ts` (ou `middleware.ts` selon la version de Next installée), `web/lib/menus.ts`, `web/lib/format.ts`, `web/lib/session.ts`, `web/components/Sidebar.tsx`, `web/components/Logo.tsx`, `web/lib/format.test.ts`, `web/lib/menus.test.ts`
- Modify : `.gitignore` (`.env*` sauf `.env.example`, `web/.next`, `web/node_modules`)

**Interfaces :**
- `lib/format.ts` : `phone(v: string): string` (port exact de l'artefact), `frDate(iso?: string | null): string` (`'—'` si vide), `frMonth(ym: string): string`, `isoWeek(iso?: string): string`, `weekLabel(wk: string): string`, `fullName(f?: {nom?: string|null, prenoms?: string|null} | null): string`.
- `lib/menus.ts` : `SECTIONS` restreint aux menus du test (`accueil` ; section « Structure de l'église » : `bergers`, `adnh` ; « Fidèles et pastorale » : `fideles` ; « Administration » : `admin`), avec sous-menus et libellés copiés de l'artefact (`admin` : `utilisateurs`, `roles` seulement) ; `LEADS` copiés ; `visibleMenus(droits: Record<string,'r'|'w'>): MenuDef[]`.
- `lib/session.ts` : `getSession(): Promise<{ user: {id, email}, profil: Profil, droits: Record<string,'r'|'w'> } | null>` (lit `profil` et `role_menu` du rôle) ; `requireMenu(menu, acces?: 'r'|'w')` → redirige vers `/` si refusé.
- `lib/supabase/server.ts` : `createClient()` (cookies, clé publique) ; `admin.ts` : `createAdminClient()` (clé `SUPABASE_SERVICE_ROLE_KEY`, `import 'server-only'`).
- Variables : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` selon la doc installée), `SUPABASE_SERVICE_ROLE_KEY`.
- Routes : `/connexion`, `/` (Accueil), `/fideles/[sous]`, `/bergers/[sous]`, `/adnh/[sous]`, `/admin/[sous]`, `/profil`.
- Avant d'écrire le code : lire `node_modules/@supabase/ssr/README.md` et `node_modules/next/dist/docs/` (ou le guide d'upgrade installé) pour la forme actuelle du middleware/proxy et des cookies.

- [ ] **Step 1 : tests unitaires** — `format.test.ts` : `phone('0707123456') === '+225 07 07 12 34 56'` ; `phone('+2250505050505') === '+225 05 05 05 05 05'` ; `phone('123') === '123'` ; `isoWeek('2026-11-19') === '2026-W47'` ; `frDate('') === '—'`. `menus.test.ts` : avec les droits du `berger`, `visibleMenus` → `accueil, bergers, fideles` ; avec ceux du `membre` → `accueil`.
- [ ] **Step 2 :** `cd web && npx vitest run` → échec.
- [ ] **Step 3 :** implémenter. `globals.css` = CSS de l'artefact (bloc `<style>` principal) adapté en classes globales. Page de connexion : logo, email, mot de passe, message « Email ou mot de passe incorrect. » ; pas de lien d'inscription. Coque : barre latérale avec sections, menus visibles selon `droits`, tiroir sur téléphone (≤ 900 px), bloc « moi » (nom, rôle, liens Mon profil / Se déconnecter), bandeau de test. Profil : changer son mot de passe (≥ 8 caractères, confirmation).
- [ ] **Step 4 :** `npx vitest run` → passe ; `npm run build` → succès.
- [ ] **Step 5 :** commit `feat(web): socle Next.js, connexion et coque de l'application`.

### Task 6 : Écrans Fidèles

**Files :**
- Create : `web/app/(app)/fideles/[sous]/page.tsx`, `web/app/(app)/fideles/actions.ts`, `web/components/FideleForm.tsx`, `web/components/ui.tsx` (`Panel`, `Kpis`, `Pill`, `Empty`, `Table`, `Modal`, `SearchBox`, `DeleteButton` à deux clics), `web/components/ui.test.tsx`

**Interfaces :**
- Consomme : `requireMenu`, `fullName`, `phone`, `frDate`, `annuaire`.
- `actions.ts` : `enregistrerFidele(id: string | null, form: FormData): Promise<{ ok: true } | { erreur: string }>` (normalise le téléphone, applique les champs de la fiche artefact sauf cellule), `supprimerFidele(id: string)`.
- Sous-menus : `liste` (Fichier des fidèles : recherche `?q=`, tableau Nom et prénoms / Contact / Commune / Berger / GC / Classe / Statut, fiche en fenêtre `?fiche=<id>|nouveau`), `anniversaires` (anniversaires du mois courant et du suivant, comme l'artefact).
- Consultation seule (bandeau « Consultation seule… ») si l'accès est `r`.

- [ ] **Step 1 : test** — `ui.test.tsx` : `DeleteButton` affiche « Supprimer », puis « Confirmer la suppression » au premier clic, n'appelle l'action qu'au second.
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** implémenter les composants et l'écran. Les erreurs de la base (`P0001`) sont affichées telles quelles dans la fenêtre.
- [ ] **Step 4 :** `npx vitest run && npm run build` → passe.
- [ ] **Step 5 :** commit `feat(web): fichier des fidèles et anniversaires`.

### Task 7 : Écrans Bergers

**Files :**
- Create : `web/app/(app)/bergers/[sous]/page.tsx`, `web/app/(app)/bergers/actions.ts`, `web/components/FicheBerger.tsx`

**Interfaces :**
- Consomme : RPC `fideles_sans_berger`, `rattacher_brebis`, `creer_brebis`, `enregistrer_releve` ; `enregistrerFidele` (Tâche 6) pour la fiche d'une brebis.
- `actions.ts` : `enregistrerBerger(id: string | null, form: FormData)`, `supprimerBerger(id)`, `rattacher(fideleId, bergerId)`, `nouvelleBrebis(bergerId, form)`, `releve(bergerId, semaine, absents: string[])` — chacune renvoie `{ ok: true } | { erreur: string }` et appelle `revalidatePath('/bergers', 'layout')`.
- Sous-menus : `bergers` (cartes : nom, contact, `n / 15 brebis`, état du relevé de la semaine, jauge or à 15), `brebis` (tableau + « N fidèles sans berger » pour les non-bergers), `absences` (tableau par berger, `Fait` / `À faire`). Fiche berger en fenêtre `?berger=<id>` : contact, compteur, boutons « + Nouvelle brebis », « Rattacher un fidèle existant… » (liste de `fideles_sans_berger`), « Modifier le berger » (pas pour le rôle berger), liste des brebis avec « Fiche », relevé de la semaine avec cases à cocher et « Enregistrer le relevé », suppression en deux clics (pas pour le rôle berger).

- [ ] **Step 1 :** pas de test unitaire propre (logique en base, testée en Tâches 2-3) ; le parcours est couvert par la Tâche 9.
- [ ] **Step 2 :** implémenter ; `npm run build` → succès.
- [ ] **Step 3 :** commit `feat(web): bergers, brebis et relevé des absences`.

### Task 8 : Écrans ADNH

**Files :**
- Create : `web/app/(app)/adnh/[sous]/page.tsx`, `web/app/(app)/adnh/actions.ts`, `web/components/FicheNouveau.tsx`, `web/lib/adnh.ts`, `web/lib/adnh.test.ts`

**Interfaces :**
- `lib/adnh.ts` : `statsParMois(nouveaux: {date_venue: string, statut: string, appels: number}[]): {mois: string, venus: number, appeles: number, integres: number, taux: number}[]` (tri décroissant, taux arrondi en %).
- `actions.ts` : `enregistrerNouveau(id | null, form)`, `supprimerNouveau(id)`, `noterAppel(nouveauId, form)`, `enregistrerOrientation(nouveauId, form)` (gc, classe, berger sans valider), `integrer(nouveauId, form)` → RPC `valider_integration`.
- Sous-menus : `nouveaux` (indicateurs Personnes venues / Appelées / Intégrées + tableau), `appels` (« Jamais appelés » et « À relancer avant intégration »), `integration` (« En cours » / « Intégrés »), `stats` (tableau par mois). Fiche `?nouveau=<id>` : infos, formulaire d'appel (résultats de l'artefact), journal, intégration (GC, classe, berger depuis l'annuaire avec son nombre de brebis), boutons Enregistrer / Valider l'intégration.

- [ ] **Step 1 : test** — `adnh.test.ts` : 3 nouveaux en `2026-10` (1 intégré, 2 appelés) et 1 en `2026-11` → `[{mois:'2026-11',venus:1,…},{mois:'2026-10',venus:3,appeles:2,integres:1,taux:33}]`.
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** `npx vitest run && npm run build` → passe.
- [ ] **Step 5 :** commit `feat(web): ADNH, appels, intégration et statistiques`.

### Task 9 : Accueil, Administration, création de l'admin et parcours de bout en bout

**Files :**
- Create : `web/app/(app)/page.tsx`, `web/app/(app)/admin/[sous]/page.tsx`, `web/app/(app)/admin/actions.ts`, `scripts/creer-admin.mjs`, `tests/e2e/parcours.spec.mjs`
- Modify : `package.json` (script `test:e2e`)

**Interfaces :**
- Accueil : indicateurs selon les droits (Fidèles ; Nouveaux ce mois ; Nouveaux à appeler ; Absences relevées cette semaine) + panneau « Nouveaux à appeler » (si `adnh` lisible) ; message d'accueil pour les rôles sans menu métier.
- `admin/actions.ts` : `creerUtilisateur(form)` → vérifie `peut('admin','w')` avec la session de l'appelant, puis `createAdminClient().auth.admin.createUser({ email, password, email_confirm: true })` et insère le `profil` ; renvoie `{ ok: true, motDePasse }` (12 caractères, sans caractères ambigus). `modifierUtilisateur(id, form)` (rôle, fonction, fiche de berger, actif), `reinitialiserMotDePasse(id)` → nouveau mot de passe provisoire.
- Sous-menus admin : `utilisateurs` (formulaire « Ajouter une personne » : nom, email, rôle, fonction, fiche de berger ; tableau Personne / Rôle / Fonction / Rattachement / Actif ; mot de passe provisoire affiché une seule fois avec bouton Copier), `roles` (descriptions + matrice lue depuis `role_menu`).
- `node scripts/creer-admin.mjs <email> <nom>` : lit `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans l'environnement, crée le compte et le profil admin, affiche le mot de passe provisoire.
- E2E (local, `supabase start` + `next start`) : créer admin par le script ; connexion admin ; création d'un compte berger relié à un berger fictif ; déconnexion ; connexion berger → la barre latérale ne montre que Accueil, Bergers, Fidèles ; la page Fidèles ne liste que ses brebis ; rattacher un fidèle sans berger → le compteur augmente ; requête REST directe avec la session du berger sur `fidele` → seulement ses brebis.

- [ ] **Step 1 :** écrire `parcours.spec.mjs` avec les assertions ci-dessus.
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** implémenter Accueil, Administration et le script.
- [ ] **Step 4 :** `npm run test:db && (cd web && npx vitest run && npm run build) && npm run test:e2e` → tout passe ; captures ordinateur et téléphone de l'Accueil et des Bergers vérifiées à l'œil.
- [ ] **Step 5 :** commit `feat(web): accueil, administration et parcours de bout en bout`.

### Task 10 : Guide de mise en ligne et documentation

**Files :**
- Create : `docs/mise-en-ligne.md`, `web/README.md`
- Modify : `CLAUDE.md` (arborescence, commandes, sécurité : ce qui est maintenant protégé par la RLS), `README.md`, `docs/historique-des-decisions.md` (ligne du 19 nov. : petit test Next.js + Supabase)

**Contenu de `docs/mise-en-ligne.md`** (français, pas à pas, sans jargon) : créer le projet Supabase gratuit (région Europe) ; appliquer les migrations et le seed (`npx supabase link` puis `npx supabase db push` et exécution de `seed.sql` dans l'éditeur SQL) ; désactiver l'inscription libre dans Authentication ; créer le premier admin avec `scripts/creer-admin.mjs` ; importer le dépôt dans Vercel avec *Root Directory* = `web` et les trois variables d'environnement ; ajouter l'adresse Vercel dans Supabase → Authentication → URL Configuration ; créer les comptes des testeurs depuis Administration.

- [ ] **Step 1 :** rédiger, relire avec le skill humanizer.
- [ ] **Step 2 :** vérifier chaque commande du guide contre la pile locale.
- [ ] **Step 3 :** commit `docs: guide de mise en ligne du petit test`.
