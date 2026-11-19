# Conception : premier test Next.js + Supabase (« petit test »)

Date : 19 nov. 2026. Statut : à valider par Alexandre.

## 1. Pourquoi

Quelques responsables de l'EMCV doivent commencer à tester. Alexandre veut aussi voir concrètement comment fonctionne Supabase. Ce premier test est volontairement petit : il doit être en ligne vite, sur une adresse fournie par l'hébergeur, sans nom de domaine. Les retours des testeurs décideront de la suite.

L'artefact actuel (`app/index.html`) reste en place et n'est pas modifié. Le test vit à côté.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Une application Next.js en ligne (adresse `*.vercel.app`) reliée à un projet Supabase.
- Les menus **Accueil, Fidèles, Bergers, ADNH, Administration (Utilisateurs, Rôles et accès)**, avec les mêmes écrans et règles que l'artefact.
- Des comptes individuels : chaque testeur se connecte avec son email et un mot de passe.
- Les droits par rôle et le périmètre du berger **appliqués par la base** (RLS), pas seulement par l'interface.
- Les droits de chaque rôle, menu par menu, rangés dans une table que l'administrateur peut consulter.
- Un modèle qui permettra d'ajouter d'autres églises sans réécriture.

**Non-objectifs (pour plus tard)**
- Les 24 autres menus, la connexion par code SMS, le hors ligne (PWA), Mobile Money, WhatsApp/SMS, l'app mobile des fidèles.
- La reprise des données saisies dans l'artefact.
- Un nom de domaine, l'autorisation ARTCI (pas nécessaire avec des données fictives).

