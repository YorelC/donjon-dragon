# Variables d'environnement — donjon-dragon

Ce document liste les noms et rôles des variables d'environnement utilisées par le projet.  
**Ne JAMAIS y inscrire les valeurs.** Les valeurs réelles sont gérées par Charly dans les secrets GitHub / Railway / Cloudflare Pages.

---

## Backend (NestJS)

| Variable | Rôle | Obligatoire | Défaut |
|----------|------|-------------|--------|
| `MONGODB_URI` | URI de connexion MongoDB (Atlas ou local) | Oui | `mongodb://localhost:27017/donjon-dragon` |
| `JWT_SECRET` | Clé de signature des tokens JWT | Oui | — |
| `JWT_EXPIRES_IN` | Durée de validité des tokens (format `vercel/ms`) | Non | `7d` |
| `PORT` | Port HTTP du serveur NestJS | Non | `3000` |
| `NODE_ENV` | Environnement (`development`, `staging`, `production`) | Non | `development` |
| `REDIS_URL` | URL de connexion Redis (optionnel au démarrage) | Non | — |
| `CORS_ORIGIN` | Origine CORS autorisée pour le front (URL complète) | Oui (prod) | — |

### Futures variables (non implémentées)

| Variable | Rôle |
|----------|------|
| `SENTRY_DSN` | DSN Sentry pour le back (observabilité) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Envoi d'emails (invitations, notifications) |

---

## Frontend (React Vite SPA)

> Les variables VITE_ sont compilées dans le bundle à la construction — un build différent par environnement.

| Variable | Rôle | Obligatoire | Défaut |
|----------|------|-------------|--------|
| `VITE_API_URL` | URL de base de l'API back (ex: `https://api.donjon-dragon.app`) | Oui | `http://localhost:3000` |
| `VITE_WS_URL` | URL du WebSocket (ex: `wss://api.donjon-dragon.app`) | Oui (Socket.IO) | `ws://localhost:3000` |
| `VITE_SENTRY_DSN` | DSN Sentry pour le front (future) | Non | — |

---

## CI (GitHub Actions)

| Secret | Rôle |
|--------|------|
| Aucun secret requis pour la CI (tests uniquement, pas de déploiement depuis la CI) | — |

---

## Déploiement (Railway + Cloudflare Pages)

### Railway (backend)

| Variable | Source |
|----------|--------|
| `MONGODB_URI` | Chaîne de connexion MongoDB Atlas (secret Railway) |
| `JWT_SECRET` | Chaîne aléatoire générée par Charly (secret Railway) |
| `NODE_ENV` | `staging` ou `production` |
| `CORS_ORIGIN` | URL du front Cloudflare Pages (ex: `https://donjon-dragon.app`) |

### Cloudflare Pages (frontend)

| Variable | Source |
|----------|--------|
| `VITE_API_URL` | URL du déploiement Railway (ex: `https://donjon-dragon.up.railway.app`) |
| `VITE_WS_URL` | Même URL avec protocole `wss://` |
| Build command | `pnpm install && pnpm --filter front build` |
| Build output | `front/dist` |