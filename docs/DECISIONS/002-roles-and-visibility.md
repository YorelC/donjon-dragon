# DEC-002 — Rôles, propriété et visibilité

- **Statut :** validée
- **Contexte :** joueur, MJ et propriétaire ont des responsabilités différentes et une
  même personne peut changer de rôle au cours d'une campagne.

## Décision

- Les rôles sont propres à chaque campagne.
- Une campagne a exactement un propriétaire actif, au moins un MJ actif et peut avoir
  plusieurs co-MJ.
- Le créateur commence propriétaire et MJ.
- Le propriétaire qui quitte transfère d'abord la propriété à un MJ actif.
- Un joueur contrôle au maximum un personnage assigné par campagne.
- Seul un MJ attribue ou réattribue un personnage.
- La promotion joueur vers MJ désassigne son personnage.
- La rétrogradation MJ vers joueur retire immédiatement ses privilèges et impose le
  choix ou la création d'un personnage avant le retour au parcours normal.
- Un joueur voit sa fiche complète, pas celles des autres. Les MJ voient toutes les
  fiches. Le combat expose seulement le résumé public prévu par la spécification.
- Toutes les ressources sont isolées par campagne côté serveur.

## Conséquences

L'autorisation ne peut reposer ni sur l'interface ni sur la seule connaissance d'un
identifiant. Chaque lecture et mutation doit vérifier simultanément l'appartenance de
l'utilisateur, son rôle et l'appartenance de la ressource à la campagne.
