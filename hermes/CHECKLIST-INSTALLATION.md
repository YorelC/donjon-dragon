# ✅ Checklist d'installation — Pipeline agents Hermès (kit v3)

Kit extrait dans : `C:\Users\Leroy\Downloads` (adapte le chemin si sous-dossier).
Repo cible : `C:\_work\my_projects\donjon-dragon`.
Coche chaque case dans l'ordre — chaque phase a un **test de validation** : ne passe pas à la suivante s'il échoue.

---

## Phase 0 — Prérequis (10 min)

- [x] Hermès installé et à jour : `hermes --version` répond
- [x] Claude Code opérationnel sur le compte Pro : `claude --version` répond
- [x] Test réel du CLI : `claude -p "Réponds uniquement: OK"` affiche `OK` (c'est LA brique des ponts dev-senior/revieweur)
- [x] Node ≥ 20 et pnpm : `node -v` et `pnpm -v`
- [ ] Clé OpenRouter active dans Hermès : un message de test au profil `default` (deepseek-v4-flash) répond
- [ ] Profils existants fonctionnels : `architecte` (deepseek-v4-pro) et `ouvrier` (qwen3-coder-next) répondent
- [ ] Repo propre : `cd C:\_work\my_projects\donjon-dragon` puis `git status` → rien d'inattendu en attente

**✔ Validation phase 0** : les 3 commandes `hermes`, `claude -p`, `pnpm` répondent sans erreur dans le MÊME terminal (celui qui lancera Hermès — le dispatcher spawne les workers depuis cet environnement, donc ce PATH).

---

## Phase 1 — Préparer le repo (15 min)

Dans `C:\_work\my_projects\donjon-dragon` :

- [ ] Créer le fichier `MODE` à la racine, contenu exact : `nominal` (une ligne, sans extension)
- [ ] Créer `STATUS.md` à la racine (template dans `03-conventions-repo.md` du kit)
- [ ] Créer les dossiers :
  ```powershell
  mkdir docs\adr, docs\adr\plans, docs\design, docs\handoffs, docs\user
  ```
- [ ] Ajouter au `.gitignore` : la ligne `._claude/`
- [ ] Copier depuis le kit : `scripts\claude-task.ps1`, `scripts\claude-task.sh`, `scripts\bootstrap-board.ps1` → dans `scripts\` du repo (ils cohabitent avec start-local.sh)
- [ ] Ajouter la section « Kanban » à `AGENTS.md` (texte prêt à coller dans `03-conventions-repo.md` §Compléments)
- [ ] Copier `04-granularite.md` du kit → racine du repo (les prompts y font référence)
- [ ] Commit : `git add -A && git commit -m "chore(agents): infrastructure pipeline kanban [t_setup]"`

**✔ Validation phase 1** : `type MODE` affiche `nominal` ; `git log -1` montre le commit ; `AGENTS.md` contient la section Kanban.

---

## Phase 2 — Créer les 11 profils Hermès (30 min)

Pour chaque ligne : créer le profil (nom EXACT — c'est l'`assignee` du Kanban, un écart d'orthographe = tâche jamais dispatchée, event `skipped_nonspawnable`), coller le prompt du kit, régler le modèle.

- [ ] `orchestrateur` ← `prompts/00-orchestrateur.md` — deepseek-v4-flash
- [ ] `bernadette` ← `prompts/01-bernadette.md` — deepseek-v4-pro
- [ ] `architecte` (existant : remplacer le prompt) ← `prompts/02-architecte.md` — deepseek-v4-pro
- [ ] `designer` ← `prompts/03-designer.md` — deepseek-v4-pro
- [ ] `dev-senior` ← `prompts/04-dev-senior.md` — deepseek-v4-flash (pont)
- [ ] `ouvrier` (existant : remplacer le prompt) ← `prompts/05-ouvrier.md` — qwen3-coder-next
- [ ] `testeur` ← `prompts/06-testeur.md` — qwen3-coder-next
- [ ] `revieweur` ← `prompts/07-revieweur.md` — deepseek-v4-flash (pont)
- [ ] `devops` ← `prompts/08-devops.md` — qwen3-coder-next
- [ ] `securite` ← `prompts/09-securite.md` — deepseek-v4-pro
- [ ] `scribe` ← `prompts/10-scribe.md` — deepseek-v4-flash

**✔ Validation phase 2** : `hermes -p scribe chat -q "Cite tes 3 livrables principaux en une ligne"` répond (changelog, doc utilisateur, README/AGENTS) — teste 2-3 profils au hasard de la même façon.

---

## Phase 3 — Margarette (10 min)

- [ ] Charger `prompts/skill-product-margarette.md` comme **skill** du profil Margarette (pas un nouveau profil)
- [ ] Vérifier qu'elle a accès aux outils kanban (kanban_create, kanban_list, kanban_comment, kanban_unblock)

**✔ Validation phase 3** : sur Discord, demande-lui « résume ton rôle product » → elle doit citer : les 7 thèmes d'interrogatoire, les réponses R-NNN, la limite de 4 questions par message, la création de tickets [SPEC] pour bernadette, le relais des blocages.

---

## Phase 4 — Board Kanban (10 min)

- [ ] `hermes kanban init`
- [ ] `hermes kanban boards create dnd-saas --name "SaaS D&D" --description "VTT simplifie - pipeline agents"`
- [ ] `hermes kanban boards switch dnd-saas`
- [ ] Config dispatcher (fichier de config Hermès) :
  ```yaml
  kanban:
    dispatch_in_gateway: true
    max_in_progress: 3
    max_in_progress_per_profile: 1
    failure_limit: 2
  ```
- [ ] Redémarrer le gateway Hermès pour prendre la config

**✔ Validation phase 4** : `hermes kanban list` répond (vide) ; `hermes kanban watch` affiche le flux d'événements ; le dashboard montre le board `dnd-saas`.

---

## Phase 5 — Smoke tests du pipeline, maillon par maillon (30 min)

### 5a. Le pont claude -p (sans Kanban)
- [ ] Créer `._claude\task-t_test.md` dans le repo, contenu : « Lis AGENTS.md et liste les 3 règles principales. Ne modifie AUCUN fichier. »
- [ ] Lancer : `powershell -ExecutionPolicy Bypass -File scripts\claude-task.ps1 -TaskId t_test -Mode review`
- [ ] Vérifier : exit code 0 (`$LASTEXITCODE`), log créé dans `._claude\logs\t_test.log`, contenu du log cohérent

### 5b. Un worker de bout en bout (maillon le moins risqué)
- [ ] Créer un ticket inoffensif :
  ```
  hermes kanban create "[DOC][S] Test pipeline: creer docs/user/test-pipeline.md contenant exactement la phrase 'Pipeline OK - <date du jour>'" --assignee scribe --workspace dir:C:\_work\my_projects\donjon-dragon
  ```
- [ ] Attendre le dispatch (≤ 60 s) ; suivre dans `hermes kanban watch`
- [ ] Vérifier : ticket `done`, fichier `docs\user\test-pipeline.md` créé avec la bonne phrase, `hermes kanban show <id>` montre summary + metadata (changed_files)

### 5c. Le droit de refus (granularité v3)
- [ ] Créer un ticket volontairement flou : `hermes kanban create "[FEAT][S] Ameliorer le systeme" --assignee ouvrier --workspace dir:C:\_work\my_projects\donjon-dragon`
- [ ] Vérifier : le ticket passe `blocked` avec une raison `dependency: ticket à redécouper...` (c'est le comportement ATTENDU — un ouvrier qui aurait codé quelque chose ici serait un échec)
- [ ] Archiver les deux tickets de test : `hermes kanban archive <id1> <id2>` (+ supprimer docs\user\test-pipeline.md, `._claude\task-t_test.md`)

### 5d. La bascule quota (optionnel mais recommandé)
- [ ] Éditer `MODE` → `degrade|reset=2099-01-01T00:00`
- [ ] Relancer 5a : le prompt de `dev-senior` exigerait un blocage `quota:` — vérifie au moins que le script tourne toujours, puis remets `MODE` à `nominal`

**✔ Validation phase 5** : 5a exit 0 · 5b done avec fichier créé · 5c bloqué avec le bon préfixe.

---

## Phase 6 — Épic pilote : le lancer de dés partagé (le vrai test)

- [ ] Sur Discord, dis à Margarette : « Nouvelle feature : lancer de dés partagé en temps réel » → elle déroule l'interrogatoire (7 thèmes, 4 questions max par message, défauts proposés)
- [ ] Valider sa synthèse R-001…R-NNN
- [ ] Vérifier le ticket [SPEC] créé : `hermes kanban list --assignee bernadette` → body avec R-NNN, hors périmètre, questions ouvertes
- [ ] Spec produite dans `specs\` : UA en EARS + tables de valeurs + matrice R→UA complète + UA `[ALGO]` taguées — **relis-la toi-même, c'est le seul livrable que tu valides à la main**
- [ ] Chaîne créée par l'orchestrateur : ARCH → (DESIGN) → [TEST ∥ FEAT×n] → INTEG → REVIEW → OPS → DOC, dépendances visibles dans `hermes kanban show`
- [ ] Contrat : `shared/src/` avec INV-NNN + matrice UA→INV ; plan `docs/adr/plans/` en étapes E-NNN
- [ ] Premier FEAT `done` : commit tagué `[t_xxxx][UA-NNN]`, `pnpm typecheck && pnpm lint && pnpm test` verts
- [ ] REVIEW passée : le revieweur a fait le contrôle de traçabilité (chaque UA a son test nommé `UA-NNN:`)
- [ ] [INTEG] vert : le parcours Gherkin traverse toutes les couches
- [ ] Tickets `blocked` éventuels remontés par Margarette sur Discord avec ID ticket + ID UA

**✔ Validation phase 6** : la feature dés fonctionne en local (`pnpm dev`), l'historique Kanban raconte toute la chaîne, STATUS.md est à jour.

---

## Phase 7 — Bilan avant vitesse de croisière

- [ ] Part de tickets passés par `dev-senior` (Claude) sur l'épic : ______ % (cible ≤ 30 %, la granularité doit faire baisser)
- [ ] Aucune UA sans test dans la matrice du revieweur
- [ ] Nombre de blocages « ticket à redécouper » : ______ (s'il y en a beaucoup → durcir la découpe de l'orchestrateur ; zéro sur un gros épic = suspect, vérifie que les devs osent refuser)
- [ ] Motifs de détection quota du script confirmés lors du 1er épuisement réel de fenêtre (sinon ajuster `$quotaPatterns` dans claude-task.ps1)
- [ ] Purge des tickets de test archivés, `hermes kanban list --status archived`

---

*Ordre de dépannage si un maillon casse : 1) `hermes kanban runs <id>` (historique des tentatives) · 2) `hermes kanban tail <id>` · 3) `._claude\logs\` pour les ponts Claude · 4) le body du ticket (spec ambiguë ? artefacts d'entrée manquants ?) avant d'incriminer l'agent.*
