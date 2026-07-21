---
title: Architecture Spine — Projet RPG (donjon-dragon)
status: draft
date: 2026-07-19
version: 1
---

# Architecture Spine — RPG SaaS Platform

## Paradigm

**Event-driven SPA with optimistic UI.** The frontend mutates local state immediately (Zustand + TanStack Query cache), then syncs via WebSocket to the NestJS backend. The backend processes events through a pipeline: validate → apply business rules (simulation scripts) → persist → broadcast to room. This gives every player instant feedback while the server remains the source of truth for combat resolution and state.

## Inherited Invariants

*(Nothing yet — greenfield project)*

---

## AD-1 — Stack Foundation
- **Binds:** Frontend → React 18+ / TypeScript / Tailwind v4 / shadcn/ui (React Aria) / Zustand / TanStack Query / Vite. Backend → NestJS / TypeScript / MongoDB (via Mongoose, abstracted behind repository port). Cache → Redis (open-source, self-hosted). Real-time → WebSocket (Socket.IO or native WS).
- **Prevents:** Redux, Bootstrap, any ORM coupling to MongoDB, subscription-based cache services.
- **Rule:** Every data-access layer speaks to a repository interface, not directly to Mongoose. The `DatabaseRepository` port lives in `domain/`, the `MongoRoomRepository` adapter in `infrastructure/`.

## AD-2 — Authentication & Authorization
- **Binds:** Self-managed JWT with refresh tokens. Two token tiers: **full** (write: create character, roll dice) and **readonly** (spectate, view sheets). Tokens issued at login, verified via NestJS `@Guard()`.
- **Prevents:** Auth0, Clerk, Supabase Auth, any third-party auth provider.
- **Rule:** `AuthModule` is the only module touching auth. Token payload: `{ userId, role, roomId?, tier }`.

## AD-3 — Real-Time Communication
- **Binds:** WebSocket gateway per room (game session). Each room is a namespace. Events: `player:join`, `player:leave`, `combat:action`, `dice:roll`, `narrative:update`. Server broadcasts state diffs, not full state.
- **Prevents:** Polling, SSE, REST-only architecture.
- **Rule:** WebSocket events are typed (NestJS `@WebSocketGateway` with discriminated union event types). No untyped `message` events.
- **Chosen library:** **Socket.IO** — lib éprouvée, documentation riche, fallback transports si nécessaire. Le gateway NestJS utilisera `@nestjs/platform-socket.io`.

## AD-4 — Game Simulation
- **Binds:** D&D 5e official rules encoded as **pure service functions** in `domain/combat/` and `domain/dice/`. Each rule is a function: `(state, action) => newState`. No external dependencies. Combat scripts are deterministic given seed + state.
- **Prevents:** Rules buried in controllers, magic numbers in JSX, runtime rule loading.
- **Rule:** `dice.ts` is the single source of truth for all dice logic (D20, D6, D8, etc.). `combat.service.ts` orchestrates turns, damage, advantage/disadvantage. Both are pure — no DB or I/O.

## AD-5 — Data Model (Seed — owned by code once built)
- **Binds:** MongoDB collections: `users`, `characters`, `rooms` (game sessions), `scenarios`, `combat_log`. Document shape lives in Mongoose schemas behind repository ports. Redis holds `room:{id}:active`, `room:{id}:combat_state`.
- **Prevents:** Relational joins across collections, heavy embedding without query patterns.
- **Rule:** A character document contains its sheet (stats, race, class, equipment, spells) as a nested object. Combat state is ephemeral — lives in Redis, logged to `combat_log` in Mongo on completion.

## AD-6 — VPS Deployment / Self-Hosted
- **Binds:** Single VPS (or local machine for now). Docker Compose: `nginx → frontend (Vite/SPA) | backend (NestJS) | mongo | redis`. Players connect to public IP/domain of the host.
- **Prevents:** Serverless, Kubernetes, cloud-managed DB, any paid infrastructure tier.
- **Rule:** `docker-compose.yml` at repo root. All services behind an Nginx reverse proxy. No cloud lock-in.

## AD-7 — Frontend Architecture (SPA Monolith)
- **Binds:** Single Vite React SPA. Feature-based folders under `src/features/`. Each feature = `{component, hooks, lib/}`. Page-level components in `src/pages/`. WebSocket hook (`useWebSocket`) is a shared hook in `src/hooks/`. UI components via **shadcn/ui** (React Aria) dans `src/components/ui/`.
- **Prevents:** Micro-frontends, Next.js (SSR unnecessary for game app), module federation.
- **Rule:** TanStack Query for all REST data. Zustand for global UI state (current room, active character, connection status). WebSocket events update Zustand stores directly. shadcn/ui components sont copiés dans le projet (registry pattern) — on les modifie si besoin, jamais de wrapper superflu.

## AD-8 — Repository Pattern (Database Abstraction)
- **Binds:** Every aggregate root has a **Port** interface. Mongo adapter implements it. Example: `CharacterRepositoryPort` → `MongoCharacterRepository`. Swapping DB means writing a new adapter.
- **Prevents:** Mongoose calls in service/controller layers. Direct MongoDB driver queries outside infrastructure.
- **Rule:** `src/<module>/domain/ports/` for interfaces. `src/<module>/infrastructure/` for implementations. Modules depend on ports, never on implementations.

---

## Deferred

- **AI GM:** Architecture-ready through the event pipeline (a GM agent subscribes to room events and emits narrative responses), but deferred until core gameplay is stable.
- **File uploads (character avatars, maps):** Need a storage strategy. Deferred: start with data URLs in Mongo, extract to local filesystem or S3-compatible (MinIO) when needed.
- **Multi-system RPG support:** D&D 5e first. The `domain/combat/` function set can be swapped per game system.
- **Playwright E2E tests:** Called out in acceptance criteria but deferred until V1 feature set stabilizes.
- **Admin panel / GM dashboard:** Deferred to V2. GM manages room via the same game interface for V1.

---

## Open Questions (en attente)

- **Zod partagé front/back** via un package `@donjon-dragon/shared` dans un monorepo. ✅ Validé

---

## SRD Data Sources

Le contenu officiel D&D 5e SRD est disponible via deux APIs REST open-source (licence CC-BY / MIT). Un seed script NestJS les consommera au premier démarrage pour alimenter MongoDB :

| Source | URL | Contenu |
|--------|-----|---------|
| **Open5e** | https://api.open5e.com/v1/ | Sorts (1435), monstres, classes, races, dons, backgrounds, équipement |
| **D&D 5e API** | https://www.dnd5eapi.co/api/2014/ | Caractéristiques, alignements, classes, équipement, dons, langues, objets magiques, monstres, races, sorts |

**AD-9 — SRD Seeding:** Un script `seed-srd.ts` dans le module `infrastructure/seed/` consomme ces APIs au premier démarrage et peuple MongoDB. Idempotent (vérifie les doublons par `slug`/`index`). Mise à jour via `npm run seed:srd`.

## Open Questions

*Aucune — toutes résolues.*
