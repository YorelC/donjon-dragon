# DEC-003 — Cycle de vie du personnage

- **Statut :** validée
- **Contexte :** le joueur doit rester impliqué dans ses choix, tandis que le MJ
  garantit qu'une fiche est prête pour la campagne.

## Décision

La fiche de niveau 1 est créée intégralement puis soumise au MJ. Il n'existe ni
sauvegarde automatique additionnelle exigée, ni période de modification libre avant le
premier combat. Une fiche acceptée engage les choix du joueur.

Tout MJ actif de la campagne peut accepter ou refuser seul une fiche. Une fiche créée
par un MJ peut être acceptée immédiatement par ce même MJ. Un refus exige un motif
visible du créateur. Le créateur corrige la fiche refusée puis la resoumet ; la nouvelle
soumission remplace la version à examiner, tandis que le dernier motif et l'historique
des décisions de validation restent conservés à des fins d'audit.

Après validation, nom, espèce/lignée, historique et taille sont immuables. Portrait,
description, âge et poids restent modifiables. Le portrait téléversé sert aussi de pion ;
un profil générique est utilisé par défaut.

Changer de classe ou de caractéristiques impose une respécialisation complète depuis
le niveau 1 jusqu'au niveau total actuel. Le multiclassage est permis, l'inventaire est
conservé, les maîtrises et toutes leurs conséquences sont recalculées, et la nouvelle
construction requiert l'approbation du MJ. Cette opération ne soigne pas le personnage.

Un MJ actif déverrouille cette respécialisation et seul le joueur assigné reconstruit
le candidat. Les six valeurs de caractéristiques de base et leur méthode sont
conservées mais réassignables ; aucun nouveau tirage n'est permis. L'ancienne fiche
acceptée reste active jusqu'à l'acceptation atomique de la nouvelle. Un refus motivé
laisse le candidat corrigeable et resoumissible.

Le joueur ne peut commencer, reprendre ou soumettre la reconstruction pendant
`EN_COURS`, `EN_PAUSE` ou `BUTIN`, et le candidat ne peut alors être accepté ni activé.
Possessions et états externes au build sont conservés, notamment port, monnaie,
harmonisation, PV temporaires, inspiration, concentration, conditions, épuisement et
état relatif à la mort. Les dés de vie, emplacements et ressources de classe sont
remplacés par les pools pleins du nouveau build. Les PV actuels sont écrêtés au nouveau
maximum sans soin en cas de hausse.

La progression n'utilise pas l'expérience. Un MJ actif déverrouille individuellement
le niveau suivant d'un personnage accepté et assigné à un joueur. Il peut aussi lancer
une action groupée qui cible automatiquement tous les personnages acceptés et assignés
aux joueurs de la campagne ; chaque personnage éligible reçoit un niveau en attente,
et un personnage inéligible est signalé sans bloquer les autres.

Le joueur assigné complète et finalise seul la progression, sans seconde approbation
du MJ. Le MJ peut déverrouiller à tout moment, mais le joueur ne peut ni commencer ni
finaliser pendant `EN_COURS`, `EN_PAUSE` ou `BUTIN`.

Le MJ peut révoquer un niveau en attente avant le premier choix ou jet de PV persisté.
Dès que la progression a commencé, le déverrouillage est irrévocable. Une montée de
niveau n'accorde aucun repos, soin ou renouvellement implicite de ressource.

## Décisions remplacées ou précisées

Une hypothèse antérieure autorisait certaines modifications avant le premier combat et
évoquait le nom comme champ modifiable. La décision finale ci-dessus la remplace : après
validation, le nom est immuable et il n'existe aucune fenêtre libre avant combat.

Le 20 août 2026, la validation du bloc B02 a précisé le déverrouillage groupé, l'auteur
de la finalisation, les états de combat interdits et la révocation d'un niveau en
attente. Ces précisions ne modifient pas le principe initial d'une progression sans PX.

Le 20 août 2026, la validation du bloc B03 a précisé l'autorisation, la fenêtre, les
caractéristiques, la fiche active et la conservation d'état d'une respécialisation.
Elle a aussi fixé l'arrondi séparé de chaque classe fractionnaire pour les emplacements
multiclasses. Ces précisions complètent la reconstruction complète décidée ci-dessus.
