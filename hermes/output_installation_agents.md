# Rapport d'installation — Pipeline agents Hermès (kit v3)

Date : 2026-07-29 · Généré par Claude (Cowork) · Repo : `C:\_work\my_projects\donjon-dragon`
Références : `C:\_work\my_projects\donjon-dragon\hermes\CHECKLIST-INSTALLATION.md` (procédure) · tutoriel Hermès (modules cités entre parenthèses).
Note : le dossier `C:\_work\my_projects\donjon-dragon\hermes\kit-agents-saas-v3\` (extraction du zip) fait doublon avec les fichiers installés listés ci-dessous — tu peux le supprimer.

## 1. Périmètre de ce qui a été fait à distance (et pourquoi pas tout)

Claude a un accès fichiers au dossier `C:\_work\my_projects\donjon-dragon` mais **ne peut pas exécuter** `hermes`, `claude` ou `pnpm` sur la machine (ces CLI vivent dans l'environnement Windows, hors du pont de fichiers). Répartition :

- **Fait par Claude (ce rapport, §2-3)** : toute la phase 1 du checklist (fichiers du repo) + le kit complet installé dans `hermes\` + le script d'exécution des phases restantes.
- **À exécuter par Charly (§4)** : `hermes\setup-hermes.ps1` — phases 0, 2, 3, 4, 5a/5b, avec les commandes du tutoriel.
- **Manuel résiduel (§5)** : modèles par profil, bloc `config.yaml`, gateway, validations Discord.

## 2. Fichiers posés (chemins absolus)

### Racine du repo — phase 1 du checklist ✅
| Fichier | Contenu / rôle |
|---|---|
| `C:\_work\my_projects\donjon-dragon\MODE` | `nominal` — mode du pipeline, lu par tous les agents avant chaque tâche |
| `C:\_work\my_projects\donjon-dragon\STATUS.md` | Tableau de bord initialisé (installation en cours) |
| `C:\_work\my_projects\donjon-dragon\04-granularite.md` | Doctrine v3 : chaîne R→UA→INV→E→ticket→test, tailles max, [INTEG] |
| `C:\_work\my_projects\donjon-dragon\AGENTS.md` | **Modifié** : section « Kanban » ajoutée en fin de fichier (contenu existant intact) |
| `C:\_work\my_projects\donjon-dragon\.gitignore` | **Modifié** : ligne `._claude/` ajoutée |
| `C:\_work\my_projects\donjon-dragon\hermes\CHECKLIST-INSTALLATION.md` | (posé lors de l'échange précédent, déplacé par Charly dans `hermes\`) |

### Scripts du pipeline
| Fichier | Rôle |
|---|---|
| `C:\_work\my_projects\donjon-dragon\scripts\claude-task.ps1` | Pont Hermès → `claude -p` (exit 42 = quota → MODE=degrade) |
| `C:\_work\my_projects\donjon-dragon\scripts\claude-task.sh` | Équivalent bash (WSL/Git Bash) |
| `C:\_work\my_projects\donjon-dragon\scripts\bootstrap-board.ps1` | Création de la chaîne du premier épic (dés partagés) |

### Dossiers documentaires (avec `.gitkeep`)
`C:\_work\my_projects\donjon-dragon\docs\adr\` · `docs\adr\plans\` · `docs\design\` · `docs\handoffs\` · `docs\user\`

### Kit v3 complet dans `hermes\`
| Fichier | Rôle |
|---|---|
| `...\hermes\README.md` | Vue d'ensemble du kit et ordre d'installation |
| `...\hermes\01-equipe.md` | Spécification de l'équipe (11 profils + Margarette) |
| `...\hermes\02-workflow-kanban.md` | Conventions du board (tickets, handoffs, dual-sandbox) |
| `...\hermes\03-conventions-repo.md` | Conventions repo (✔ existant / ➕ ajouté) |
| `...\hermes\04-granularite.md` | Copie de référence de la doctrine |
| `...\hermes\prompts\00-orchestrateur.md` → `10-scribe.md` | Les 11 prompts (= SOUL.md des profils) |
| `...\hermes\prompts\skill-product-margarette.md` | Skill product de Margarette (corps sans frontmatter — le script l'ajoute) |
| `...\hermes\setup-hermes.ps1` | **Le script à lancer** (phases 0→5b) |
| `...\hermes\output_installation_agents.md` | Ce rapport |

## 3. Configurations mises en place dans les fichiers

- `MODE` = `nominal` (bascule auto en `degrade|reset=...` par `scripts\claude-task.ps1` sur détection quota, exit 42).
- `AGENTS.md` § Kanban : format de commit `[t_xxxx][UA-NNN]`, blocages normalisés (`review-required:` / `decision-needed:` / `quota:` / `dependency:`), droit de refus, règles dual-sandbox, renvoi vers `04-granularite.md` et `hermes\`. AGENTS.md reste **l'unique fichier de contexte projet**, lu par Hermès ET par `claude -p` (tutoriel module 6.3 : premier trouvé gagne — ne crée pas de HERMES.md qui le masquerait).
- `.gitignore` : `._claude/` (missions et logs des ponts Claude, jamais versionnés).

## 4. Commandes exécutées par `setup-hermes.ps1` (à lancer par Charly)

```powershell
powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\setup-hermes.ps1
```
Journal : `C:\_work\my_projects\donjon-dragon\hermes\setup-log.txt`. Détail par phase :

| Phase checklist | Commandes (tutoriel) |
|---|---|
| 0 — Prérequis | `hermes version` · `hermes doctor` (module 2.1) · `claude --version` · `claude -p "Reponds uniquement: OK"` · `pnpm -v` · `git status` — arrêt si échec |
| 0bis — Sauvegarde | `hermes backup -o %USERPROFILE%\hermes-backup-<date>.zip` (module 0.1 : restaurable par `hermes import -f`) |
| 2 — Profils | `hermes profile create <nom> --clone-from default` × 11 : `orchestrateur, bernadette, architecte, designer, dev-senior, ouvrier, testeur, revieweur, devops, securite, scribe` (module 2.2 ; les existants sont détectés et conservés) |
| 2bis — Prompts | copie de `hermes\prompts\XX.md` → `SOUL.md` de chaque profil sous `%LOCALAPPDATA%\hermes\` (module 6.2 ; `.bak` de l'ancien ; alerte si dossier de profil introuvable → copie manuelle) |
| 3 — Margarette | création de `%LOCALAPPDATA%\hermes\skills\product\SKILL.md` = frontmatter YAML (name/description v3) + corps de `skill-product-margarette.md` (module 7.2) |
| 4 — Board | `hermes kanban init` · `hermes kanban boards create dnd-saas ...` · `boards switch dnd-saas` (module 10.4) |
| 4ter — Garde-fous | `setx HERMES_WRITE_SAFE_ROOT C:\_work\my_projects\donjon-dragon` (module 12.5) |
| 5a — Pont Claude | création `._claude\task-t_test.md` puis `scripts\claude-task.ps1 -TaskId t_test -Mode review` — attendu exit 0, log dans `._claude\logs\t_test.log` |
| 5b — Bout-en-bout | (optionnel, gateway requis) `hermes kanban create "[DOC][S] Test pipeline..." --assignee scribe --workspace dir:C:\_work\my_projects\donjon-dragon` puis suivi `hermes kanban watch` |

## 5. Reste MANUEL après le script

1. **Modèles par profil** (le CLI ne le fait pas en batch) — `hermes -p <nom>` puis `/model`, ou `hermes model` (module 3.1) : `deepseek-v4-pro` → bernadette, architecte, designer, securite · `deepseek-v4-flash` → orchestrateur, dev-senior, revieweur, scribe · `qwen3-coder-next` → ouvrier, testeur, devops.
2. **`%LOCALAPPDATA%\hermes\config.yaml`** — ajouter (modules 10.4/12.5) : `kanban: {dispatch_in_gateway: true, max_in_progress: 3, max_in_progress_per_profile: 1, failure_limit: 2}` et `agent: {max_turns: 90}`.
3. **Gateway** : `hermes gateway start` — sans lui, AUCUN ticket n'est dispatché (le dispatcher vit dedans, module 11.3 ; symptôme « tâches Kanban qui ne partent pas », annexe A).
4. **Margarette sur Discord** : vérifier que le skill se déclenche (« résume ton rôle product » → 7 thèmes, R-NNN, 4 questions max, tickets pour bernadette, relais des blocages). Si Margarette est un profil distinct de `default`, copier `%LOCALAPPDATA%\hermes\skills\product\` dans les skills de SON profil. Puis `hermes security audit` (module 7.3).
5. **Phases 5c/5d puis 6-7 du CHECKLIST** : droit de refus (ticket flou → blocked attendu), test bascule quota, épic pilote « lancer de dés », bilan (part Claude ≤ 30 %).
6. **Commit git** de l'ensemble : `git add -A && git commit -m "chore(agents): installation pipeline kanban v3 [t_setup]"` (fait exprès de te le laisser : tu relis le diff d'abord — règle AGENTS.md).

## 6. Correspondance avec le CHECKLIST-INSTALLATION.md

- Phase 1 : ✅ toutes les cases (fichiers posés par Claude — commit git restant).
- Phases 0, 2, 4, 5a/5b : ➜ automatisées par `setup-hermes.ps1`, à cocher après exécution (journal en preuve).
- Phases 3 (validation Discord), 5c/5d, 6, 7 : ➜ manuelles, cases à cocher au fil de l'eau.

## 7. Dépannage express

`hermes doctor --fix` · tickets qui ne partent pas → gateway éteint → `hermes gateway start` · profil jamais spawné → nom d'assignee ≠ nom de profil (event `skipped_nonspawnable`) · pont Claude muet → lancer le gateway depuis le terminal où `claude --version` répond · comportement bizarre d'un worker → lire son `SOUL.md` et `%LOCALAPPDATA%\hermes\memories\*.md` (module 6, annexe A).
