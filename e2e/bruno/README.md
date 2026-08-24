# E2E API avec Bruno

Cette collection exécute le premier incrément campagne contre un vrai backend et
une vraie base MongoDB. Elle vérifie l'en-tête d'idempotence, la création, le rejeu
identique, le conflit d'intention, l'absence de duplication et le masquage en `404`.

## Prérequis

- MongoDB démarré en replica set, car la création couvre cinq collections dans
  une transaction ; `docker compose up -d mongo` fournit cette topologie ;
- backend démarré sur `http://localhost:3000` ;
- comptes du seed présents avec `pnpm seed`.

Un backend lancé depuis l'hôte doit viser cette instance avec une URI de la forme
`mongodb://localhost:27017/donjon-dragon?replicaSet=donjonDragon&directConnection=true`.

## Exécution

```bash
pnpm test:e2e:api
```

Pour viser une autre instance sans modifier la collection :

```bash
cd e2e/bruno
pnpm exec bru run --env Local --tests-only --bail \
  --env-var baseUrl=http://localhost:3010/api
```

La clé d'idempotence est un UUID généré une fois par exécution Bruno puis réutilisé
pour les scénarios de rejeu. La collection fonctionne dans la sandbox sûre par
défaut et n'accède ni au système de fichiers ni à des modules externes.
