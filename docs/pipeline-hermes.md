# Pipeline de production et conventions Kanban

Procédure d'équipe, pas convention de code : ce document n'est chargé dans aucune
session. `CLAUDE.md` y renvoie, on l'ouvre quand on pilote le pipeline.

## Chaîne de production (v3)

```
Charly ⇄ margarette      clarification, réponses R-NNN via la skill product
        ↓ ticket [SPEC]
analyste                 spec en unités atomiques UA-NNN, dans specs/
        ↓
architecte               ADR, schémas Zod shared/, ports application/ports/, plan E-NNN
        ↓ [designer si UI]
orchestrateur            découpe en tickets de 1 à 3 UA
        ↓
testeur ∥ ouvrier/dev-senior     en dual-sandbox
        ↓ ticket [INTEG]
revieweur                fusion tests + code, traçabilité UA ↔ test ↔ commit
        ↓
devops                   CI, déploiement
        ↓
scribe                   changelog, doc
```

`securite` fait un audit transversal avant release.

**Routage du code** : seules les UA taguées `[ALGO]` et les bugs difficiles vont à
`dev-senior` (pont `claude -p`) ; tout le reste va à `ouvrier`. Les tests sont écrits
par le `testeur`, jamais par l'architecte ni par les devs.

**Règle qui tient la chaîne** : chaque agent ne franchit jamais l'étape suivante à la
place de celui dont c'est le rôle.

## Kanban (board Hermès `dnd-saas`)

- Chaque tâche vient d'un ticket `t_xxxx`, et l'ID figure dans chaque commit :
  `type(scope): sujet [t_xxxx][UA-NNN]`.
- Lire le fichier `MODE` à la racine avant toute tâche. Terminer par `kanban_complete`
  avec ses metadata : `changed_files`, `commands_run`, `test_results`,
  `next_agent_hints`.
- Blocages normalisés : `review-required:` / `decision-needed:` / `quota:` /
  `dependency:`.
- Granularité : standard défini dans `04-granularite.md` (chaîne R → UA → INV → E →
  ticket → test). Un ticket de code vaut 1 à 3 UA, sur une seule couche hexagonale.
  Ticket flou ou trop gros → `kanban_block("dependency: ticket à redécouper — <motif>")`.
  **Refuser est un succès.**
- Dual-sandbox : le `testeur` ne lit que `shared/` et les `domain/` des modules ; les
  devs ne lisent jamais les fichiers de test du testeur ; la fusion se fait chez le
  `revieweur`.

## Hermès

Documentation de l'outil (CLI, config, Kanban) : `knowledges/hermes-guide.md`.
Hermès est installé hors du repo, dans `%LOCALAPPDATA%\hermes\`.
