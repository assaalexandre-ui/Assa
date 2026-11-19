# Cahier de conception — SaaS EMCV

État au 19 novembre 2026. Version en ligne : https://claude.ai/artifact/ELRbehENjkRz9YHePCL1RX — ancien cahier (Claude Docs, antérieur aux dernières évolutions) : https://claude.ai/artifact/2tQ3cp9D58EyugkDFy6tPF

Le SaaS EMCV gère l'Église Missionnaire Christ Vivant (Abidjan) de bout en bout, avec un accès par rôle. La v1 sert une seule église ; le modèle de données (collection `eglises`, champ `eglise` sur la programmation) prépare l'extension à plusieurs assemblées et pays.

## 1. Origine du besoin

- Deux pages de notes manuscrites (`docs/sources/notes-manuscrites-*.jpg`) : Réunions, Programmation, Supervision ; Accueil, Cellules, Bergers, ADNH, Formations (5 classes), Départements, GC (12 groupes).
- Le Word « Compétences » (`docs/sources/competences-original.docx`), remis en forme sans rien ajouter ni retirer dans `docs/competences-par-menu.docx`.
- Une étude des logiciels d'église et des réalités ivoiriennes : `docs/recherche-nomenclature-cote-divoire.md`.

## 2. Menus et sous-menus (29 menus, 81 sous-menus)

### Accueil

| Menu | Sous-menus |
| --- | --- |
| Accueil | Vue d'ensemble |

### Structure de l'église

| Menu | Sous-menus |
| --- | --- |
| Cellules | Liste des cellules · Rapports de cellule · Membres par cellule |
| Bergers | Bergers · Brebis · Absences de la semaine |
| ADNH | Nouveaux venus · Appels à faire · Intégration · Statistiques |
| Formations | Classes · Sessions · Parcours des fidèles |
| Départements | Services de l'église · Autres départements · Planning de service · Rapports |
| GC | Groupes de communion · Présences · Passages de service |
| Réunions | Historique · Objets et points discutés · Décisions · Tâches du conseil |
| Programmation | Calendrier annuel · À venir · Historique · Églises |
| Supervision | Suivi des départements · Rapports des départements |
| Organigramme | Annuaire des responsables · Structure |

### Tableau de bord

| Menu | Sous-menus |
| --- | --- |
| Statistiques | Croissance et présence · Intégration et suivi · Formations · Finances |
| Objectifs à atteindre | Objectifs · Résultats |
| Projets | Projets · Plan d'actions · Planning · Rappels |
| Recommandations | Amélioration de la performance · Résoudre les problèmes · Atteindre les objectifs · Propositions d'alternatives |
| Rapports | Rapport complet ou partiel |

### Fidèles et pastorale

| Menu | Sous-menus |
| --- | --- |
| Fidèles | Fichier des fidèles · Anniversaires |
| Requêtes de prière | Requêtes · Témoignages |
| Enfants | Enfants inscrits · Pointage du dimanche |
| Rendez-vous pastoraux | À venir · Historique |

### Cultes et activités

| Menu | Sous-menus |
| --- | --- |
| Jour de culte | Comptage des présences · Accueil et parking |
| Événements | Inscriptions · Transport |
| Évangélisation | Sorties · Contacts recueillis |
| Sacrements et cérémonies | Baptêmes · Sainte-Cène · Mariages et présentations · Consécrations · Obsèques |

### Finances et ressources

| Menu | Sous-menus |
| --- | --- |
| Dîmes et offrandes | Encaissements · Fonds et campagnes · Relevé par fidèle |
| Budget et dépenses | Budget · Dépenses · États financiers |
| Communication | Annonces · Préparer un message |
| Patrimoine | Inventaire · Entretien |

### Administration

| Menu | Sous-menus |
| --- | --- |
| Administration | Utilisateurs · Rôles et accès · Paramètres de l'église · Dernières modifications |

Les sous-menus marqués « réservés » (ex. Communication → Préparer un message) ne s'affichent qu'en écriture ; Statistiques → Finances n'apparaît qu'aux rôles qui lisent les finances.

## 3. Rôles

