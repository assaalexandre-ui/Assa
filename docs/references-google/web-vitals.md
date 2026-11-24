# Web Vitals (Core Web Vitals) : points à retenir

Source : https://web.dev/articles/vitals (page mise à jour le 31 octobre 2024, consultée le 24 novembre 2026).

## Les trois indicateurs

| Indicateur | Ce qu'il mesure | Bon seuil |
|---|---|---|
| **LCP** (Largest Contentful Paint) | Vitesse d'affichage du plus gros élément visible | 2,5 secondes ou moins |
| **INP** (Interaction to Next Paint) | Réactivité après un clic, une saisie ou un toucher | 200 millisecondes ou moins |
| **CLS** (Cumulative Layout Shift) | Stabilité : la page ne bouge pas pendant la lecture | 0,1 ou moins |

- Le seuil se mesure au **75e percentile** des visites, séparément sur mobile et sur ordinateur.
- Ces trois indicateurs sont **stables** (ils ne changent pas plus d'une fois par an).

## Outils

- **Terrain (données réelles)** : PageSpeed Insights, rapport Core Web Vitals de Search Console, Chrome DevTools.
- **Laboratoire (test avant mise en ligne)** : Lighthouse, DevTools. Le laboratoire ne remplace pas la mesure terrain.
- Pour mesurer soi-même, la bibliothèque `web-vitals` (JavaScript) est recommandée.

## Ce que cela implique pour EMCV

- Les images et polices chargées au démarrage doivent être légères (LCP).
- Les actions fréquentes (recherche, ouverture de fiche, enregistrement) doivent répondre en moins de 200 ms (INP).
- Les éléments qui apparaissent après coup (bandeaux, annonces, chargements de liste) ne doivent pas décaler le contenu (CLS). Prévoir la place avant d'afficher les données.
- Pour la version `web/` : mesurer dès le déploiement sur `emcv-test.vercel.app`, avant toute optimisation.

## Points à vérifier

- [ ] Mesure PageSpeed Insights (mobile) sur l'accueil et sur une liste longue.
- [ ] Aucun décalage visible au chargement des listes et des tableaux de bord.
- [ ] Le clic sur un bouton donne un retour visuel immédiat.
