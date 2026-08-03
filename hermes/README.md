# hermes/ — le pipeline d'agents autonomes du SaaS D&D

Ce dossier contient tout ce qui fait tourner l'équipe d'agents : la doctrine, les prompts et les scripts d'exploitation. Les fichiers ici sont la **source** ; ce qui vit dans `%LOCALAPPDATA%\hermes\` en est une copie, déployée par `deploy.ps1`.

## Par où commencer

| Tu veux… | Lis |
|---|---|
| reprendre le contexte après une pause | `REPRISE.md` |
| savoir quoi faire le matin | `JOURNEE-TYPE.md` |
| comprendre qui fait quoi dans l'équipe | `01-equipe.md` |
| créer ou corriger des tickets | `02-workflow-kanban.md` |
| comprendre le niveau de découpe attendu | `..\04-granularite.md` |
| savoir pourquoi les modèles sont répartis ainsi | `ANALYSE-ORCHESTRATION.md` |
| apprendre Hermès (commandes, config, Kanban) | `..\knowledges\hermes-guide.md` |

## Les documents

- **`01-equipe.md`** — les 11 profils, leurs rôles, le flux de production, le routage par complexité, les modes nominal et dégradé.
- **`02-workflow-kanban.md`** — conventions du board `dnd-saas` : format des tickets, handoffs, chaînes de dépendances, dual-sandbox.
- **`JOURNEE-TYPE.md`** — la routine quotidienne et le rôle de chaque script.
- **`REPRISE.md`** — état d'avancement, chantiers restants, pièges déjà rencontrés. Le point d'entrée de toute nouvelle session.
- **`ANALYSE-ORCHESTRATION.md`** — l'analyse du 03/08 : pourquoi le LLM local est sorti du chemin critique, et le diagnostic du graphe de parenté inversé.

## Les prompts (`prompts/`)

Un fichier par profil Hermès : `00-orchestrateur.md` à `10-scribe.md` deviennent le `SOUL.md` de chaque profil. `SKILL-product.md` est la skill de Margarette (avec son frontmatter YAML), `skill-product-margarette.md` en est le corps source.

**Après toute modification d'un prompt, lance `deploy.ps1`** : sans ça la modification reste lettre morte, puisque les SOUL déployés sont des copies.

## Les scripts

| Script | Rôle | Fréquence |
|---|---|---|
| `preflight.ps1` | Contrôle de santé complet, en lecture seule : CLI, profils, SOUL, modèles, board, garde-fous | chaque matin |
| `deploy.ps1` | Copie les prompts vers les SOUL des profils et la skill de Margarette, puis redémarre la gateway | à chaque modification de prompt |
| `set-mode.ps1 -Mode cloud\|local` | Bascule les profils de code entre DeepSeek et le Qwen local, et ajuste la concurrence du board | rare |
| `setup-veille.ps1` | Crée le job cron qui réveille Margarette pour surveiller les tickets bloqués | une fois |

Les scripts d'installation et les correctifs ponctuels déjà joués ont été déplacés dans `_to_delete/` : tu peux supprimer ce dossier.

## Rappels qui coûtent cher quand on les oublie

Les fichiers `.ps1` sont en **ASCII pur avec BOM** : PowerShell 5.1 lit l'UTF-8 sans BOM comme du Windows-1252, et un seul caractère accentué casse le parsing en cascade. N'y remets jamais d'accent ni de tiret long.

`hermes kanban link <parent> <enfant>` se lit à l'envers de l'intuition : `link(A, B)` signifie « B attend A ». Préfère toujours `--parent` à la création. Test de contrôle : si le ticket [DOC] est `ready` juste après la création d'une chaîne, le graphe est inversé.

Le dispatcher Kanban vit dans la gateway : sans `hermes gateway start`, aucun ticket ne part.
