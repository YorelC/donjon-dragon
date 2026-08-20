# DEC-011 — Sorts et effets magiques

- **Statut :** validée
- **Contexte :** les 391 sorts du *Player's Handbook 2024* mêlent conséquences
  déterministes, arbitrages narratifs, durées longues, composants et effets persistants.
  Le produit doit respecter leurs règles sans transformer chaque cas subjectif en code
  arbitraire ni dépendre du temps réel.

## Décision

Le serveur automatise toute conséquence déterministe d'un sort. Lorsqu'une clause
exige une interprétation, une création libre ou une réponse du monde, le lancement
valide dépense normalement ses ressources puis ouvre une résolution explicite du MJ.
L'intention, les choix, la décision et les conséquences restent auditables ; une
résolution manuelle ne permet pas de contourner les invariants mécaniques.

En combat, rounds, tours et déclencheurs font avancer automatiquement les durées. Hors
combat, aucune durée de jeu ne dépend de l'horloge réelle : le MJ avance explicitement
le temps fictionnel. Les effets qui dépassent une scène sont conservés dans un registre
de campagne et rattachés à une créature, un objet ou un lieu nommé. Une carte globale
du monde n'est pas requise.

Un focaliseur autorisé ou une sacoche à composantes abstrait les composants matériels
génériques, gratuits et non consommés. Un composant tarifé, consommé ou désigné comme objet précis
doit réellement être détenu ; il est consommé seulement lorsque le sort le dit. B07
précisera le catalogue et les manipulations d'inventaire sans modifier cette règle.

La préparation respecte les quotas du PHB. Une fenêtre ouverte après repos long peut
être sauvegardée plusieurs fois, mais son changement net reste limité : Clerc, Druide
et Magicien peuvent remplacer tout leur quota ; Paladin et Rôdeur un seul sort. Barde,
Ensorceleur et Occultiste changent au plus un sort lors d'un gain de niveau, sauf
exception explicite. Les autres sources gardent leurs propres moments et quotas.

Les effets secrets suivent la projection du PHB et les permissions de campagne. Un
joueur ne reçoit jamais la raison interne révélant une cible invalide, une illusion, une
créature cachée ou un résultat privé ; les MJ autorisés conservent la vue complète.

## Conséquences

- Chaque sort possède un profil fonctionnel structuré couvrant prérequis, paramètres,
  coûts, cibles, échéances, conséquences automatiques et éventuelle étape MJ.
- Un effet narratif n'est pas qualifié d'« automatisé » parce qu'une note libre existe.
- Les durées survivent aux changements de scène, reconnexions et redémarrages.
- Les composants tarifés, consommés ou précis relient B06 à l'inventaire B07.
- Les invocations emploient les profils B08, tout en conservant dans B06 leur source,
  contrôleur, durée, initiative et règles de disparition.
- Les 82 règles communes sont dans la
  [`matrice B06`](../rules/dnd-2024/B06-SPELLS-AND-MAGICAL-EFFECTS.md) et les 391
  profils dans son [`registre`](../rules/dnd-2024/B06-SPELL-REGISTRY.md).
