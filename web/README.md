# EMCV — application Next.js (version de test)

Menus Accueil, Fidèles, Bergers, ADNH et Administration, branchés sur Supabase. Les droits sont appliqués par la base (RLS) : voir `supabase/migrations/`.

## Lancer en local

Prérequis : Node.js 22 et Docker.

```bash
npx supabase start
```

```bash
npm --prefix web install
```

Créez `web/.env.local` à partir de `web/.env.example`. Les valeurs locales sont données par `npx supabase status`.

```bash
npm --prefix web run dev
```

Pour créer un premier compte local, lancez `scripts/creer-admin.mjs` (voir `docs/mise-en-ligne.md`, étape 5) avec l'URL et la clé secrète locales.

## Organisation

| Dossier | Contenu |
|---|---|
| `app/connexion` | Page de connexion (email + mot de passe) |
| `app/(app)/…` | Écrans de chaque menu ; `actions.ts` = écritures (Server Actions) |
| `components/` | Barre latérale, fenêtres, formulaires, petits éléments d'interface |
| `lib/session.ts` | Session, profil et droits par menu (`role_menu`) |
| `lib/supabase/` | Client avec la session de l'utilisateur ; client « admin » (clé secrète, création de comptes seulement) |
| `proxy.ts` | Rafraîchit la session et renvoie vers `/connexion` sans session |

Les fenêtres (fiches) s'ouvrent par l'adresse, par exemple `?fiche=…`, `?berger=…` ou `?nouveau=…`.

## Tests

```bash
npm --prefix web run test
```
