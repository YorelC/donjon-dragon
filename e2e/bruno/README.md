# E2E API avec Bruno

Cette collection exécute les incréments 004 et 005 contre un vrai backend et une
vraie base MongoDB. Son scénario établit les amitiés par les API publiques, crée une
campagne, puis prouve les cycles accepté, refusé et annulé des invitations.

Elle couvre aussi le rejeu identique, le conflit d'intention, la liste, le compteur,
le masquage en `404` pour un tiers, l'unique adhésion active après acceptation et
l'absence d'adhésion après refus ou annulation.

## Prérequis

- MongoDB démarré en replica set, car la création couvre cinq collections dans
  une transaction ; `docker compose up -d mongo` fournit cette topologie ;
- backend démarré sur `http://localhost:3000` ;
- comptes du seed présents dans la base E2E isolée avec `pnpm seed`.

Un backend lancé depuis l'hôte doit viser une base dédiée, jamais une base utilisateur,
par exemple :

```text
mongodb://localhost:27017/donjon-dragon-e2e-spec005?replicaSet=donjonDragon&directConnection=true
```

Le seed et le backend doivent recevoir exactement cette même URI. La collection ne
supprime ni ne réinitialise aucune base.

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

Chaque intention reçoit un UUID distinct généré une fois par exécution Bruno. Seule la
clé du premier envoi est réutilisée pour son rejeu identique puis son conflit divergent.
La collection fonctionne dans la sandbox sûre par défaut et n'accède ni au système de
fichiers ni à des modules externes.
