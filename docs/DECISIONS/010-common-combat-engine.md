# DEC-010 — Géométrie et arbitrages du moteur de combat

- **Statut :** validée
- **Contexte :** le moteur commun doit appliquer toutes les règles de combat D&D 2024
  sur une carte continue, métrique et 2D, sans masquer les choix du MJ ni ralentir
  inutilement les tours.

## Décision

La carte emploie des empreintes circulaires et une distance euclidienne mesurée entre
leurs périmètres. Les diamètres fonctionnels sont `0,75 m` pour une créature Minuscule,
`1,5 m` pour Petite ou Moyenne, `3 m` pour Grande, `4,5 m` pour Très grande et au moins
`6 m` pour Gigantesque. Les règles exprimées au pied près utilisent l'unité de jeu
`1 pied = 0,3 m` ; les valeurs par pas de 5 pieds restent donc exactement `1,5 m`.

La carte reste un plan horizontal. Un pion peut cependant porter une altitude métrique
visible avec un badge ou une ombre. Portées et déplacements combinent composantes
horizontale et verticale, ce qui permet d'automatiser vol, saut et chute sans interface
2,5D ou 3D.

Un monstre meurt immédiatement à 0 PV par défaut. Le MJ peut marquer une instance dès
la préparation pour lui appliquer les règles des personnages. Lorsqu'une instance non
marquée atteint 0 PV, une courte décision privée permet encore au MJ de choisir cette
exception avant révélation ; sans réponse, la mort immédiate s'applique.

Une Réaction optionnelle ouvre par défaut une fenêtre de 15 secondes, configurable par
campagne entre 5 et 60 secondes. Le MJ peut prolonger ou clore une fenêtre particulière ;
l'expiration vaut refus. Le réglage « Réactions désactivées » désactive uniquement le
compte à rebours : les Réactions et leurs fenêtres subsistent et le MJ les résout
manuellement sans expiration automatique.

Les ennemis ne révèlent aucun nombre de PV par défaut. Leur état visible est discret :
`Indemne` au maximum, `Blessé` sous le maximum et au-dessus de la moitié, `Sanglant` à
la moitié ou moins, puis `À terre` ou `Mort` seulement si cet état est visible. Le MJ
peut révéler explicitement les valeurs exactes.

## Conséquences

- Les pions visibles et leurs limites mécaniques coïncident ; aucune collision carrée
  invisible n'est employée.
- L'altitude est un état mécanique, pas une troisième dimension graphique.
- Toute prévisualisation de portée, chemin, couverture ou zone utilise la même
  géométrie que la validation serveur.
- La conversion métrique privilégie la cohérence de jeu à la conversion SI exacte.
- La mort d'un monstre et les Réactions ne dépendent jamais d'une réponse indéfinie.
- Désactiver le chronomètre ne constitue pas une règle maison supprimant les Réactions.
- Les 114 règles détaillées et leurs critères d'acceptation sont dans la
  [`matrice B05`](../rules/dnd-2024/B05-COMMON-COMBAT-ENGINE.md).
