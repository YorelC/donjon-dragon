# Équipe d'agents autonomes — Spécification (v2, stack réelle)

Pipeline complet pour produire un SaaS déployable en ligne, orchestré par les Kanban Hermès.
Projet pilote : **SaaS D&D simplifié** — repo `C:\_work\my_projects\donjon-dragon`.

**Stack (celle du repo, non négociable pour les agents)** : monorepo pnpm à trois paquets —
`shared` (schémas Zod partagés `@donjon-dragon/shared`), `back` (NestJS, architecture hexagonale `01-interface → 02-application → 03-domain → 04-infrastructure`, MongoDB via Mongoose, Redis pour le combat, Socket.IO), `front` (React 18 SPA Vite, Tailwind v4, shadcn/ui, Zustand, TanStack Query, react-router). Tests : Vitest partout. DoD technique : `pnpm typecheck` puis `pnpm lint` puis `pnpm test`, dans cet ordre. Pas de script `build` à la racine.

## 0. Margarette — la porte d'entrée (hors des 11 profils)

Margarette est ton agent Hermès conversationnel (Discord). Elle ne prend PAS un des 11 profils : elle est l'interface entre toi et le board. Elle charge le **skill `product`** (fichier `prompts/skill-product-margarette.md`) qui lui donne trois pouvoirs : clarifier tes idées en direct, créer des tickets [SPEC] pré-remplis pour `analyste` (zéro retransmission : toute la matière du dialogue Discord part dans le body du ticket), et relayer sur Discord les tickets `blocked` qui t'attendent (`decision-needed:`, `review-required:`). Voir la justification complète dans le skill.

## 1. Les 11 agents (profils Hermès = assignees Kanban)

| # | Profil (assignee) | Modèle | Métiers couverts |
|---|---|---|---|
| 1 | `orchestrateur` | deepseek-v4-flash | Chef de projet : triage, découpe, routage, gestion des modes |
| 2 | `analyste` | deepseek-v4-pro | Spec fonctionnelle (rôle déjà prévu dans ton AGENTS.md), user stories, MoSCoW, UX research |
| 3 | `architecte` | deepseek-v4-pro | Architecture hexagonale, ADR, contrats Zod dans `shared`, ports du domaine, modélisation Mongo/Redis |
| 4 | `designer` | deepseek-v4-pro | UX/UI sur base shadcn/ui + Tailwind v4, wireframes, **accessibilité (a11y)** |
| 5 | `dev-senior` | **pont → `claude -p`** | Code complexe : moteur de combat, Socket.IO temps réel, auth JWT, domaine métier |
| 6 | `ouvrier` | deepseek-v4-flash | Code simple : CRUD, composants UI, adapters d'infrastructure, refactos mécaniques |
| 7 | `testeur` | deepseek-v4-flash | Tests Vitest unitaires/intégration + e2e Playwright — méthode **dual-sandbox** |
| 8 | `revieweur` | **pont → `claude -p`** | Revue critique : frontières hexagonales, sécurité, qualité |
| 9 | `devops` | deepseek-v4-flash | CI/CD, déploiement (Docker : back+Redis+Mongo, front statique), **observabilité, FinOps** |
| 10 | `securite` | deepseek-v4-pro | OWASP (dont WebSocket), **RGPD**, audit dépendances |
| 11 | `scribe` | deepseek-v4-flash | Doc technique et utilisateur, changelog |

### Métiers ajoutés à ta liste initiale
Product Owner/priorisation (→ `orchestrateur` + `analyste`), revue de code (→ `revieweur`), DBA/modélisation (→ `architecte`), accessibilité — obligation légale European Accessibility Act (→ `designer`), observabilité/SRE (→ `devops`), RGPD/conformité (→ `securite`), FinOps (→ `devops`), documentation (→ `scribe`), UX research/feedback (→ `analyste`).

## 2. Flux nominal

