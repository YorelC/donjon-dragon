# Workflow Kanban Hermès — Conventions du board (v2, stack réelle)

Board dédié : `dnd-saas`. Repo : `C:\_work\my_projects\donjon-dragon`.

```bash
hermes kanban boards create dnd-saas --name "SaaS D&D" --description "VTT simplifie - pipeline agents"
hermes kanban boards switch dnd-saas
```

## 1. Correspondance colonnes ↔ process

| Statut Hermès | Usage dans notre pipeline |
|---|---|
| `triage` | Idées brutes (bugs remontés, idées hors Discord). Les [SPEC] de Margarette arrivent déjà spécifiés |
| `todo` | Spécifié mais bloqué par un parent |
| `ready` | Débloqué, le dispatcher va le confier au profil `assignee` |
| `running` | Un agent travaille (heartbeat toutes les heures si long) |
| `blocked` | Attente humaine : `review-required:`, `decision-needed:` (relayés par Margarette sur Discord), `quota:` |
| `done` | DoD respectée, handoff rempli |
| `archived` | Nettoyage hebdo par l'`orchestrateur` |

## 2. Format de ticket (title + body)

**Title** : `[TYPE][TAILLE] verbe + objet` — ex. `[FEAT][L] Implémenter le lancer de dés avec avantage/désavantage`

Types : `FEAT`, `BUG`, `SPEC`, `ARCH`, `DESIGN`, `TEST`, `OPS`, `SEC`, `DOC`, `REFACTO`.

**Body** (markdown, toujours cette structure) :

```markdown
## Contexte
(pourquoi, lien user story, ticket parent)

## Objectif
(résultat observable attendu)

## Périmètre
- Inclus : ...
- Exclus : ...

## Artefacts d'entrée
- specs/NNN-xxx.md
- shared/src/xxx.ts (schémas Zod)
- back/src/**/03-domain/ (ports concernés)
- ADR : docs/adr/NNN-xxx.md

## Critères d'acceptation
- [ ] ...

## Contraintes
Stack et règles : AGENTS.md du repo (hexagonale, Zod, pas de any, repository pattern).
DoD : pnpm typecheck → pnpm lint → pnpm test, vérification par git diff.
Lire le fichier MODE à la racine avant de commencer.
```

## 3. Workspaces

- Tickets de code (`FEAT`, `BUG`, `REFACTO`, `TEST`) : `--workspace dir:C:\_work\my_projects\donjon-dragon` — ou `worktree` quand tu passeras à un flux PR.
- Tickets de réflexion (`SPEC`, `ARCH`, `DESIGN`) : aussi `dir:` — livrables dans `specs/` et `docs/`, versionnés.
- Jamais `scratch` pour du travail à conserver.

## 4. Handoff structuré (metadata de kanban_complete)

```json
{
  "changed_files": ["shared/src/dice.ts", "back/src/combat/03-domain/dice.port.ts"],
  "artifacts": ["docs/handoffs/t_abcd.md"],
  "commands_run": ["pnpm typecheck", "pnpm lint", "pnpm test"],
  "test_results": "42 passed, 0 failed",
  "decisions": ["PRNG seedable pour la reproductibilité des lancers"],
  "next_agent_hints": "Le schéma DiceRoll est dans shared/src/dice.ts — couvrir les jets composés (2d6+1d4)",
  "mode": "nominal",
  "tokens_note": "claude -p appelé 1 fois"
}
```

## 5. Chaînes de dépendances types

### Feature complète (le [SPEC] est créé par Margarette depuis Discord)
```bash
# Margarette (via son skill product) :
#   kanban_create title="[SPEC][M] Spec: fiche de personnage simplifiée" assignee=bernadette workspace=dir:C:\_work\my_projects\donjon-dragon

# Puis l'orchestrateur enchaîne :
hermes kanban create "[ARCH][M] Schemas Zod + ports: personnage" --assignee architecte --parent <id_spec> --workspace dir:C:\_work\my_projects\donjon-dragon
hermes kanban create "[DESIGN][M] Wireframe fiche personnage" --assignee designer --parent <id_spec> --workspace dir:C:\_work\my_projects\donjon-dragon
hermes kanban create "[TEST][M] Tests contrat personnage (dual-sandbox)" --assignee testeur --parent <id_arch> --workspace dir:C:\_work\my_projects\donjon-dragon
hermes kanban create "[FEAT][S] CRUD personnage (use case + adapter Mongo)" --assignee ouvrier --parent <id_arch> --workspace dir:C:\_work\my_projects\donjon-dragon
hermes kanban create "[FEAT][L] Editeur de fiche interactif (front)" --assignee dev-senior --parent <id_design> --workspace dir:C:\_work\my_projects\donjon-dragon
hermes kanban create "[REVIEW] Revue: feature personnage" --assignee revieweur --parent <id_feat_s> --workspace dir:C:\_work\my_projects\donjon-dragon
hermes kanban link <id_feat_l> <id_review>
hermes kanban link <id_test> <id_review>
hermes kanban create "[OPS][S] Deployer + smoke test" --assignee devops --parent <id_review> --workspace dir:C:\_work\my_projects\donjon-dragon
hermes kanban create "[DOC][S] Changelog + doc utilisateur" --assignee scribe --parent <id_ops> --workspace dir:C:\_work\my_projects\donjon-dragon
```

### Audit sécurité (récurrent, avant chaque release)
```bash
hermes kanban create "[SEC][M] Audit pre-release vX.Y" --assignee securite --workspace dir:C:\_work\my_projects\donjon-dragon
```

## 6. Dual-sandbox (ta méthode, câblée dans le board)

Le point de rencontre est double dans cette stack : **schémas Zod dans `shared/src/`** (types partagés front/back) + **ports du domaine dans `back/src/**/03-domain/`** — tous produits par l'`architecte`.

- Le ticket TEST et le ticket FEAT ont le **même parent ARCH**, jamais l'un l'autre en parent.
- Le `testeur` ne lit ni `02-application/`, ni `04-infrastructure/`, ni `01-interface/`, ni les composants front.
- Les devs ne lisent pas les fichiers de test du testeur.
- Le `revieweur` fusionne : `pnpm typecheck` + `pnpm test`. Écarts = bug d'implémentation OU ambiguïté de contrat → il rouvre le bon ticket.
- Property-based testing (`fast-check`) sur le moteur de dés/combat : idéal.

## 7. Réglages dispatcher conseillés

```yaml
kanban:
  dispatch_in_gateway: true
  max_in_progress: 3            # évite de saturer OpenRouter et ta machine
  max_in_progress_per_profile: 1
  failure_limit: 2
```
