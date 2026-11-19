# Mettre en ligne la version de test (Next.js + Supabase)

Ce guide met en ligne la version de test pour les premiers responsables. Comptez une heure environ. Il faut un ordinateur avec Node.js 22 et le dépôt cloné.

À la fin, vous aurez :
- une base Supabase gratuite, hébergée en Europe, remplie de données fictives ;
- l'application à une adresse du type `https://emcv-test.vercel.app` ;
- un compte administrateur à votre nom, depuis lequel vous créez les comptes des testeurs.

> Ne saisissez aucune vraie personne pendant le test. Les données religieuses sont sensibles (loi n° 2013-450) : avant d'y mettre de vraies données, il faudra l'autorisation de l'ARTCI.

## 1. Créer le projet Supabase

1. Créez un compte sur [supabase.com](https://supabase.com), puis **New project**.
2. Nom : `emcv-test`. Région : une région en Europe (par exemple Paris ou Francfort). Choisissez un mot de passe de base de données et gardez-le de côté.
3. Attendez que le projet soit prêt, en général une à deux minutes.

À noter : un projet gratuit se met en veille après une semaine sans activité. Il suffit de le relancer depuis le tableau de bord Supabase.

## 2. Installer la base (tables, droits, données fictives)

1. Dans Supabase, cliquez sur **Connect** en haut de la page et copiez l'adresse de connexion **Session pooler** (elle commence par `postgresql://`). Remplacez `[YOUR-PASSWORD]` par le mot de passe choisi à l'étape 1.
2. Dans le dossier du dépôt, lancez :

```bash
npm install
```

```bash
npx supabase db push --remote="postgresql://…(l'adresse copiée)…" --include-seed
```

La commande crée les tables, les règles d'accès, les 13 rôles, les 12 GC et les 4 classes, puis ajoute les données fictives (4 bergers, 40 fidèles, 10 nouveaux).

## 3. Fermer l'inscription libre

Dans Supabase : **Authentication → Sign In / Providers**, désactivez **Allow new users to sign up**. Seul l'administrateur crée les comptes, depuis l'application.

## 4. Récupérer les clés

Dans Supabase : **Project Settings → API Keys**. Notez :
- l'**URL du projet** (`https://xxxx.supabase.co`) ;
- la **clé publique** (`sb_publishable_…`) ;
- la **clé secrète** (`sb_secret_…`). Ne la communiquez à personne et ne la mettez jamais dans le dépôt.

## 5. Créer votre compte administrateur

```bash
npm --prefix web install
```

```bash
SUPABASE_URL="https://xxxx.supabase.co" SUPABASE_SERVICE_ROLE_KEY="sb_secret_…" node scripts/creer-admin.mjs votre@email.com "Votre nom"
```

La commande affiche un mot de passe provisoire, à changer après votre première connexion dans « Mon profil ».

## 6. Mettre l'application en ligne sur Vercel

1. Créez un compte sur [vercel.com](https://vercel.com) avec votre compte GitHub.
2. **Add New → Project**, puis choisissez le dépôt `Assa`.
3. **Root Directory** : `web`. Vercel reconnaît Next.js sans réglage.
4. Dans **Environment Variables**, ajoutez les trois variables :

| Nom | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | l'URL du projet |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la clé publique |
| `SUPABASE_SERVICE_ROLE_KEY` | la clé secrète |

5. Cliquez sur **Deploy**. Après deux ou trois minutes, Vercel donne l'adresse du site, par exemple `https://emcv-test.vercel.app`.

Ensuite, chaque envoi sur la branche `main` met le site à jour.

## 7. Indiquer l'adresse du site à Supabase

Dans Supabase : **Authentication → URL Configuration**, mettez l'adresse Vercel dans **Site URL**.

## 8. Créer les comptes des testeurs

1. Connectez-vous à l'adresse Vercel avec votre compte administrateur.
2. **Administration → Utilisateurs → Ajouter une personne** : nom, email, rôle et fonction. Pour un berger, choisissez aussi sa **fiche de berger** : sans elle, il ne verra aucune brebis.
3. L'application affiche le mot de passe provisoire une seule fois : notez-le et transmettez-le à la personne avec l'adresse du site. Elle le changera dans « Mon profil ».

Pour retirer l'accès à quelqu'un, ouvrez son compte et décochez **Compte actif**. Pour un mot de passe oublié, ouvrez son compte et cliquez sur **Générer un nouveau mot de passe**.

## En cas de problème

| Symptôme | Cause probable |
|---|---|
| « Email ou mot de passe incorrect » pour tout le monde | Les variables Vercel ne pointent pas vers le bon projet Supabase. |
| Un berger ne voit aucune brebis | Son compte n'est pas relié à une fiche de berger (Administration → Utilisateurs). |
| Le site ne répond plus après quelques jours | Le projet Supabase gratuit est en veille : relancez-le depuis le tableau de bord Supabase. |
| « Création du compte impossible » | La clé secrète est absente ou fausse dans Vercel. |
