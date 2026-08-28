# Traçabilité produit

## Objectif

Cette matrice relie les exigences cibles, les décisions et l'état actuel. Les liens vers
du code et des tests seront ajoutés lorsque chaque fonctionnalité entrera dans le cycle
`SPEC → PLAN → CODE → TEST → REVIEW`.

| ID | Sujet | Spécification | Décision principale | État au dernier audit |
|---|---|---|---|---|
| SF-001 | Campagnes, rôles, amitiés et permissions | [REQUIREMENTS](REQUIREMENTS.md#sf-001--campagnes-rôles-et-permissions), [fondation comptes, sessions et amitiés](../specs/008-account-auth-friendship-foundation.md), [incrément création atomique](../specs/004-campaign-foundation.md), [cycle d'invitation](../specs/005-campaign-invitation-lifecycle.md), [cycle des rôles, propriété et départ](../specs/006-campaign-role-ownership-lifecycle.md), [attribution, vivier et visibilité](../specs/007-character-assignment-visibility.md) | [DEC-002](DECISIONS/002-roles-and-visibility.md), [DEC-013](DECISIONS/013-monsters-npcs-and-summoned-creatures.md), [DEC-016](DECISIONS/016-target-mongodb-persistence.md) | `VÉRIFIÉ` pour les Specs 004 à 008 : Spec 007 couvre attribution atomique et idempotente, vivier, isolation, projections par audience, permissions immédiates et preuves unitaires/Mongo/Bruno |
| SF-002 | Personnages | [REQUIREMENTS](REQUIREMENTS.md#sf-002--création-validation-et-évolution-dun-personnage), [attribution, vivier et visibilité](../specs/007-character-assignment-visibility.md) | [DEC-003](DECISIONS/003-character-lifecycle.md), [DEC-008](DECISIONS/008-level-one-character-details.md), [DEC-009](DECISIONS/009-adventure-state-and-corrections.md), [DEC-011](DECISIONS/011-spells-and-magical-effects.md), [DEC-012](DECISIONS/012-equipment-items-and-possessions.md), [DEC-014](DECISIONS/014-game-surrounding-product-rules.md), [DEC-017](DECISIONS/017-executable-versioned-rule-model.md) | `VÉRIFIÉ` pour Spec 007 : auto-attribution joueur, remplacement atomique, lectures privées et projection enrichie sans fuite ; création D&D et moteur restent partiels hors de cet incrément |
| SF-003 | Cycle de combat | [REQUIREMENTS](REQUIREMENTS.md#sf-003--préparation-lancement-et-reprise-dun-combat) | [DEC-004](DECISIONS/004-combat-and-realtime.md), [DEC-010](DECISIONS/010-common-combat-engine.md), [DEC-013](DECISIONS/013-monsters-npcs-and-summoned-creatures.md), [DEC-016](DECISIONS/016-target-mongodb-persistence.md), [DEC-017](DECISIONS/017-executable-versioned-rule-model.md) | Références figées, transition et reprise exacte spécifiées ; moteur pur validé, continuations provisoires ; non implémenté |
| SF-004 | Carte, tours et actions | [REQUIREMENTS](REQUIREMENTS.md#sf-004--carte-tours-et-résolution-des-actions) | [DEC-004](DECISIONS/004-combat-and-realtime.md), [DEC-010](DECISIONS/010-common-combat-engine.md), [DEC-011](DECISIONS/011-spells-and-magical-effects.md), [DEC-012](DECISIONS/012-equipment-items-and-possessions.md), [DEC-013](DECISIONS/013-monsters-npcs-and-summoned-creatures.md), [DEC-017](DECISIONS/017-executable-versioned-rule-model.md) | Moteur commun spécifié par B05–B08 ; pureté/déterminisme validés, pipeline et primitives provisoires ; non implémenté |
| SF-005 | Dés, repos, mort et butin | [REQUIREMENTS](REQUIREMENTS.md#sf-005--dés-repos-mort-et-butin) | [DEC-005](DECISIONS/005-dice-rest-and-loot.md), [DEC-009](DECISIONS/009-adventure-state-and-corrections.md), [DEC-010](DECISIONS/010-common-combat-engine.md), [DEC-013](DECISIONS/013-monsters-npcs-and-summoned-creatures.md), [DEC-014](DECISIONS/014-game-surrounding-product-rules.md), [DEC-016](DECISIONS/016-target-mongodb-persistence.md), [DEC-017](DECISIONS/017-executable-versioned-rule-model.md) | Repos/mort/butin spécifiés ; hasard et temps cachés interdits, traces détaillées provisoires ; implémentation majoritairement absente |
| SF-006 | Invitations et contenu personnalisé | [REQUIREMENTS](REQUIREMENTS.md#sf-006--invitations-courriels-et-contenu-personnalisé), [cycle d'invitation](../specs/005-campaign-invitation-lifecycle.md) | [DEC-006](DECISIONS/006-custom-content-and-infrastructure.md), [DEC-012](DECISIONS/012-equipment-items-and-possessions.md), [DEC-016](DECISIONS/016-target-mongodb-persistence.md), [DEC-017](DECISIONS/017-executable-versioned-rule-model.md) | `VÉRIFIÉ` pour le cycle distinct `EN_ATTENTE → ACCEPTÉE \| REFUSÉE \| ANNULÉE`, ses autorisations, son idempotence et la demande de courriel par outbox ; livraison du courriel et contenu personnalisé restent hors de cet incrément |

La matrice D&D 2024 est découpée dans
[`DND-2024-COMPLIANCE-PLAN.md`](DND-2024-COMPLIANCE-PLAN.md).

L'architecture commune à SF-001–SF-006, validée le 21 août 2026, est décrite dans
[`TECHNICAL-ARCHITECTURE-5A.md`](TECHNICAL-ARCHITECTURE-5A.md) et résumée par
[`DEC-015`](DECISIONS/015-target-technical-architecture.md).

Le modèle MongoDB commun validé pour SF-001 à SF-006 est décrit dans
[`TECHNICAL-PERSISTENCE-5B.md`](TECHNICAL-PERSISTENCE-5B.md) et résumé par
[`DEC-016`](DECISIONS/016-target-mongodb-persistence.md).

Les principes du modèle exécutable commun pour B01 à B09 sont validés dans
[`TECHNICAL-RULE-MODEL-5C.md`](TECHNICAL-RULE-MODEL-5C.md) et résumé par
[`DEC-017`](DECISIONS/017-executable-versioned-rule-model.md). DR-5C-01 retient le
sous-ensemble prudent. Formes TypeScript, pipeline exact, catalogue de primitives,
traces et continuations seront confirmés incrémentalement par l'implémentation.

## Blocs D&D 2024 validés

| Bloc | Sujet | Spécification | Règles | Décisions | État d'implémentation |
|---|---|---|---:|---|---|
| B01 | Création complète niveau 1 | [Matrice B01](rules/dnd-2024/B01-LEVEL-ONE-CREATION.md) | 85 | DR-B01-01 à DR-B01-04 résolues ; DEC-003 et DEC-008 | `PARTIEL` |
| B02 | Progression niveaux 2 à 20 | [Matrice B02](rules/dnd-2024/B02-LEVELS-TWO-TO-TWENTY.md) | 82 | DR-B02-01 à DR-B02-05 résolues ; DEC-003 | `NON_IMPLÉMENTÉ` |
| B03 | Multiclassage et respécialisation | [Matrice B03](rules/dnd-2024/B03-MULTICLASSING-AND-RESPECIALIZATION.md) | 79 | DR-B03-01 à DR-B03-06 résolues ; DEC-003 | `NON_IMPLÉMENTÉ` |
| B04 | Fiche et état d'aventure | [Matrice B04](rules/dnd-2024/B04-CHARACTER-SHEET-AND-ADVENTURE-STATE.md) | 91 | DR-B04-01 à DR-B04-03 résolues ; DEC-009 | `PARTIEL` |
| B05 | Moteur de combat commun | [Matrice B05](rules/dnd-2024/B05-COMMON-COMBAT-ENGINE.md) | 115 | DR-B05-01 à DR-B05-07 résolues ; DEC-004, DEC-010 et DEC-016 | `NON_IMPLÉMENTÉ` |
| B06 | Sorts et effets magiques | [Matrice B06](rules/dnd-2024/B06-SPELLS-AND-MAGICAL-EFFECTS.md), [registre](rules/dnd-2024/B06-SPELL-REGISTRY.md) | 82 + 391 profils | DR-B06-01 à DR-B06-05 résolues ; DEC-011 | `NON_IMPLÉMENTÉ` |
| B07 | Équipement, objets, maîtrises et bottes d'armes | [Matrice B07](rules/dnd-2024/B07-EQUIPMENT-ITEMS-AND-PROFICIENCIES.md) | 116 + catalogue A–Z | DR-B07-01 à DR-B07-05 résolues ; DEC-012 | `PARTIEL` |
| B08 | Monstres, PNJ et créatures invoquées | [Matrice B08](rules/dnd-2024/B08-MONSTERS-NPCS-AND-SUMMONED-CREATURES.md), [registre](rules/dnd-2024/B08-CREATURE-PROFILE-REGISTRY.md) | 91 + 503 profils XMM + 15 profils PHB | DR-B08-01 à DR-B08-05 et DONNÉE-B08-01 résolues ; DEC-013 | `PARTIEL` |
| B09 | Règles produit autour de la partie | [Matrice B09](rules/dnd-2024/B09-GAME-SURROUNDING-PRODUCT-RULES.md) | 90 | DR-B09-01 à DR-B09-07 résolues ; DEC-014 | `NON_IMPLÉMENTÉ` |

Les statuts d'implémentation décrivent le code existant : ils ne remettent pas en
cause la validation des spécifications B01 à B09.

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
