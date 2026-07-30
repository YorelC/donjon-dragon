# Conventions du repo — la seconde source de vérité (v2, alignée sur l'existant)

Le Kanban pilote *qui fait quoi*. Le repo git (`C:\_work\my_projects\donjon-dragon`) porte *ce qui a été décidé et produit*.
Commits : `type(scope): sujet [t_xxxx]` — l'ID du ticket dans chaque commit.

## Arborescence (existant ✔ / à ajouter ➕)

```
donjon-dragon/
├── AGENTS.md            ✔ règles agents (source de vérité comportementale — CLAUDE.md pointe dessus)
├── CLAUDE.md            ✔ (@AGENTS.md)
├── MODE                 ➕ "nominal" ou "degrade|reset=..." — lu par tous les agents
├── STATUS.md            ➕ tableau de bord humain, tenu par l'orchestrateur
├── specs/               ✔ specs fonctionnelles (bernadette) : NNN-titre.md
├── docs/                ✔ compléter avec :
│   ├── adr/             ➕ Architecture Decision Records (architecte)
│   ├── design/          ➕ wireframes HTML, tokens, checklists a11y (designer)
│   ├── handoffs/        ➕ handoffs détaillés + env.md (noms des variables, jamais les valeurs)
│   └── user/            ➕ doc utilisateur (scribe)
├── security/            ✔ rapports d'audit (securite) : audit-vX.Y.md, rgpd.md
├── knowledges/          ✔ base de connaissances (règles D&D 5e, etc.)
├── shared/              ✔ schémas Zod partagés — POINT DE RENCONTRE dual-sandbox (côté types)
├── back/                ✔ NestJS hexagonal — les ports de 03-domain/ = dual-sandbox (côté comportement)
├── front/               ✔ React 18 Vite + TanStack Query + Zustand + shadcn/ui
├── scripts/             ✔ start-local.sh, tunnel… (+ ➕ dossier ._claude/ dans .gitignore)
└── .github/workflows/   ➕ ci.yml (devops uniquement, via review-required)
```

## Compléments à apporter à AGENTS.md (une section « Kanban » à y ajouter)

```markdown
## Kanban (board Hermès dnd-saas)
- Chaque tâche vient d'un ticket t_xxxx ; l'ID figure dans chaque commit.
- Lire le fichier MODE avant toute tâche ; kanban_complete avec metadata
  (changed_files, commands_run, test_results, next_agent_hints).
- Blocages normalisés : review-required: / decision-needed: / quota: / dependency:
- Dual-sandbox : le testeur ne lit que shared/ + 03-domain/ ; les devs ne lisent
  jamais les fichiers de test du testeur ; fusion chez le revieweur.
```

## Template ADR (docs/adr/NNN-titre.md)

```markdown
# ADR-NNN : Titre de la décision
Date : YYYY-MM-DD — Statut : proposé | accepté | remplacé par ADR-XXX — Ticket : t_xxxx
## Contexte
## Décision
## Conséquences (positives, négatives, dettes acceptées)
## Alternatives écartées (et pourquoi)
```

## Template handoff (docs/handoffs/t_xxxx.md)

```markdown
# Handoff t_xxxx — [titre du ticket]
De : <profil> → Pour : <profil suivant>
## Ce qui a été fait
## Ce qui reste / hors périmètre
## Pièges connus
## Comment vérifier (commandes exactes)
```

## STATUS.md (tenu par l'orchestrateur)

```markdown
# STATUS — SaaS D&D
Mis à jour : YYYY-MM-DD HH:MM — Mode : nominal
## En production
## En cours (épics et tickets clés, avec IDs)
## Bloqué (attend Charly — relayé par Margarette)
## Prochaine release : contenu prévu
## Santé : CI ✅/❌ · couverture tests NN % · audit sécu du JJ/MM
```

## Fichier MODE

Une seule ligne : `nominal` ou `degrade|reset=2026-07-28T18:00+02:00` (reset de la fenêtre de 5 h du plan Pro).
Écrit par les scripts `claude-task` (détection quota) et par l'`orchestrateur` (re-bascule).
