# SaaS EMCV

Logiciel de gestion de l'église **EMCV** (Église Missionnaire Christ Vivant), Abidjan.

Fidèles, nouveaux (ADNH), cellules, bergers, groupes de communion, formations, départements, réunions, programmation, supervision, finances, projets, statistiques, objectifs, recommandations et rapports PDF, avec un accès par rôle.

## Utiliser l'application

- En ligne : https://claude.ai/artifact/ELRbehENjkRz9YHePCL1RX (privée ; partage depuis le menu Partager).
- En local, pour regarder l'interface : ouvrir `app/index.html` dans un navigateur. Hors de claude.ai, les données ne se chargent pas (bandeau d'avertissement) ; l'interface et la navigation restent visibles.

## Travailler sur le projet avec Claude Code

```bash
git clone <adresse du dépôt>
cd emcv-saas
claude
```

Claude Code lit automatiquement `CLAUDE.md`, qui décrit l'architecture, les conventions, les rôles, la sécurité et les points ouverts.

## Contenu

| Dossier | Contenu |
|---|---|
| `app/` | L'application (une seule page HTML) |
| `docs/` | Cahier de conception, historique des décisions, étude Côte d'Ivoire, Word des compétences |
| `docs/sources/` | Notes manuscrites d'origine, Word original, anciennes versions |
| `brand/` | Logo EMCV (SVG) et sources du canevas de logo |
| `data/seed/` | Données de référence (classes, départements, GC, églises) |
| `tests/` | Test de rendu de tous les écrans, captures d'écran |

## Tests

```bash
npm install
npm test           # rend chaque sous-menu pour chaque rôle
npm run captures   # captures ordinateur et téléphone
```
