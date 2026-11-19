# Historique des décisions

Les demandes d'Alexandre dans l'ordre, et ce qui a été fait. Utile pour comprendre pourquoi l'application est construite ainsi.

| Date | Demande | Décision / réalisation |
| --- | --- | --- |
| 31 oct. 2026 | Retranscrire deux photos de notes manuscrites (agenda) | Retranscription colonne par colonne ; passages illisibles signalés |
| 31 oct. | En faire le plan d'un SaaS pour une église évangélique internationale, accès à chaque niveau | Cahier de conception (Claude Docs) + première maquette cliquable ; choix : multi-églises, Next.js + Supabase, dîmes Mobile Money, app fidèles, FR/EN, SMS/WhatsApp |
| 31 oct. | Se concentrer sur une seule église à Abidjan, menus adaptés aux réalités ivoiriennes | Étude par un agent (logiciels d'église, ARTCI, Mobile Money, WhatsApp) → nomenclature en 6 sections, modèle personne/groupe/événement |
| 31 oct. | L'église s'appelle EMCV ; couleur plus claire ; ajouter des fonctionnalités importantes | Renommage, palette bleu clair, 7 modules ajoutés (prière, enfants, évangélisation, événements, prédications, rendez-vous, patrimoine) + campagnes de dons |
| 31 oct. | Logo typographique original | Canevas : concept 1 « Lumière » (croix dorée dans le C) et concept 2 « Monogramme » ; **concept 1 retenu** (confirmé le 6 nov.) |
| 31 oct. | Nom du cahier : « SaaS EMCV » | Cahier renommé |
| 3 nov. | Se baser sur le Word des compétences, menus améliorés, sans rien ajouter ni retirer ; design clair et épuré | `docs/competences-par-menu.docx` : tableau 7 colonnes, orthographe corrigée, passages flous marqués « à compléter » |
| 3 nov. | Créer l'application (artefact) | Application avec les 7 menus du Word + tableau de bord, données partagées ; elle remplace la maquette à la même adresse |
| 3 nov. | SaaS plus élaboré avec sous-menus ; Word + cahier ; accès par rôle | 24 menus / 62 sous-menus, 13 rôles, périmètre berger / GC / département, demandes d'accès |
| 3 nov. | Ajouter Réunions, Programmation, Supervision avec leurs sous-menus | Section dédiée ; réunions (historique, objets et points, décisions, tâches faites ou pas), calendrier annuel de toutes les églises, suivi des départements et KPI |
| 3 nov. | Vie de l'église juste après l'Accueil, avec une 3e couleur | Section en vert émeraude |
| 3 nov. | Interface trop blanche | Barre latérale bleu nuit, fond bleu-gris, en-têtes teintés, liserés de couleur |
| 6 nov. | Réunions, Programmation, Supervision dans la Vie de l'église ; section « Tableau de bord » avec Statistiques, Objectifs (fixés par l'admin), Projets (échéances, rappels, plans d'actions), Rapport complet ou partiel | Réponses : Organigramme dans la structure, objectifs auto + manuels, rappels dans l'application, rapport en page + PDF ; tous les graphiques, toutes les rubriques |
| 6 nov. | « Vie de l'église » → « Structure de l'église » | Renommé |
| 6 nov. | Rubrique Recommandations (performance, problèmes, objectifs, alternatives) | Règles automatiques + analyse Claude, réservée à la direction |
| 6 nov. | Recommandations dans le rapport PDF | Ajoutées (tableaux par thème + dernières analyses) |
| 19 nov. | Tout transférer dans Claude Code | Ce dépôt : application, documentation, CLAUDE.md, logo, données de référence, tests |
| 19 nov. | Passer à Next.js + Supabase pour que des responsables testent ; accès simples, sans nom de domaine | « Petit test » : Accueil, Fidèles, Bergers, ADNH, Administration ; approche C (tables simples + église + droits en table) ; connexion email + mot de passe, comptes créés par l'admin ; berger : crée et rattache ses brebis (noms seulement pour les fidèles sans berger) ; données fictives ; guide `docs/mise-en-ligne.md` |
| 19 nov. | Mettre le site en ligne | Projet Supabase créé par Alexandre ; base installée par l'éditeur SQL (`supabase/installation-complete.sql`) ; projet Vercel `emcv-test` créé et configuré par Claude (serveur à Paris) ; site en ligne sur https://emcv-test.vercel.app ; création de comptes vérifiée |
