# E2E API avec Bruno

Cette collection exécute les incréments 004 à 006 contre un vrai backend et une
vraie base MongoDB. Son scénario établit les amitiés par les API publiques, crée une
campagne, puis prouve les cycles accepté, refusé et annulé des invitations.

Elle couvre aussi le rejeu identique, le conflit d'intention, la liste, le compteur,
le masquage en `404` pour un tiers, l'unique adhésion active après acceptation et
l'absence d'adhésion après refus ou annulation. Elle enchaîne ensuite promotion avec
désassignation atomique, prise et retrait immédiats des permissions, rétrogradation,
garde du dernier MJ, transfert de propriété, départ combiné, rejeu durable, conflit
d'intention, exclusion atomique d'un joueur avec personnage, exclusion directe d'un
co-MJ, autorité du propriétaire et invariants finaux, sur 82 requêtes publiques.

## Prérequis

- MongoDB démarré en replica set, car la création couvre cinq collections dans
  une transaction ; `docker compose up -d mongo` fournit cette topologie ;
- backend démarré sur `http://localhost:3000` ;
- comptes et catalogue d'objets présents dans la base E2E isolée avec `pnpm seed`
  puis `pnpm seed:items`.

Un backend lancé depuis l'hôte doit viser une base dédiée, jamais une base utilisateur,
par exemple :

```text
mongodb://localhost:27017/donjon-dragon-e2e-spec006-<horodatage>?replicaSet=donjonDragon&directConnection=true
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

Chaque intention reçoit un UUID distinct généré une fois par exécution Bruno. Les clés
réutilisées le sont explicitement pour un rejeu identique ou un conflit divergent. La
collection fonctionne dans la sandbox sûre par défaut et n'accède ni au système de
fichiers ni à des modules externes.

Le scénario change volontairement plusieurs fois d'identité. Deux pauses explicites
respectent les fenêtres anti-bruteforce de l'API sans les désactiver ni modifier sa
configuration de sécurité.
