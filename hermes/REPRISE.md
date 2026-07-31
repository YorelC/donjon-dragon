# Reprise de contexte (état au 30/07/2026)

Point d'entrée pour toute nouvelle session (Claude Code, Hermès, ou autre) : où en est le pipeline d'agents, ce qui reste à faire.

## Ce qui est en place

Le pipeline v3 est installé : 11 profils Hermès (voir `01-equipe.md`), board Kanban `dnd-saas`, Margarette en porte d'entrée Discord avec sa skill `product`, ponts `claude -p` pour `dev-senior` et `revieweur` via `..\scripts\claude-task.ps1`, bascule automatique en mode dégradé sur épuisement du quota Pro (fichier `MODE` à la racine).

Modèles : `ouvrier`, `testeur`, `devops` sur Qwen3-Coder-Next **local** (llama-server sur `127.0.0.1:8001`, lancé par `C:\_work\my_projects\ia_automation_code\local-llm\start-qwen-coder.ps1`) ; les huit autres sur DeepSeek via OpenRouter.

Documentation : `JOURNEE-TYPE.md` (routine quotidienne et rôle de chaque script), `output_installation_agents.md` (rapport d'installation), `02-workflow-kanban.md` (conventions du board), `..\04-granularite.md` (la chaîne de traçabilité R → UA → INV → E → ticket → test).

## Ce qui reste à faire

1. **Dégraissage du code** : `..\_prompt-degraissage.md` lancé en session Claude Code interactive. Vérifier où il en est (phase 2 = audit avec point d'arrêt, phase 3 = exécution par lots). Le complément « view n'importe jamais un container, les zones à logique arrivent en slots ReactNode » doit être intégré à AGENTS.md et à la config ESLint.
2. **Suppression définitive** de `..\.claude\_to_delete\` (11 skills website-pme + 6 fichiers de l'ancienne chaîne, déjà sortis du périmètre de découverte) : `Remove-Item -Recurse -Force`.
3. **Dégraissage des toolsets Hermès** : les 11 profils ont hérité des skills et outils du profil default. Les schémas d'outils pèsent ~42 Ko par prompt (mesuré par `hermes -p testeur prompt-size`). Couper `browser`, `session_search`, `delegation`, `vision`, `clarify` sur les workers via `hermes -p <profil> tools` (plateforme CLI). Garder `web` pour `securite`.
4. **Épic pilote** : « lancer de dés partagé en temps réel », à lancer par Margarette sur Discord une fois le dégraissage commité et `preflight.ps1` tout vert.
5. **À valider au premier épuisement réel de quota** : les motifs de détection dans `..\scripts\claude-task.ps1` (`$quotaPatterns`) correspondent-ils aux messages actuels du CLI Claude ?

## Pièges déjà rencontrés (ne pas les refaire)

- **Scripts PowerShell** : PowerShell 5.1 lit l'UTF-8 sans BOM comme du Windows-1252 ; un tiret cadratin dans un `.ps1` casse le parsing en cascade. Tous les `.ps1` du projet sont en ASCII pur + BOM. Ne jamais y remettre de caractère non-ASCII.
- **`Where-Object` dans un pipeline** déballe un résultat unique en chaîne : `$dirs[0]` renvoie alors le premier caractère. Toujours envelopper dans `@(...)`.
- **Outils `kanban_*`** : injectés uniquement dans les workers spawnés par le dispatcher (variable `HERMES_KANBAN_TASK`). Une session de chat (Margarette) doit passer par le CLI `hermes kanban --board dnd-saas ...`. Lui demander d'appeler `kanban_create()` la fait boucler.
- **Les SOUL.md des profils sont des copies** de `prompts\` : après toute modification d'un prompt, relancer `fix-souls.ps1`. Idem pour la skill product : `copy prompts\SKILL-product.md %LOCALAPPDATA%\hermes\skills\product\SKILL.md` puis `hermes gateway restart`.
- **Serveur Qwen éteint** = `ouvrier`, `testeur`, `devops` plantent au démarrage (WinError 10061, connexion refusée lors de la lecture de la taille de contexte du modèle).
- **Gateway éteint** = aucun ticket Kanban ne part (le dispatcher vit dedans).

## Décisions structurantes prises

Claude (`claude -p`, plan Pro) est réservé au code complexe (UA taguées `[ALGO]`) et à la revue critique, cible ≤ 30 % des tickets de code. Double source de vérité : le Kanban pilote qui fait quoi, le repo git porte ce qui est décidé et produit, chaque commit portant `[t_xxxx][UA-NNN]`. Dual-sandbox : le testeur écrit les tests depuis les seuls contrats (`shared/` + `03-domain/`) sans jamais lire l'implémentation, le revieweur est le point de fusion. Margarette reste en amont et en aval du pipeline, jamais au milieu.