| Rôle | Accès |
| --- | --- |
| Administrateur | Pasteur principal ou gestionnaire du logiciel : tous les menus ; seul à fixer les objectifs. |
| Pasteur | Tous les menus sauf l'administration ; finances et objectifs en lecture. |
| Secrétariat | Fichiers, programmation, cérémonies, réunions, projets et communication. |
| Conseil / anciens | Réunions et projets ; tableau de bord, recommandations et finances en lecture. |
| Berger | Ses brebis, ses absences et ses cellules. |
| Équipe ADNH | Accueil, suivi et intégration des nouveaux. |
| Formateur | Classes, sessions, inscrits et absences. |
| Responsable de département | Son département, le planning de service, ses rapports et ses objectifs. |
| Responsable de GC | Son groupe de communion : membres, présences, passages. |
| Trésorier | Dîmes, offrandes, budget, dépenses et patrimoine ; tableau de bord en lecture. |
| Équipe d'intercession | Requêtes de prière et témoignages. |
| Moniteur (enfants) | Enfants inscrits et pointage du dimanche. |
| Fidèle | Annonces, programmation et dépôt de requêtes de prière. |

Le propriétaire de l'artefact et les personnes ayant le droit de modification sont administrateurs d'office. Une personne sans rôle voit « Accès en attente » et sa demande arrive dans Administration → Utilisateurs.

### Accès par menu (M = modification, L = lecture, — = pas d'accès)

| Menu | Administrateur | Pasteur | Secrétariat | Conseil / anciens | Berger | Équipe ADNH | Formateur | Responsable de département | Responsable de GC | Trésorier | Équipe d'intercession | Moniteur (enfants) | Fidèle |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Cellules | M | M | L | — | M | L | — | — | — | — | — | — | — |
| Bergers | M | M | L | — | M | — | — | — | — | — | — | — | — |
| ADNH | M | M | M | — | — | M | — | — | — | — | — | — | — |
| Formations | M | M | M | — | — | L | M | — | — | — | — | — | — |
| Départements | M | M | M | L | — | — | — | M | — | — | — | — | — |
| GC | M | M | L | — | — | L | — | — | M | — | — | — | — |
| Réunions | M | M | M | M | — | — | — | — | — | — | — | — | — |
| Programmation | M | M | M | L | L | L | L | L | L | — | L | L | L |
| Supervision | M | M | L | L | — | — | — | L | — | L | — | — | — |
| Organigramme | M | M | M | L | L | L | — | L | L | — | — | — | — |
| Statistiques | M | M | L | L | — | — | — | — | — | L | — | — | — |
| Objectifs à atteindre | M | L | L | L | — | — | — | L | — | L | — | — | — |
| Projets | M | M | M | M | — | — | — | L | — | L | — | — | — |
| Recommandations | M | M | — | L | — | — | — | — | — | — | — | — | — |
| Rapports | M | M | L | L | — | — | — | — | — | L | — | — | — |
| Fidèles | M | M | M | L | L | M | L | — | L | L | — | — | — |
| Requêtes de prière | M | M | — | — | M | — | — | — | — | — | M | — | M |
| Enfants | M | M | L | — | — | — | — | — | — | — | — | M | — |
| Rendez-vous pastoraux | M | M | M | — | — | — | — | — | — | — | — | — | — |
| Jour de culte | M | M | M | — | — | M | — | — | — | L | — | — | — |
| Événements | M | M | M | — | — | — | — | — | — | M | — | — | — |
| Évangélisation | M | M | M | — | — | — | — | — | — | — | — | — | — |
| Sacrements et cérémonies | M | M | M | — | — | — | — | — | — | — | — | — | — |
| Dîmes et offrandes | M | L | — | L | — | — | — | — | — | M | — | — | — |
| Budget et dépenses | M | L | — | L | — | — | — | — | — | M | — | — | — |
| Communication | M | M | M | — | L | — | — | — | — | — | — | — | L |
| Patrimoine | M | M | L | — | — | — | — | L | — | M | — | — | — |
| Administration | M | — | — | — | — | — | — | — | — | — | — | — | — |

Périmètre : un berger rattaché à sa fiche ne voit que ses brebis et ses cellules ; un responsable de GC, son GC ; un responsable de département, son département, ses rapports et ses objectifs.

## 4. Fonctionnalités clés

