# donjon-dragon

RPG D&D 5e SaaS — monorepo NestJS + React.

## Stack

**Front** : React 18 + Vite + TypeScript + Tailwind v4 + shadcn/ui + Zustand + TanStack Query
**Back**  : NestJS + TypeScript + MongoDB + Redis + Socket.IO
**Shared** : Zod (schémas partagés front/back)

## Prérequis

- Node.js ≥ 20
- pnpm : `npm install -g pnpm`

## Installer

```bash
pnpm install
```

## Lancer (wifi local)

```bash
./scripts/start-local.sh
```

Ouvre `http://<IP_DU_PC>:5173` depuis un autre appareil sur le même réseau.

## Arrêter

```bash
./scripts/stop-local.sh
```

## Développement

```bash
# Front seul
cd front && pnpm dev

# Back seul (build puis start)
cd back && nest build && node dist/main.js
```