**Anti-objectifs (ce qui ferait échouer le test même si « ça marche »)**
- De vraies données de fidèles dans la base de test : **données fictives uniquement**, signalées comme telles à l'écran.
- Un berger qui peut voir les brebis d'un autre berger en contournant l'interface (appel direct à l'API Supabase).
- Une interface différente de l'artefact au point que les testeurs ne s'y retrouvent plus.
- Une clé secrète Supabase exposée dans le navigateur ou commitée dans le dépôt.

## 3. Contraintes

- Langue : tout en français (interface, messages, données de référence).
- Design : celui de l'artefact (jetons CSS de `app/index.html`, police Sora, barre latérale bleu nuit, section « Structure de l'église » en vert, fond bleu-gris, mode sombre). Contraintes de `CLAUDE.md` : pas d'Inter, pas de dégradés violet-bleu, pas de cartes imbriquées.
- Téléphones normalisés `+225 XX XX XX XX XX` (mêmes règles que `phone()` dans l'artefact).
- Hébergement : Supabase offre gratuite (région Europe) et Vercel offre gratuite. Limite connue : un projet Supabase gratuit se met en veille après une semaine sans activité. Acceptable pour un test.
- Aucun compte Supabase ni Vercel n'est relié à cette session : Alexandre devra créer le projet Supabase (et, si besoin, le compte Vercel) et fournir les clés au moment de la mise en ligne. Tout le reste se construit et se teste en local (Docker et PostgreSQL sont disponibles).

## 4. Approches envisagées

| | Approche | Avantages | Inconvénients |
|---|---|---|---|
| A | Recopier l'artefact : une table par liste | Le plus rapide, très lisible dans Supabase | Passer à plusieurs églises obligera à revoir les tables |
| B | Modèle complet de l'étude (personne, groupe, unité en arbre, permissions détaillées) | Prêt pour le ministère international | Abstrait, long à monter, difficile à lire ; trop pour un test |
| **C** | **Tables simples de A + rattachement de chaque fiche à une église + table des droits par rôle et par menu** | Lisible comme A, extensible sans réécriture | Un peu plus de travail que A |

**Retenue : C**, choisie par Alexandre le 19 nov. 2026.

## 5. Ce qui est décidé

Décidé avec Alexandre : périmètre (option « petit test »), approche C, données fictives, connexion email + mot de passe, comptes créés par l'administrateur, adresse Vercel sans nom de domaine, Supabase gratuit en Europe, même design que l'artefact.

Les points marqués *(choix du concepteur)* sont des propositions qu'Alexandre peut corriger.

### 5.1 Organisation du dépôt *(choix du concepteur)*

```
app/index.html        artefact actuel, inchangé
web/                  application Next.js (App Router, TypeScript)
supabase/migrations/  schéma, fonctions, politiques RLS (SQL)
supabase/seed.sql     données de référence + données fictives de test
supabase/tests/       tests SQL des droits (pgTAP)
```

### 5.2 Données

Colonnes communes à toutes les tables métier : `id uuid`, `eglise_id`, `cree_le`, `maj_le`, `maj_par`.

| Table | Contenu |
|---|---|
| `eglise` | Une ligne : EMCV, Abidjan. Prépare le multi-églises. |
| `profil` | Un par compte (`id` = `auth.users.id`) : nom, email, `role_code`, `fonction`, `berger_id` (pour un berger), `actif`. |
| `role` | Les 13 rôles de l'artefact (code, libellé, description). |
| `role_menu` | Droit de chaque rôle sur chaque menu : `r` (lecture) ou `w` (modification). Repris tel quel de l'objet `ROLES` de l'artefact pour les menus du test. |
| `berger` | Nom, prénoms, contact. |
| `fidele` | Mêmes champs que la fiche fidèle de l'artefact (nom, prénoms, sexe, naissance, contact, commune, quartier, statut, berger, GC, classe, notes, origine). |
| `nouveau` | Date de venue, nom, contact, commune, statut (`en suivi` / `intégré`), GC, classe, berger, `fidele_id` après intégration. |
| `appel` | Journal des appels d'un nouveau : date, résultat, compte rendu, auteur. |
| `releve_absence` + `absence` | Relevé hebdomadaire d'un berger (semaine ISO) et la liste des brebis absentes. |
| `gc`, `classe` | Données de référence chargées depuis `data/seed/` (12 GC, 4 classes), en lecture seule. |

Le champ « cellule » de l'artefact (fiche fidèle, intégration ADNH) n'existe pas dans ce test, car le menu Cellules n'en fait pas partie. *(choix du concepteur)* L'intégration d'un nouveau demande donc le GC et la classe (et le berger en option), et non plus GC + classe + cellule.

### 5.3 Droits

- Toutes les tables ont la RLS activée.
- Fonctions SQL d'aide : `mon_eglise()`, `mon_role()`, `peut(menu, 'r'|'w')`, `mon_berger()`. Elles lisent `profil` et `role_menu`.
- Lecture : la fiche appartient à mon église **et** mon rôle a au moins `r` sur le menu concerné.
- Écriture : idem avec `w`.
- Périmètre berger : un compte de rôle « berger » relié à une fiche ne voit et ne modifie que sa fiche, ses brebis (`fidele.berger_id`), ses relevés d'absence. Sans fiche reliée, il ne voit aucune brebis.
- `role`, `role_menu`, `profil` (sauf son propre nom) : écriture réservée à l'administrateur.
- Limite de 15 brebis par berger vérifiée par la base (déclencheur), pas seulement par l'interface.
- L'intégration d'un nouveau (création de la fiche fidèle + mise à jour du nouveau) se fait en une seule transaction, via une fonction SQL qui respecte les droits de l'appelant.
- Un compte désactivé (`actif = false`) ne voit plus rien.
- **Annuaire des noms** *(choix du concepteur)* : plusieurs écrans affichent des noms venant d'un menu que le rôle n'a pas (berger d'un fidèle, choix du berger à l'intégration ADNH, auteur d'un appel). Une vue en lecture seule expose **uniquement** l'identifiant, le nom et, pour un berger, son nombre de brebis, à tout compte actif de l'église. Les contacts et le reste des fiches restent protégés par les règles de menu.

Menus et droits du test, repris de l'artefact :

| Menu | Admin | Pasteur | Secrétariat | Conseil | Berger | ADNH | Formateur | Resp. GC | Trésorier |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Bergers | M | M | L | — | M | — | — | — | — |
| ADNH | M | M | M | — | — | M | — | — | — |
| Fidèles | M | M | M | L | L | M | L | L | L |
| Administration | M | — | — | — | — | — | — | — | — |

Les autres rôles (responsable de département, intercession, moniteur, fidèle) n'ont accès qu'à l'Accueil dans ce test. Le périmètre « responsable de GC » n'est pas appliqué dans ce test *(choix du concepteur)* : il voit tous les fidèles en lecture. À ajouter avec le menu GC.

### 5.4 Comptes et connexion

- Pas d'inscription libre. L'administrateur crée un compte depuis **Administration → Utilisateurs** : nom, email, rôle, fonction, fiche de berger éventuelle. L'application génère un mot de passe provisoire qu'il transmet au testeur.
- Le testeur se connecte avec email + mot de passe et peut changer son mot de passe depuis son profil.
- La création de compte passe par le serveur Next.js avec la clé de service Supabase, uniquement après vérification que l'appelant est administrateur. Cette clé ne quitte jamais le serveur.
- Le premier administrateur (Alexandre) est créé par un script lancé une fois.
- La demande d'accès de l'artefact (« accès en attente ») disparaît : on n'entre plus sans compte.

### 5.5 Écrans

Mêmes écrans et comportements que l'artefact pour les menus du test :
- **Accueil** : indicateurs selon le rôle (fidèles, nouveaux du mois, nouveaux à appeler, absences de la semaine) et la liste des nouveaux à appeler.
- **Fidèles** : fichier des fidèles (recherche, ajout, fiche, suppression en deux clics), anniversaires.
- **Bergers** : cartes des bergers avec jauge sur 15, brebis, absences de la semaine, fiche berger (rattacher une brebis, relever les absences).
- **ADNH** : nouveaux venus, appels à faire, intégration, statistiques par mois ; fiche d'un nouveau (journal d'appels, intégration).
- **Administration** : utilisateurs (créer, modifier le rôle, désactiver), rôles et accès (tableau lu depuis `role_menu`).
- Une page de connexion et une page « mon profil » (changer son mot de passe).
- Un bandeau permanent « Version de test : données fictives ».

Les mises à jour faites par un testeur apparaissent chez les autres au rechargement de la page *(choix du concepteur)*. Le temps réel (comme dans l'artefact) n'est pas nécessaire pour ce test.

### 5.6 Données fictives

`supabase/seed.sql` crée : l'église, les 13 rôles et leurs droits, les 12 GC et 4 classes, 4 bergers, une quarantaine de fidèles et une dizaine de nouveaux, tous fictifs. Aucun nom réel.

### 5.7 Vérification

- Tests SQL (pgTAP) sur une base locale : pour chaque rôle, ce qu'il peut lire et écrire ; un berger ne voit pas les brebis d'un autre même par requête directe ; la limite de 15 ; un compte désactivé ne voit rien ; seul l'admin modifie les rôles.
- Tests de rendu des écrans pour quelques rôles (admin, berger, ADNH, fidèle).
- Avant la mise en ligne : un passage manuel avec deux comptes de test (admin et berger).

## 6. Ce qui est laissé au constructeur

- Le découpage en composants et la façon de reprendre le CSS de l'artefact (fichier global de jetons + modules, ou équivalent).
- Le choix des bibliothèques secondaires, en restant léger (pas de bibliothèque de composants lourde : le design existe déjà).
- Le format exact des scripts de mise en ligne et la documentation pour Alexandre, en français.

## 7. Mise en ligne (ce dont on aura besoin d'Alexandre)

1. Créer un projet Supabase gratuit, région Europe.
2. Fournir l'adresse du projet, la clé publique et la clé de service (par le formulaire sécurisé, jamais dans la conversation).
3. Relier le dépôt GitHub à Vercel (chaque envoi sur `main` met le site à jour). *(choix du concepteur)* C'est la voie par défaut : elle n'exige aucune clé Vercel dans la session. Le plan fournit un guide pas à pas en français.
4. Donner la liste des testeurs (nom, email, rôle) pour créer leurs comptes.
