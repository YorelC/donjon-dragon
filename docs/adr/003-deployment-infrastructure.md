# ADR-003 : Infrastructure de déploiement

**Statut :** Proposition (en attente de revue architecte)
**Date :** 2026-08-03
**Contexte :** Premier déploiement en ligne du SaaS D&D. Jusqu'ici le projet tourne exclusivement en local via `scripts/start-local.sh`.

## Décision

| Couche | Solution | Justification |
|--------|----------|---------------|
| Backend (API + WebSocket) | Railway (Docker) | Conteneurs Docker natifs, support WebSocket persistant, GitHub auto-deploy, plan gratuit avec crédits |
| Redis | Railway add-on ou conteneur sidecar | Nécessaire pour le combat, session affine avec Socket.IO |
| MongoDB | MongoDB Atlas M0 (gratuit) | Base managed sans ops, 512 Mo suffisants pour le démarrage |
| Frontend (SPA statique) | Cloudflare Pages | CDN global, HTTPS gratuit, déploiement GitHub, SPA fallback intégré |
| Domaine | Cloudflare (DNS + tunnel si besoin) | Interface unique pour le CDN front + proxy API |

## Architecture détaillée

### Flux utilisateur
```
Utilisateur → Cloudflare Pages (front statique, CDN)
                ↓ proxy /api/*, /socket.io/*
            Railway (back NestJS + Redis)
                ↓
            MongoDB Atlas M0
```

Le front Cloudflare Pages sert la SPA React. Les requêtes `/api/*` et les WebSocket `/socket.io/*` sont proxys vers Railway via un rewrite rule Cloudflare Pages.

### API Proxy
Cloudflare Pages ne supporte pas nativement le proxy inverse. Deux options :
1. **Cloudflare Pages Functions** — une fonction `_redirects` ou `_worker.js` proxy les appels API (gratuit, 100k req/j)
2. **Sous-domaine dédié** — `api.donjon-dragon.app` pointe sur Railway, `donjon-dragon.app` sur Cloudflare Pages

→ **Choix : option 2 (sous-domaine)** pour éviter la complexité des Workers et garder les WebSocket natifs sans surcouche.

### WebSocket / Session affinity
Socket.IO nécessite :
- **Persistance des connexions** — pas de serverless pour le back → Railway Docker ✅
- **Session affinity (sticky sessions)** — Railway supporte le sticky session via le `Upgrade` header HTTP/1.1 ✅
- **Redis adapter** — pour scaler horizontalement plus tard (pas nécessaire au démarrage)

### Conteneurisation
- **`back/Dockerfile`** — multi-stage (build PNPM + exécution distroless)
- **`docker-compose.yml`** (dev/staging) — back + Redis + Mongo pour parité locale

### Pipeline CI/CD
- CI (`.github/workflows/ci.yml`) : `pnpm install → typecheck → lint → test` sur chaque push
- Déploiement automatique : Railway et Cloudflare Pages se connectent au repo GitHub
  - Push sur `main` → déploiement staging
  - Tag `v*` → déploiement production (à implémenter dans une itération ultérieure)

## Environnements

| Environnement | Backend | Frontend | MongoDB |
|--------------|---------|----------|---------|
| **Staging** | Railway (staging branch) | Cloudflare Pages (preview) | Atlas M0 (cluster staging) |
| **Production** | Railway (production) | Cloudflare Pages (production) | Atlas M0 (cluster production) |

## Alternatives écartées

| Solution | Raison de l'écart |
|----------|-------------------|
| Fly.io | Plus cher au démarrage, pas de plan gratuit viable |
| VPS + docker-compose (Hetzner) | Ops overhead : mises à jour sécurité, monitoring, backups manuels |
| AWS ECS/Fargate | Surdimensionné et coûteux pour un démarrage |
| Netlify (front) | Bon mais moins de flexibilité que Cloudflare Pages pour le proxy API |
| Vercel (back + front) | Serverless, incompatible avec WebSocket persistants |
| Render | Plus cher que Railway pour l'équivalent Docker |

## Coûts estimés (démarrage)

| Service | Palette gratuite | Post-palier |
|---------|-----------------|-------------|
| Railway | $5 de crédit initial, puis $5/mois mini | ~$5-15/mois selon CPU/RAM |
| MongoDB Atlas M0 | 512 Mo, gratuit | $57/mois (M2) |
| Cloudflare Pages | Bandwidth illimité, 500 builds/mois | $20/mès (pro, builds illimités) |
| Cloudflare DNS | Gratuit | — |
| **Total** | **~$5/mois** (forfait Railway minimum) | |

## Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Railway change son modèle de prix | Dockerfile compatible avec tout hébergeur Docker (Fly.io, VPS) — pas de lock-in |
| MongoDB Atlas M0 saturé en RAM | Monitorer usage, upgrade vers M2 ($57/mois) si nécessaire |
| Cloudflare Pages rate les WebSocket | Fallback : sous-domaine API séparé vers Railway (option 2 ci-dessus) |
| Coût Redis (pas de free tier Railway natif) | Démarrer sans Redis (MongoDB suffit pour friendship), ajouter Redis plus tard via une instance Docker sur Railway |

## Implémentation immédiate
1. ✅ Dockerfile pour le back
2. ✅ docker-compose.yml pour le développement
3. ✅ CI pipeline
4. ✅ Documentation des variables d'environnement
5. Créer les projets Railway (staging + prod) ← ops manuelle (Charly)
6. Créer le projet Cloudflare Pages ← ops manuelle (Charly)
7. Configurer le DNS ← ops manuelle (Charly)