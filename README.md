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

## Tester depuis l'extérieur (tunnel Cloudflare)

Accède au site depuis ton téléphone ou un autre réseau (pratique quand t'es pas chez toi).

### Prérequis

Le tunnel Cloudflare nécessite que les serveurs tournent déjà :
```bash
./scripts/start-local.sh
```

### Lancer le tunnel

```bash
./scripts/start-tunnel.sh
```

Le script affiche une URL publique du type :

```
https://xxxx-xxx.trycloudflare.com
```

📱 Ouvre ce lien depuis ton téléphone — le site et l'API sont accessibles.

### Arrêter le tunnel

```bash
./scripts/stop-tunnel.sh
```

> ⚠️ **Sécurité :** Le tunnel ne crée aucune ouverture de port sur ton routeur. La connexion va de ta machine vers Cloudflare, pas l'inverse. L'URL est aléatoire et difficile à deviner. Pense à arrêter le tunnel quand t'as fini de tester.

## Développement

```bash
# Front seul
cd front && pnpm dev

# Back seul (build puis start)
cd back && nest build && node dist/main.js
```