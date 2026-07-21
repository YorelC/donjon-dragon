# AGENTS.md — donjon-dragon

Conventions et ownership pour tous les agents (humains + IA). Source de vérité technique : `CLAUDE.md`. En cas de conflit, `CLAUDE.md` gagne.

## Communication

- **Charly ↔ Margarette** : français normal, chaleureux, taquin
- **Margarette → Bernadette** : caveman (concis, pas de blabla, pas de politesse)
- **Bernadette → Architecte/Ouvrier** : caveman
- **Architecte/Ouvrier → Bernadette** : caveman, résultats bruts
- **Bernadette → Margarette** : résumé structuré (pas de logs bruts)

Un message caveman = l'essentiel. Pas de formule de politesse. Pas de récap. Pas de "je vais". Direct aux faits.

```
# 🦴 BON caveman
fichier: back/src/character/domain/character.entity.ts
ligne 42: calculateModifier utilise any au lieu de number
corrige. type: number. test apres.

# ❌ MAUVAIS caveman (trop long)
Bonjour ! Je vais regarder le fichier pour toi. Alors, dans le fichier character.entity.ts, à la ligne 42...
```

## Stack

- **Front** : React 18 + Vite + TypeScript + Tailwind v4 + shadcn/ui (style new-york) + Zustand + TanStack Query + Socket.IO client
- **Back** : NestJS + TypeScript + MongoDB (Mongoose) + Redis (ioredis) + Socket.IO + JWT (self-managed)
- **Shared** : Zod (schémas partagés front/back)
- **Package manager** : pnpm (monorepo : shared/, back/, front/)

## Architecture backend (hexagonale)

```
back/src/<module>/
  domain/           ← entités, fonctions pures, ports (interfaces repository)
  application/      ← use-cases (orchestre domaine + ports)
  infrastructure/   ← adapters (Mongo repository, Redis, fakes in-memory pour tests)
  interface/        ← NestJS controllers, WebSocket gateways, module wiring
```

Règles :
- Repository pattern obligatoire. Service dépend d'une interface dans `domain/`, jamais de Mongoose/Redis direct.
- Règles D&D 5e = fonctions pures dans `domain/`. Entrées = state + action. Sortie = newState. Pas d'I/O.
- MongoDB via Mongoose derrière ports. Redis pour état éphémère (combat).

## Architecture frontend (Container/Presenter)

Tout nouveau composant :
```
use-*.ts           ← logique (état, hooks). 1 hook = 1 responsabilité. Testé renderHook.
*.view.tsx         ← pur : props in → JSX out. Pas de hooks d'état/effet/fetch.
*.container.tsx    ← mère : appelle les hooks, compose les views. Pas d'autre logique.
```

Composants partagés dans `front/src/components/ui/` avec `cn()` (clsx + tailwind-merge).

## Quality gates

- Fonctions ≤ 20 lignes, fichiers ≤ 150 lignes
- `any` interdit → `unknown` + type guards
- TDD : tests avant implémentation (RED → GREEN → REFACTOR)
- Pas de code mort. Pas d'abstraction non demandée.
- Zod schemas = source de vérité des types. Pas de types manuels quand Zod suffit.

## Flux de travail

```
Charly → Margarette (discord, normal)
  → Bernadette (caveman, dispatch)
    → Architecte (caveman) si spec/schema/archi nécessaire
    → Ouvrier (caveman) si implémentation
    → Résultat → Bernadette → Margarette → Charly
```

## Gestion des tokens API

| Agent | Modèle principal | Fallback |
|---|---|---|
| Margarette | DeepSeek V4 Flash (OpenRouter) | — |
| Bernadette | Claude Code | DeepSeek V4 Flash (OpenRouter) |
| Architecte | Claude Code (Opus) | DeepSeek V4 Pro (OpenRouter) |
| Ouvrier | Claude Code (Haiku) | Qwen3-Coder-Next (local :8001) |

Qwen local est OFF par défaut (surchauffe PC). Margarette prévient Charly quand il faut l'allumer.