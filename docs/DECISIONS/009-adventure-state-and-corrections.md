# DEC-009 — État d'aventure et corrections

- **Statut :** validée
- **Contexte :** la fiche doit conserver un état D&D complet et permettre au MJ
  d'arbitrer une exception sans créer d'incohérence ni effacer l'historique.

## Décision

La monnaie d'un personnage conserve séparément les pièces de cuivre, d'argent,
d'électrum, d'or et de platine. Aucune conversion automatique ne remplace les
dénominations détenues. Une valeur totale peut être affichée comme dérivé ; tout échange
de pièces est une action explicite.

Tout MJ actif de la campagne peut corriger l'état d'aventure à tout moment, y compris
pendant un combat. La correction exige un motif et conserve ancienne valeur, nouvelle
valeur, auteur, date, version et conséquences automatiques. Elle compense l'événement
erroné sans le supprimer ni réécrire l'historique.

Une correction respecte les invariants structurels et passe par les mêmes transitions
que toute autre mutation. Le MJ corrige l'intention ; le système recalcule dans une
seule opération les effets dépendants. Il est ainsi impossible de conserver des jets de
mort actifs avec des PV positifs, de dépasser un maximum, de produire une quantité
négative ou de référencer une ressource extérieure à la campagne.

Une règle exceptionnelle non encore automatisée peut être citée comme source d'une
correction, tant que l'état final reste structurellement valide.

## Conséquences

- L'état d'aventure, le build et leurs dérivés restent trois notions distinctes.
- Les cinq monnaies, leur provenance et leur poids futur restent représentables.
- Les commandes ordinaires et les corrections utilisent le même moteur de transition.
- Le détail d'une correction n'est visible que du joueur assigné et des MJ autorisés ;
  les projections publiques exposent seulement le nouvel état permis.
- Une correction multi-champs est fonctionnellement indivisible. Le choix technique
  d'une transaction MongoDB reste reporté à la Phase 5.
- Les 91 règles détaillées et leurs critères d'acceptation sont dans la
  [`matrice B04`](../rules/dnd-2024/B04-CHARACTER-SHEET-AND-ADVENTURE-STATE.md).
