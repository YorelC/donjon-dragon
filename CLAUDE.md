# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**donjon-dragon** — a D&D 5e RPG SaaS. pnpm monorepo with three workspace packages: `shared` (Zod schemas shared front/back), `back` (NestJS API + WebSocket), `front` (React SPA).

## Commands

Install (run once, from repo root):
```bash
pnpm install
```

Root-level (runs across all workspace packages via `pnpm -r`):
```bash
pnpm dev         # parallel dev servers for all packages
pnpm typecheck   # tsc --noEmit in each package
pnpm lint        # NOTE: currently a stub ("echo 'ok'") in every package — do not rely on this to catch issues
pnpm test        # vitest run in each package
```

Per-package (run from `back/`, `front/`, or `shared/`):
```bash
pnpm dev         # back: nest start --watch | front: vite --host 0.0.0.0
pnpm build       # back: nest build | front: tsc && vite build
pnpm typecheck
pnpm test        # vitest run
```

Run a single test file or test case with vitest directly, e.g.:
```bash
cd back && npx vitest run test/unit/character/domain/character.entity.test.ts
cd front && npx vitest run -t "renders the dice roller"
```

Full local stack (builds back, starts back on :3000 and front on :5173, bound to `0.0.0.0` for LAN access):
```bash
./scripts/start-local.sh
./scripts/stop-local.sh
```

## Architecture

### Monorepo layout
- `shared/` — Zod schemas (`character-schema.ts`, `combat-schema.ts`) re-exported from `src/index.ts`. Consumed by both `back` and `front` via the `@donjon-dragon/shared` path alias (mapped to `shared/src` in each package's `tsconfig.json` and vitest `resolve.alias`, not a built package).
- `back/` — NestJS. Entry point is `src/main.ts` → `AppModule` (`src/app.module.ts`), which wires feature modules (`CharacterModule`, `CombatModule`).
- `front/` — Vite + React 18 SPA using shadcn/ui (`style: new-york`, Tailwind v4 via `@tailwindcss/vite`, no `tailwind.config.js`). Path alias `@` → `front/src`.

### Target architecture (hexagonal, per `_bmad-output/planning-artifacts/`)
The project has planning docs (`ARCHITECTURE-SPINE.md`, `SPEC.md`, `SPEC-SHADCN-ATOMICS.md`, `stories/STORIES.md`) that define the intended architecture; only a small slice is built so far (`CharacterModule`'s controller stub, `CombatModule` is empty, `character.entity.ts`'s pure functions). When adding backend features, follow this layering per module:
```
back/src/<module>/
  domain/          # entities, pure functions, repository port interfaces — no I/O, no framework deps
  application/      # use-cases orchestrating domain + ports
  infrastructure/   # adapters implementing ports (Mongo repository, Redis adapter, in-memory fakes for tests)
  interface/        # NestJS controllers, WebSocket gateways, module wiring
```
Rules driving this (from `ARCHITECTURE-SPINE.md`):
- **Repository pattern is mandatory**: services/controllers depend on a port interface in `domain/`, never on Mongoose/Redis directly. Adapters live in `infrastructure/`.
- **Game rules are pure functions**: D&D 5e mechanics (dice, combat resolution) live in `domain/` as `(state, action) => newState`, deterministic, no DB/I/O — see `back/src/character/domain/character.entity.ts` for the existing style (e.g. `calculateModifier`, `calculateHitPoints`, `createCharacter`).
- **Datastore**: MongoDB via Mongoose (abstracted behind ports), Redis for ephemeral combat state. Not Postgres/Sequelize.
- **Auth**: self-managed JWT (access + refresh), two tiers (`full`, `readonly`); no third-party auth provider (no Auth0/Clerk/Supabase).
- **Real-time**: Socket.IO, one namespace per room (game session), typed discriminated-union events (`player:join`, `combat:action`, `dice:roll`, etc.) broadcasting state diffs — not polling/SSE, not untyped `message` events.
- **Frontend state**: Zustand for global/UI state, TanStack Query for REST data; WebSocket events update Zustand stores directly. No Redux.

### Code quality gates (per `SPEC.md`)
- Functions ≤ 20 lines, files ≤ 150 lines.
- `any` is disallowed — use `unknown` + type guards.
- File naming is kebab-case with role suffixes: `.controller.ts`, `.service.ts`, `.repository.ts`, `.container.tsx`, `.view.tsx`, `.test.ts`.
- TDD workflow: tests are written before implementation (see `character.entity.test.ts`'s "RED" header comment for the convention used in this repo).

### Frontend component organization (current, not yet matching the target `src/features/` layout in `SPEC.md`)
- `src/components/atoms/` — shadcn/ui primitives (installed via the shadcn registry — edit in place, don't wrap).
- `src/components/molecules/` — D&D-specific composed components (`dice-roller`, `combat-log`, `hit-points`, `spell-card`, `item-card`, `ability-score`, `skill-check`).
- `src/components/routes/` — page-level components (e.g. `Home.tsx`).
- `src/components/bases/` — pre-shadcn custom components predating the atoms/molecules split; being phased out.
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge), the standard shadcn convention.
