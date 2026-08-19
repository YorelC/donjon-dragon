# Traçabilité produit

## Objectif

Cette matrice relie les exigences cibles, les décisions et l'état actuel. Les liens vers
du code et des tests seront ajoutés lorsque chaque fonctionnalité entrera dans le cycle
`SPEC → PLAN → CODE → TEST → REVIEW`.

| ID | Sujet | Spécification | Décision principale | État au dernier audit |
|---|---|---|---|---|
| SF-001 | Campagnes, rôles et permissions | [REQUIREMENTS](REQUIREMENTS.md#sf-001--campagnes-rôles-et-permissions) | [DEC-002](DECISIONS/002-roles-and-visibility.md) | Partiel, écarts critiques |
| SF-002 | Personnages | [REQUIREMENTS](REQUIREMENTS.md#sf-002--création-validation-et-évolution-dun-personnage) | [DEC-003](DECISIONS/003-character-lifecycle.md), [DEC-008](DECISIONS/008-level-one-character-details.md) | Niveau 1 partiel |
| SF-003 | Cycle de combat | [REQUIREMENTS](REQUIREMENTS.md#sf-003--préparation-lancement-et-reprise-dun-combat) | [DEC-004](DECISIONS/004-combat-and-realtime.md) | Absent |
| SF-004 | Carte, tours et actions | [REQUIREMENTS](REQUIREMENTS.md#sf-004--carte-tours-et-résolution-des-actions) | [DEC-004](DECISIONS/004-combat-and-realtime.md) | Absent |
| SF-005 | Dés, repos, mort et butin | [REQUIREMENTS](REQUIREMENTS.md#sf-005--dés-repos-mort-et-butin) | [DEC-005](DECISIONS/005-dice-rest-and-loot.md) | Majoritairement absent |
| SF-006 | Invitations et contenu personnalisé | [REQUIREMENTS](REQUIREMENTS.md#sf-006--invitations-courriels-et-contenu-personnalisé) | [DEC-006](DECISIONS/006-custom-content-and-infrastructure.md) | Partiel |

La matrice D&D 2024 est découpée dans
[`DND-2024-COMPLIANCE-PLAN.md`](DND-2024-COMPLIANCE-PLAN.md). Les identifiants de règles
propres à chaque bloc seront ajoutés ici après validation du bloc correspondant.

## Règle pour les travaux futurs

Tout ticket fonctionnel important doit mentionner :

- un identifiant `SF-xxx` ou une section précise de spécification ;
- les critères d'acceptation qu'il couvre ;
- les décisions applicables ;
- les tests ajoutés ou modifiés ;
- les écarts volontairement laissés hors périmètre.

Si aucune exigence ne décrit le comportement demandé, le travail retourne à l'étape
SPEC. Une information manquante est inscrite comme **DÉCISION REQUISE**, avec les
options et leurs conséquences, avant la planification.

## Évolution du statut

Les valeurs recommandées pour le suivi sont :

- `NON_IMPLÉMENTÉ` ;
- `PARTIEL` ;
- `IMPLÉMENTÉ_NON_VÉRIFIÉ` ;
- `VÉRIFIÉ` ;
- `DÉPRÉCIÉ`.

Un statut `VÉRIFIÉ` nécessite des tests automatisés pertinents et une revue du diff ;
la seule présence de code ne suffit pas.
