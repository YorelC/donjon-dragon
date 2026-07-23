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

Expose the local stack publicly via a Cloudflare quick tunnel (requires the stack already running). The
public URL is randomly generated on every start (`*.trycloudflare.com`) and never persisted — the backend
doesn't need to know it in advance, since the frontend sends its own `window.location.origin` on requests
that need to build absolute links (e.g. registration's email-verification link):
```bash
./scripts/start-tunnel.sh
./scripts/stop-tunnel.sh
```

## Architecture

### Monorepo layout
- `shared/` — Zod schemas (`character-schema.ts`, `combat-schema.ts`) re-exported from `src/index.ts`. Consumed by both `back` and `front` via the `@donjon-dragon/shared` path alias (mapped to `shared/src` in each package's `tsconfig.json` and vitest `resolve.alias`, not a built package).
- `back/` — NestJS. Entry point is `src/main.ts` → `AppModule` (`src/app.module.ts`), which wires feature modules (`CharacterModule`, `CombatModule`).
- `front/` — Vite + React 18 SPA using shadcn/ui (`style: new-york`, Tailwind v4 via `@tailwindcss/vite`, no `tailwind.config.js`). Path alias `@` → `front/src`.

### Backend architecture (hexagonal, per `_bmad-output/planning-artifacts/ARCHITECTURE-SPINE.md`)
Four modules exist: `auth/`, `user/`, `character/`, `combat/`. Each follows the same layering, folders
**numbered by execution order** (a request enters at `01-`, flows down to `04-`):
```
back/src/<module>/
  01-interface/      # entry point — NestJS controllers, WebSocket gateways, guards, decorators, module wiring
  02-application/     # use-cases — orchestrate domain + ports, called by interface/
  03-domain/           # entities, pure functions, repository port interfaces — no I/O, no framework deps
  04-infrastructure/    # adapters implementing domain's ports (Mongo repository, in-memory fakes, external
                        # services) — invoked via the port from application/, never imported by it directly
```
**Call order vs. dependency direction — these are opposite, that's the point.** A request is handled
`01 → 02 → (03 and 04)`: the controller (01) calls the use-case (02), which calls domain pure functions (03)
and persists via a port (03's interface, satisfied by 04). But `02-application/` and `04-infrastructure/`
never import each other directly — both only import types from `03-domain/`. The only file that knows both
the abstract port AND its concrete implementation is `01-interface/<module>.module.ts` (NestJS `providers`
wiring). This is what makes swapping `MongoUserRepository` for `InMemoryUserRepository` in tests possible
without touching a single line of `02-application/`.

**Subfolder by scope once a layer gets dense** — `auth/` is the only module big enough to need this so far:
```
auth/01-interface/
  guards/          # jwt-auth.guard.ts, tier.guard.ts
  decorators/       # current-user.decorator.ts
  (flat: auth.controller.ts, auth.module.ts, auth.tokens.ts — module-wide, not owned by one guard/decorator)
auth/03-domain/ and auth/04-infrastructure/
  email/           # everything about sending/verifying the email-verification token
  token/            # everything about refresh/access tokens
  (flat: auth.errors.ts, password-hasher.port.ts, bcrypt-password-hasher.ts — single file, no group yet)
```
Don't create a scope subfolder for a single file — `character/`, `combat/`, `user/` currently have ≤5 files
per layer and stay flat; only split when a layer has enough files that a flat list stops being scannable.

Rules driving this (from `ARCHITECTURE-SPINE.md`):
- **Repository pattern is mandatory**: services/controllers depend on a port interface in `03-domain/`, never on Mongoose/Redis directly. Adapters live in `04-infrastructure/`.
- **Game rules are pure functions**: D&D 5e mechanics (dice, combat resolution) live in `03-domain/` as `(state, action) => newState`, deterministic, no DB/I/O — see `back/src/character/03-domain/character.entity.ts` for the existing style (e.g. `calculateModifier`, `calculateHitPoints`, `createCharacter`).
- **Datastore**: MongoDB via Mongoose (abstracted behind ports), Redis for ephemeral combat state. Not Postgres/Sequelize.
- **Auth**: self-managed JWT (access + refresh), two tiers (`full`, `readonly`); no third-party auth provider (no Auth0/Clerk/Supabase).
- **Real-time**: Socket.IO, one namespace per room (game session), typed discriminated-union events (`player:join`, `combat:action`, `dice:roll`, etc.) broadcasting state diffs — not polling/SSE, not untyped `message` events.
- **Frontend state**: Zustand for global/UI state, TanStack Query for REST data; WebSocket events update Zustand stores directly. No Redux.

### Code quality gates (per `SPEC.md`)
- Functions ≤ 20 lines, files ≤ 150 lines.
- `any` is disallowed — use `unknown` + type guards.
- File naming is kebab-case with role suffixes: `.controller.ts`, `.service.ts`, `.repository.ts`, `.container.tsx`, `.view.tsx`, `.test.ts`.
- TDD workflow: tests are written before implementation (see `character.entity.test.ts`'s "RED" header comment for the convention used in this repo).
- **`02-application/` and `04-infrastructure/` must never import from each other directly.** Both may only
  import from `03-domain/` (types/ports for `application/`, ports it implements for `infrastructure/`). The
  concrete pairing (which `infrastructure/` class satisfies which `domain/` port) is decided in exactly one
  place: `01-interface/<module>.module.ts`'s NestJS `providers` wiring. A `02-application/*.use-case.ts` that
  imports anything from `04-infrastructure/` is a violation — fix by depending on the `03-domain/` port
  instead and letting the module wiring inject the concrete adapter.

### Frontend page organization (Next.js-inspired, route-oriented)
Every route lives under `front/src/pages/`, one folder per route segment — `features/` does not exist,
there's exactly one organizing principle. Routing is still declared explicitly in `App.tsx` (React Router,
no file-based routing magic); folder names just mirror the URL for readability.
```
pages/<segment>/
  <segment>.page.tsx    # thin route entry wired into App.tsx — renders the container, no other logic
  _internal/            # everything private to this page — never imported from outside its own folder
    containers/           # *.container.tsx — composes hooks/queries + view, no JSX styling of its own
    views/                 # *.view.tsx — pure props → JSX, no hooks/state/effects/fetching
    queries/               # use-*.ts hooks that call TanStack Query (useQuery/useMutation)
    hooks/                 # use-*.ts hooks that are NOT TanStack Query (e.g. a WebSocket hook)
    stores/                # Zustand stores used only by this page
    types/                 # *-schema.ts (Zod, type = z.infer) or plain types scoped to this page
    constants/             # constants used only by this page
    utils/                 # helper functions used only by this page
```
Only create the subfolders a page actually needs — don't scaffold all of them upfront. A simple page like
`login/` only has `containers/`, `views/`, `queries/`; it has no `hooks/`, `stores/`, `types/`, `constants/`,
or `utils/` because it doesn't need any. Tests are **colocated** next to the file they test inside the same
`_internal/<category>/` folder (e.g. `_internal/types/character-schema.test.ts` next to
`character-schema.ts`) — there's no separate top-level test tree to keep in sync.

`queries/` vs `hooks/` is a real distinction, not cosmetic: `pages/combat/_internal/queries/use-dice.ts`
wraps a `useMutation`, while `pages/combat/_internal/hooks/use-combat.ts` is pure WebSocket
(`useCallback`/`useEffect`/`socket.emit`) with zero TanStack Query — they don't belong in the same folder.

**If a page's `_internal/` piece is needed by another page, it isn't page-scoped — move it to the matching
`shared/` category** (see below). Cross-page Zod schemas in particular have no automatic home: extract just
the shared piece (e.g. `shared/types/stats-schema.ts` holds `StatsSchema`, used by both
`pages/characters/_internal/types/character-schema.ts` and `pages/combat/_internal/types/combat-schema.ts`)
rather than promoting the whole schema file.

- **Dynamic segment** → bracket folder, e.g. `pages/characters/[id]/character-detail.page.tsx` for
  `/characters/:id` (purely a naming convention for humans — React Router still needs the literal `:id`
  route declared in `App.tsx`).
- **Nested static segment** → plain child folder, e.g. `pages/profile/settings/settings.page.tsx` for
  `/profile/settings`. If the child should render inside the parent's layout, declare it as a nested
  `<Route>` in `App.tsx` and have the parent page render an `<Outlet/>`; otherwise declare it as an
  independent flat route.
- All current pages (`home`, `characters`, `combat`, `register`, `login`, `verify-email`) follow this
  convention.

### Shared/common frontend code (`front/src/shared/`)
Anything reused across 2+ pages lives here, not in any page's `_internal/`. Mirrors the same category split
as `_internal/`:
- `shared/components/atoms/` — shadcn/ui primitives (installed via the shadcn registry — edit in place, don't wrap).
- `shared/components/molecules/` — D&D-specific composed components (`dice-roller`, `combat-log`, `hit-points`, `spell-card`, `item-card`, `ability-score`, `skill-check`).
- `shared/hooks/` — cross-page non-query hooks (e.g. `useLocalStorage`, `use-websocket`).
- `shared/stores/` — Zustand stores genuinely used by 2+ pages. Currently just `auth.store.ts` (set by both
  `login` and `verify-email`) — `character.store.ts`/`combat.store.ts` live in their own page's
  `_internal/stores/` because nothing else uses them; don't reflexively put a new store here.
- `shared/types/` — cross-page types/schemas with no single page as their natural home (e.g. `stats-schema.ts`).
- `shared/constants/` — cross-page constants (e.g. `constants/translations/`).
- `shared/api/api.ts` — the fetch wrapper (`api.get/post/delete`, throws `ApiError` with `.status`).
- `shared/utils/utils.ts` — `cn()` helper (clsx + tailwind-merge), the standard shadcn convention.
- Path alias `@/` → `front/src`, so shared code is imported as `@/shared/components/atoms/button`,
  `@/shared/hooks/useLocalStorage`, `@/shared/stores/auth.store`, `@/shared/api/api`, `@/shared/utils/utils`.
  **Two separate alias configs must stay in sync**: `vite.config.ts` (dev server + `vite build`) and
  `vitest.config.ts` (test runner — Vitest prefers this file over `vite.config.ts` when both exist, it does
  NOT inherit `vite.config.ts`'s `resolve.alias`). A path added to one but not the other fails silently in
  exactly one of {dev/build, tests}.
- `front/components.json` (shadcn CLI config) `aliases` must also point at `shared/` — otherwise
  `npx shadcn add <component>` recreates a stale `components/` folder outside `shared/`.
