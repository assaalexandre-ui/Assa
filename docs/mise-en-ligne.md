# Mettre en ligne la version de test (Next.js + Supabase)

C'est le chemin suivi le 19 nov. 2026 pour mettre en ligne https://emcv-test.vercel.app. Il ne demande aucun logiciel sur votre ordinateur : tout se fait dans le navigateur, sur les sites de Supabase et de Vercel.

À la fin, vous avez :
- une base Supabase gratuite, en Europe, remplie de données fictives ;
- l'application en ligne sur Vercel, avec un serveur à Paris ;
- votre compte administrateur, depuis lequel vous créez les comptes des testeurs.

> Ne saisissez aucune vraie personne pendant le test. Les données religieuses sont sensibles (loi n° 2013-450) : avant d'y mettre de vraies données, il faudra l'autorisation de l'ARTCI.

## 1. Créer le projet Supabase

1. Créez un compte sur [supabase.com](https://supabase.com) (le plus simple : « Continue with GitHub »).
2. **New project** : nom `emcv-test`, région en Europe. Choisissez un mot de passe de base de données et gardez-le de côté.
3. Attendez une à deux minutes que le projet soit prêt.

Un projet gratuit se met en veille après une semaine sans activité : il suffit de le relancer depuis le tableau de bord Supabase.

## 2. Installer la base

1. Ouvrez le fichier [`supabase/installation-complete.sql`](../supabase/installation-complete.sql) sur GitHub et cliquez sur l'icône **Copy raw file** (en haut à droite du fichier).
2. Dans Supabase : **SQL Editor** (menu de gauche), collez, puis **Run**.
3. Supabase affiche « Potential issue detected » : c'est normal, le fichier remplace une règle qu'il vient de créer. Cliquez sur **Run query**.
4. Résultat attendu : « Success. No rows returned ».

Ce fichier ne s'exécute **qu'une fois**. Si vous le relancez, l'erreur `relation "eglise" already exists` signifie simplement que la base est déjà installée.

Pour vérifier, videz l'éditeur, collez cette requête et cliquez sur **Run** :

```sql
select
  (select count(*) from role) as roles,
  (select count(*) from fidele) as fideles,
  (select count(*) from nouveau) as nouveaux;
```

Résultat attendu : **13, 40, 10**.

## 3. Fermer l'inscription libre

**Authentication → Sign In / Providers** : désactivez **Allow new users to sign up**. Seul l'administrateur crée les comptes, depuis l'application.

## 4. Créer votre compte administrateur

1. **Authentication → Users → Add user → Create new user** : votre email et un mot de passe. Cochez **Auto Confirm User**.
2. **SQL Editor** : collez la requête ci-dessous (remplacez le nom et l'email), puis **Run**. Résultat attendu : « 1 row affected ».

```sql
insert into profil (id, eglise_id, nom, email, role_code, fonction)
select id, '00000000-0000-0000-0000-000000000001', 'Votre nom', email, 'admin', 'Administrateur'
from auth.users where email = 'votre@email.com';
```

Lancez une requête à la fois : quand plusieurs requêtes sont dans l'éditeur, Supabase n'affiche que le résultat de la dernière.

## 5. Mettre l'application en ligne sur Vercel

1. Créez un compte sur [vercel.com](https://vercel.com) avec votre compte GitHub.
2. **Add New → Project**, choisissez le dépôt `Assa`. Nom : `emcv-test`. **Root Directory** : `web`.
3. **Settings → Environment Variables** : ajoutez les trois variables.

| Nom | Où la trouver dans Supabase | Valeur |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys | `sb_publishable_…` (clé publique) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → Secret keys | `sb_secret_…` (clé secrète, cochez **Sensitive**) |

Pour la clé secrète, cliquez sur l'**icône de copie** : la clé s'affiche masquée (`sb_secret_••••`), et la sélectionner à la souris copie les points au lieu de la clé.

4. **Settings → Functions → Function Region** : choisissez **Paris (cdg1)**, plus proche de la base et d'Abidjan.
5. **Deployments** : relancez le dernier déploiement (**⋯ → Redeploy**). Toute modification des variables demande un nouveau déploiement.

Le site est alors en ligne à l'adresse `https://emcv-test.vercel.app`. Ensuite, chaque envoi sur la branche `main` du dépôt le met à jour.

## 6. Indiquer l'adresse du site à Supabase

**Authentication → URL Configuration** : mettez `https://emcv-test.vercel.app` dans **Site URL**.

## 7. Créer les comptes des testeurs

1. Connectez-vous sur le site avec votre compte administrateur.
2. **Administration → Utilisateurs → Ajouter une personne** : nom, email, rôle, fonction. Pour un berger, choisissez aussi sa **fiche de berger** : sans elle, il ne voit aucune brebis.
3. Le mot de passe provisoire s'affiche **une seule fois** : copiez-le et envoyez-le à la personne directement (pas dans une conversation partagée), avec l'adresse du site. Elle le changera dans « Mon profil ».

Pour retirer l'accès à quelqu'un, ouvrez son compte et décochez **Compte actif**. Pour un mot de passe oublié : **Générer un nouveau mot de passe**.

## En cas de problème

| Message ou symptôme | Cause et solution |
|---|---|
| « La clé secrète Supabase … n'est pas configurée dans Vercel » | La variable `SUPABASE_SERVICE_ROLE_KEY` manque : ajoutez-la (étape 5), puis relancez le déploiement. |
| « La clé secrète Supabase configurée dans Vercel est refusée » | Clé incomplète (points copiés) ou clé publique à la place : recopiez-la avec l'icône de copie, modifiez la variable, relancez le déploiement. |
| « Email ou mot de passe incorrect » pour tout le monde | Les variables Vercel ne pointent pas vers le bon projet Supabase. |
| Vous vous connectez mais l'application vous renvoie à la connexion | Votre profil administrateur n'existe pas : relancez la requête de l'étape 4. |
| Un berger ne voit aucune brebis | Son compte n'est pas relié à une fiche de berger (Administration → Utilisateurs). |
| Le site ne répond plus après quelques jours | Le projet Supabase gratuit est en veille : relancez-le depuis Supabase. |

## Annexe : installer la base en ligne de commande

Pour un développeur, depuis le dépôt cloné (Node.js 22) :

```bash
npm install
```

```bash
npx supabase db push --remote="postgresql://…(adresse Session pooler, avec le mot de passe)…" --include-seed
```

Après toute modification des migrations ou de `supabase/seed.sql`, régénérez le fichier d'installation :

```bash
npm run sql:installation
```
