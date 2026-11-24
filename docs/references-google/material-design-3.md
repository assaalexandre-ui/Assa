# Material Design 3 : points à retenir

Source : https://m3.material.io/ (pages « Color system » et « Typography », consultées le 24 novembre 2026).
Référence complète : https://m3.material.io/styles

## Couleurs

- Le système repose sur des **rôles de couleur** (26 et plus) : chaque élément reçoit un rôle selon son importance, son type de conteneur et ses relations avec les autres éléments. Un rôle n'est pas une couleur choisie à la main.
- Les couleurs de texte et d'icônes doivent rester **lisibles** : le contraste est prévu par le système, il ne faut pas le contourner.
- Trois niveaux de contraste existent (standard, moyen, élevé). Les utilisateurs peuvent choisir le leur, il faut donc tester l'interface dans les trois.
- Une couleur « fixe » garde la même valeur en mode clair et en mode sombre. À réserver aux couleurs sémantiques (succès, alerte, erreur).
- Les surfaces se distinguent par leur **ton** (niveau de clarté), pas par une ombre superposée.

**Ce que cela implique pour EMCV** : les jetons de couleur (`:root`) doivent être regroupés par rôle (fond, texte, action, alerte), et non par couleur. Les couleurs de vitrail restent possibles, à condition que le texte qui les accompagne garde un contraste suffisant.

## Typographie

- L'échelle compte **30 styles** : 15 de base et 15 « emphasized » (accentués) pour mettre en valeur un moment précis.
- Cinq rôles : **display** (très grand), **headline** (titre de section), **title** (titre de bloc), **body** (texte courant), **label** (étiquette, bouton, légende).
- Utiliser les **jetons** de typographie plutôt que des tailles fixes : la taille s'adapte à l'appareil et aux préférences de l'utilisateur.
- La hauteur de ligne s'adapte à la langue (script) : prévoir de l'espace vertical supplémentaire pour les textes longs.

**Ce que cela implique pour EMCV** : la police actuelle (Sora dans la version Next.js, Bricolage Grotesque pour les titres) peut être rangée dans ces cinq rôles. Les titres et les étiquettes de boutons doivent avoir chacun un rôle défini.

## Points à vérifier dans l'interface

- [ ] Deux couleurs de texte sur fond ne sont pas en contraste suffisant (tester en contraste élevé).
- [ ] Chaque titre de section utilise le rôle « headline » ou « title », pas une taille arbitraire.
- [ ] Les textes ne sont pas coupés quand la taille de police augmente.
