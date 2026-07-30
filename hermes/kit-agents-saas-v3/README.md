# Kit v2 — Équipe d'agents autonomes pour le SaaS D&D

11 profils Hermès orchestrés par Kanban + **Margarette** (ton agent Discord) en porte d'entrée avec un skill product. Claude Code (`claude -p`, plan Pro) réservé au code complexe et à la revue critique ; DeepSeek V4 et Qwen3-coder via OpenRouter pour le reste ; bascule automatique en mode dégradé quand le quota Claude est épuisé.

Aligné sur le repo réel `C:\_work\my_projects\donjon-dragon` : monorepo pnpm (`shared` Zod, `back` NestJS hexagonal + Mongo/Redis/Socket.IO, `front` React 18 Vite + Tailwind v4 + shadcn/ui + Zustand + TanStack Query), Vitest, et les règles de ton AGENTS.md (frontières hexagonales, DoD `pnpm typecheck → lint → test`, interdits .env/seed/CI).

## Contenu

```
01-equipe.md                        Spécification : rôles, flux, routage, modes, place de Margarette
02-workflow-kanban.md               Conventions du board : tickets, handoffs, dépendances, dual-sandbox
03-conventions-repo.md              Ce qui existe déjà ✔ et ce qu'il faut ajouter ➕ (MODE, STATUS.md, docs/adr…)
04-granularite.md                   Doctrine v3 : chaîne de traçabilité R→UA→INV→E→ticket→test→commit, tailles max, [INTEG]
prompts/00-orchestrateur.md         deepseek-v4-flash
prompts/01-bernadette.md            deepseek-v4-pro — spec fonctionnelle (rôle de ton AGENTS.md)
prompts/02-architecte.md            deepseek-v4-pro — hexagonale, Zod shared, ports domaine
prompts/03-designer.md              deepseek-v4-pro — shadcn/ui, Tailwind v4, a11y
prompts/04-dev-senior.md            pont → claude -p
prompts/05-ouvrier.md               qwen3-coder-next
prompts/06-testeur.md               qwen3-coder-next — Vitest + Playwright, dual-sandbox
prompts/07-revieweur.md             pont → claude -p
prompts/08-devops.md                qwen3-coder-next — CI, Docker, observabilité, FinOps
prompts/09-securite.md              deepseek-v4-pro — OWASP (dont WebSocket), RGPD
prompts/10-scribe.md                deepseek-v4-flash
prompts/skill-product-margarette.md SKILL à charger dans Margarette (pas un 12e profil)
scripts/claude-task.ps1 / .sh       Pont vers claude -p — détection quota, exit 42 → mode dégradé
scripts/bootstrap-board.ps1         Création du board dnd-saas + premier épic
```

Lancer Qwen en local
```bash
powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\ia_automation_code\local-llm\start-qwen-coder.ps1
```

## Installation (ordre exact)

1. **Repo** (il existe déjà) : ajoute seulement `MODE` (contenu : `nominal`), `STATUS.md`, `docs/{adr,design,handoffs,user}/`, la section « Kanban » dans AGENTS.md (texte prêt dans `03-conventions-repo.md`), et `._claude/` dans le `.gitignore`.
2. **Profils Hermès** : crée les 11 profils (noms EXACTS = les `assignee` du Kanban) : `orchestrateur`, `bernadette`, `architecte`, `designer`, `dev-senior`, `ouvrier`, `testeur`, `revieweur`, `devops`, `securite`, `scribe`. Colle chaque prompt. Tes profils existants `architecte` (deepseek-v4-pro) et `ouvrier` (qwen3-coder-next) sont conservés — remplace juste leur prompt. `dev-senior` et `revieweur` : deepseek-v4-flash (ce sont des ponts, le vrai travail est fait par `claude -p`).
3. **Margarette** : charge `prompts/skill-product-margarette.md` comme skill de son profil (elle garde son identité et sa mémoire Discord). Elle crée les [SPEC] pré-remplis et relaie les blocages `decision-needed:` / `review-required:` vers Discord.
4. **Scripts** : copie `scripts/` dans le repo. Vérifie `claude --version` dans la session qui lance Hermès.
5. **Board** : lance `scripts/bootstrap-board.ps1`, suis les commandes commentées pour la chaîne du premier épic (lancer de dés partagé — petit mais traverse tout : spec → Zod → property-based → Socket.IO → déploiement).
6. **Dispatcher** : `max_in_progress: 3`, `max_in_progress_per_profile: 1`, `failure_limit: 2`. Suivi : `hermes kanban watch` + dashboard.

## Les 4 mécanismes clés

- **Margarette sans doublon** : la clarification se fait dans votre dialogue Discord ; TOUT part dans le body du ticket [SPEC] (arbitrages inclus) que `bernadette` lit via `kanban_show()`. Zéro retransmission, zéro chevauchement de rôle (règle AGENTS.md : chaque agent reste à sa place).
- **Deux sources de vérité** : le Kanban dit *qui fait quoi* ; le repo dit *ce qui est décidé et produit*. Chaque commit porte `[t_xxxx]`.
- **Dual-sandbox** : testeur et développeur partent des mêmes contrats (schémas Zod `shared/` + ports `03-domain/`) sans jamais se lire ; le revieweur fusionne et classe les écarts (bug vs ambiguïté de contrat).
- **Quota Claude Pro** : détection de limite → exit 42 → `MODE=degrade|reset=...` → l'orchestrateur re-route les L/XL vers architecte+ouvrier jusqu'au reset (~fenêtres de 5 h).

## Points de contrôle humain

Tickets `blocked` `decision-needed:` (arbitrage produit) et `review-required:` (auth, suppression de données, migrations, CI, NO-GO sécurité) — Margarette te les apporte sur Discord et débloque avec ta réponse. Tout le reste tourne seul.

## Lexique (les termes du kit)

**ADR** (Architecture Decision Record) : note datée qui fige une décision d'architecture et ses raisons. **Architecture hexagonale** (ou « ports et adapters ») : le domaine métier au centre, isolé du monde extérieur par des ports (interfaces) que des adapters (Mongo, HTTP, WS) implémentent — ton back la pratique déjà. **Port / Adapter** : le contrat côté domaine / son implémentation côté infrastructure. **DoD** (Definition of Done) : conditions objectives pour déclarer un travail terminé. **MoSCoW** : priorisation Must/Should/Could/Won't. **Gherkin** : syntaxe Étant donné/Quand/Alors. **Property-based testing** : tester des propriétés vraies pour toute entrée générée (lib `fast-check`) — parfait pour des dés. **Idempotent** : rejouable sans changer le résultat (migrations). **Handoff** : passage de témoin formalisé entre agents. **Smoke test** : vérification minimale post-déploiement. **Supply chain (attaque)** : compromission via une dépendance npm. **Worktree** : plusieurs répertoires de travail git sur un même dépôt. **FinOps** : pilotage des coûts cloud. **YAGNI** : ne construis pas ce dont tu n'as pas besoin aujourd'hui. **T-shirt sizing** : estimation S/M/L/XL. **Affinité de session (sticky session)** : router un même client vers le même serveur — nécessaire à Socket.IO en prod multi-instances.
