# Google Search Essentials : points à retenir

Source : https://developers.google.com/search/docs/essentials (dernière mise à jour de la page : 10 décembre 2025, consultée le 24 novembre 2026).
Sous-pages utilisées : « Technical requirements » (18 décembre 2025) et « Spam policies ».

Être référencé dans Google Search est gratuit. Aucun paiement ne donne droit à un meilleur classement.

## 1. Exigences techniques (le minimum)

1. **Googlebot n'est pas bloqué** : la page est accessible publiquement, sans connexion, et n'est pas exclue par `robots.txt` ou par une balise `noindex`.
2. **La page fonctionne** : elle répond avec le code HTTP 200. Une page d'erreur n'est pas indexée.
3. **La page contient du texte indexable** dans un format reconnu et respecte les règles anti-spam.

**Attention pour EMCV** : les espaces réservés aux membres (fiches, annuaire, données personnelles) doivent être protégés par connexion et exclus de l'indexation. Seules les pages publiques (accueil, présentation de l'église, événements) doivent être accessibles à Google.

## 2. Pratiques recommandées

- Rédiger un contenu **utile et fiable, pensé pour les personnes** et non pour les moteurs.
- Utiliser dans le titre et le titre principal (`<h1>`) les mots que les gens utilisent pour chercher (par exemple « église Abidjan », « horaires des cultes »).
- Donner un **texte descriptif** aux images (attribut `alt`) et des libellés clairs aux liens.
- Rendre les liens **explorables** : un lien doit être une vraie balise `<a href>`, pas un simple clic JavaScript.
- Ajouter les **données structurées** (`schema.org`) pour l'église, les événements et les horaires, si le contenu le permet.
- Fournir un plan du site (sitemap) et le déclarer dans Search Console.
- Contrôler ce qui apparaît dans les résultats : `noindex` pour ce qui ne doit pas être trouvé, `robots.txt` pour l'exploration.

## 3. Politiques anti-spam (ce qui fait baisser ou disparaître un site)

Liste des catégories de la page officielle :

- Cloaking (montrer un contenu différent à Google et aux visiteurs)
- Pages-portes (doorway) : multiplier des pages très proches pour capter des recherches
- Domaines expirés rachetés pour leur réputation
- Contenu piraté (hacked content)
- Texte ou lien cachés
- Bourrage de mots-clés (keyword stuffing)
- Spam de liens
- Trafic généré automatiquement (robots, scraping)
- Pratiques malveillantes, fraudes et arnaques
- Redirections trompeuses
- Contenu créé à grande échelle sans valeur (scaled content abuse)
- Affiliation sans contenu propre (thin affiliation)
- Spam dans les contenus publiés par les utilisateurs (commentaires, forums)

**Ce que cela implique pour EMCV** : aucun texte copié de sites d'autres églises, aucune page générée en série pour chaque ville ou chaque mot-clé, aucun lien acheté.

## Points à vérifier

- [ ] La page d'accueil publique renvoie le code 200 et est indexable.
- [ ] Les pages membres sont protégées et non indexables.
- [ ] Un fichier `sitemap.xml` existe et est soumis dans Search Console.
- [ ] Chaque page publique a un titre et un `<h1>` propres.