| Module | Ce qu'il fait |
| --- | --- |
| ADNH | Nouveaux venus (date, nom, contact), journal d'appels avec résultat, intégration : tribu et GC, classe, cellule, berger → crée la fiche fidèle |
| Bergers | 15 brebis maximum par berger, relevé hebdomadaire des absences |
| Formations | Classes 1 à 4 nommées (Membership, Discipleship, Être leader, Départ / bergers), sessions avec dates, inscrits, absences, validation qui fait passer à la classe suivante |
| GC | 12 groupes : tribu, 5 responsables associés, membres, présences par date, passages de service |
| Réunions | Historique, objets et points discutés, registre des décisions, tâches du conseil faites ou pas |
| Programmation | Calendrier annuel filtrable par église, à venir, historique avec bilan, liste des églises |
| Supervision | Suivi opérationnel des départements, rapports mensuels des responsables |
| Statistiques | Graphiques : croissance et présence, intégration et suivi, formations, finances (12 derniers mois) |
| Objectifs | Fixés par l'administrateur seul (verrou en base) ; but, cible, échéance ; 12 mesures automatiques ou saisie manuelle ; statut Atteint / En cours / Non atteint |
| Projets | Responsable, dates, priorité, budget prévu/dépensé (dépenses rattachées), plan d'actions, journal, planning annuel, rappels J-7 / J-3 / J / retard (aussi sur l'Accueil) |
| Recommandations | Règles automatiques sur 4 thèmes (performance, problèmes, objectifs, alternatives) + analyse rédigée par Claude à la demande (données agrégées, sans noms ni téléphones), enregistrée pour la direction |
| Rapports | Complet ou partiel, période au choix, rubriques : Structure de l'église, Statistiques et objectifs, Projets, Finances, Recommandations ; affichage et PDF |
| Dîmes et offrandes | Encaissements par fonds et moyen (Espèces, Orange Money, MTN MoMo, Moov Money, Wave…), campagnes avec objectif, relevé par fidèle, validation |
| Enfants | Classes d'âge, code de récupération remis au parent, pointage arrivée et sortie |

## 5. Données (collections de la base de l'artefact)

`fideles`, `cellules`, `bergers`, `nouveaux`, `sessions`, `classes`, `presences`, `rapports`, `planning`, `departements`, `rapportsdep`, `gc`, `prieres`, `enfants`, `pointages`, `rdv`, `evenements`, `eglises`, `comptages`, `accueil`, `inscriptions`, `sorties`, `ceremonies`, `reunions`, `taches`, `objectifs`, `responsables`, `projets`, `analyses`, `dons`, `fonds`, `budget`, `depenses`, `annonces`, `inventaire`, `entretiens`, `roles`, `demandes`, `parametres`.

Données de référence exportées dans `data/seed/` : `classes` (4), `departements` (12), `gc` (12), `eglises` (1).

## 6. Cible de production

| Couche | Choix |
| --- | --- |
| Front | Next.js (TypeScript), PWA installable, hors ligne pour le comptage et les pointages |
| Données | PostgreSQL (Supabase) avec RLS : les règles de rôle et de périmètre appliquées en base |
| Connexion | Téléphone +225 et code SMS |
| Paiements | Agrégateur Mobile Money (CinetPay, PayDunya ou Moneroo) |
| Messagerie | WhatsApp Cloud API, SMS Orange en secours |
| App fidèles | React Native (Expo), plus tard |

Modèle conseillé : objets génériques personne / groupe / événement (cellule, GC, département, classe et conseil sont des groupes), table `unite` en arbre pour le multi-églises, permissions `role_permission` (lire, écrire, valider + portée).

## 7. Sécurité et conformité

- Données religieuses = données sensibles (loi n° 2013-450) : autorisation préalable de l'ARTCI, lieu d'hébergement à déclarer.
- Version artefact : seuls `roles` et `objectifs` sont verrouillés en écriture au niveau des données ; le reste est filtré par l'interface. À corriger en production avec la RLS.
- Validation à deux personnes pour les finances, journal des dernières modifications, consentement des fidèles.

## 8. Points ouverts

- Nom de la classe 5 ; contenu du menu Accueil du Word ; libellés « Département de la Sainte… » et « Départements, table des matières ».
- Différence entre cellule et GC.
- Choix de l'agrégateur Mobile Money et de l'hébergement.