```
Toi (Discord) ⇄ Margarette [skill product] ── clarification en direct
  │  crée le ticket [SPEC] pré-rempli (assignee: analyste)
  ▼
analyste ── spec fonctionnelle ──────────► specs/
  │
  ▼
architecte ─ ADR + schémas Zod (shared) + ports domaine ─► docs/adr/ + shared/src/
  │
  ├─► designer (si UI) ── wireframes + tokens ► docs/design/
  │
  ▼
orchestrateur ── découpe en tickets enfants (kanban_create + kanban_link)
  │
  ├──────────────┬──────────────────┐
  ▼              ▼                  ▼
dev-senior    ouvrier            testeur          ← EN PARALLÈLE (dual-sandbox)
(complexe)    (simple)           (tests depuis les schémas
  │              │                Zod partagés, SANS lire
  └──────┬───────┘                l'implémentation)
         ▼                          │
     revieweur ◄────────────────────┘  (fusion tests+code, puis [INTEG])
         │  kanban_block("review-required: ...") si humain requis
         ▼
      devops ── CI verte → déploiement → monitoring
         │
         ▼                                        securite : transversal,
      scribe ── changelog + doc                   audit avant chaque release
         │
         ▼                          Margarette te notifie sur Discord
       done ──────────────────────► (résumé de l'épic livré)
```

**Règle d'or** (reprise de ton AGENTS.md) : chaque agent ne franchit jamais l'étape suivante à la place de celui dont c'est le rôle. Toute communication passe par le ticket Kanban **et** par des fichiers versionnés.

## 3. Routage complexité (qui code quoi)

- **S** (CRUD, composant shadcn, adapter simple, config) → `ouvrier`
- **M** (logique applicative standard, use case complet) → `ouvrier`, revue `revieweur`
- **L/XL** (moteur de combat, règles D&D 5e, Socket.IO/Redis, auth, migration Mongo risquée) → `dev-senior` (Claude)
- **Bug non reproduit / debug difficile** → `dev-senior`

Objectif : **≤ 30 % des tickets de code consomment du quota Claude Pro.**

## 4. Modes nominal / dégradé

Deux axes indépendants, à ne pas confondre.

**Axe Claude (quota du plan Pro).**
- NOMINAL : `dev-senior` et `revieweur` appellent `claude -p` via `scripts/claude-task.ps1`.
- DÉGRADÉ (exit 42 du script) : fichier `MODE` → `degrade|reset=...` ; les tickets `[ALGO]` passent au binôme `architecte` (plan d'implémentation ultra-fin) + `ouvrier` (exécution), revue par `architecte` ; l'`orchestrateur` re-bascule après l'heure de reset (fenêtres de 5 h).
- Tous les agents lisent `MODE` en début de tâche.

**Axe modèle de code (nuage ou local).** Bascule par `hermes/set-mode.ps1`.
- `-Mode cloud` (nominal) : `ouvrier`, `testeur` et `devops` sur DeepSeek Flash. Aucun besoin du serveur llama.cpp, aucune contention GPU, `max_in_progress: 3`. Coût mesuré : de l'ordre de 0,002 $ par ticket, soit quelques dollars par mois.
- `-Mode local` (dégradé) : les mêmes profils sur Qwen3-Coder-Next local, `max_in_progress: 1` (le GPU est partagé, un seul worker à la fois). À utiliser hors réseau, en cas d'indisponibilité d'OpenRouter, ou par choix délibéré de coût nul.

Le LLM local n'est donc plus sur le chemin critique. Son rôle est celui d'un filet : garantir que la production continue sans réseau et sans compte.

## 5. Escalade et blocage

Préfixes normalisés de `kanban_block` : `review-required:` (validation humaine — relayée par Margarette sur Discord), `decision-needed:` (arbitrage produit — idem), `quota:` (bascule mode dégradé), `dependency:` (attend un autre ticket). 2 échecs consécutifs → auto-block : l'`orchestrateur` analyse `hermes kanban runs <id>` avant relance.

## 6. Definition of Done globale

Ticket de code `done` seulement si : `pnpm typecheck` ✅ puis `pnpm lint` ✅ puis `pnpm test` ✅ (dans cet ordre), vérification par `git diff` (jamais sur une sortie textuelle), frontières hexagonales respectées, revue approuvée, `metadata.changed_files` rempli. Feature déployée seulement si : CI verte, checklist `securite` passée, doc `scribe` à jour.
