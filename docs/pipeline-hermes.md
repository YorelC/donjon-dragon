# Pipeline de production et conventions Kanban

Procédure d'équipe, pas convention de code : ce document n'est chargé dans aucune
session. `CLAUDE.md` y renvoie, on l'ouvre quand on pilote le pipeline.

## Chaîne de production (v3)

```
Charly ⇄ margarette      clarification et décisions produit
        ↓ ticket [SPEC]
analyste                 exigences atomiques et testables, dans specs/
        ↓
architecte               ADR, schémas Zod shared/, ports application/ports/, plan
        ↓ [designer si UI]
orchestrateur            découpe en tâches petites et cohérentes
        ↓
testeur ∥ ouvrier/dev-senior     en dual-sandbox
        ↓ ticket [INTEG]
revieweur                fusion tests + code, traçabilité spec ↔ test ↔ commit
        ↓
devops                   CI, déploiement
        ↓
scribe                   changelog, doc
```

`securite` fait un audit transversal avant release.

**Routage du code** : seules les exigences algorithmiques et les bugs difficiles vont à
`dev-senior` (pont `claude -p`) ; tout le reste va à `ouvrier`. Les tests sont écrits
par le `testeur`, jamais par l'architecte ni par les devs.

**Règle qui tient la chaîne** : chaque agent ne franchit jamais l'étape suivante à la
place de celui dont c'est le rôle.

## Kanban (board Hermès `dnd-saas`)

- Les commits suivent le format `type(scope): sujet`. Les identifiants internes du
  Kanban et les anciens identifiants d'unités atomiques ne sont pas requis dans les
  spécifications, les tests ou les commits.
- Lire le fichier `MODE` à la racine avant toute tâche. Terminer par `kanban_complete`
  avec ses metadata : `changed_files`, `commands_run`, `test_results`,
  `next_agent_hints`.
- Blocages normalisés : `review-required:` / `decision-needed:` / `quota:` /
  `dependency:`.
- Granularité : standard défini dans `04-granularite.md`. Une tâche de code couvre un
  petit ensemble de comportements cohérents, sur une seule couche hexagonale. Tâche
  floue ou trop grosse → `kanban_block("dependency: tâche à redécouper — <motif>")`.
  **Refuser est un succès.**
- Dual-sandbox : le `testeur` ne lit que `shared/` et les `domain/` des modules ; les
  devs ne lisent jamais les fichiers de test du testeur ; la fusion se fait chez le
  `revieweur`.

## Hermès

Documentation de l'outil (CLI, config, Kanban) : `knowledges/hermes-guide.md`.
Hermès est installé hors du repo, dans `%LOCALAPPDATA%\hermes\`.
