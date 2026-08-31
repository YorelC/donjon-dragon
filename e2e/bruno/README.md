# E2E API avec Bruno

Cette collection exécute les incréments 004 à 007 contre un vrai backend et une
vraie base MongoDB. Son scénario établit les amitiés par les API publiques, crée une
campagne, puis prouve les cycles accepté, refusé et annulé des invitations.

Elle couvre aussi le rejeu identique, le conflit d'intention, la liste, le compteur,
le masquage en `404` pour un tiers, l'unique adhésion active après acceptation et
l'absence d'adhésion après refus ou annulation. Elle enchaîne ensuite promotion avec
désassignation atomique, prise et retrait immédiats des permissions, rétrogradation,
garde du dernier MJ, transfert de propriété, départ combiné, rejeu durable, conflit
d'intention, exclusion atomique d'un joueur avec personnage, exclusion directe d'un
co-MJ, autorité du propriétaire et invariants finaux. La suite Spec 007 réinvite un
joueur exclu, prouve son auto-attribution à la création, les lectures privées, le
remplacement atomique, le retour au vivier, le rejeu, le conflit d'intention,
l'isolation inter-campagnes et la perte immédiate du droit d'attribuer après
rétrogradation.

La suite Spec 009 (requêtes 106 à 119) prouve le tirage serveur et son idempotence,
sur ses propres campagnes pour ne rien devoir à l'état accumulé avant elle : le
serveur lance six fois quatre dés, le rejeu de la même clé rend le même `rollId`
sans relancer, la même clé dans une autre campagne rend `409`, une clé absente rend
`400`. Elle enchaîne la création qui désigne un tirage émis, puis les quatre refus
que le contrat doit produire — tirage déjà consommé, méthode `roll` sans tirage,
méthode sans tirage qui en désigne un, création sans clé d'idempotence — et sépare
enfin les deux contrats HTTP : l'édition d'un personnage tiré aux dés réussit avec
`abilityRollId: null` et échoue dès qu'elle redésigne un tirage.

Les trois créations de personnage antérieures (33, 86, 89) envoient désormais
l'identité complète, la taille, les langues et la clé d'idempotence : le serveur les
exige depuis la Spec 009.

## Prérequis

Un seul : **MongoDB démarré en replica set**, car la création couvre cinq collections
dans une transaction. `docker compose up -d mongo` fournit cette topologie.

Le reste est fait par le lanceur. `pnpm test:e2e:api` génère une base jetable
horodatée, y exécute les deux seeds, démarre le backend dessus sur le port 3000,
attend qu'il écoute, lance la collection, arrête le serveur puis supprime la base.

Rien à exporter, rien à modifier dans `.env` : l'URI n'appartient qu'au lanceur, qui
la passe aux processus enfants. `@nestjs/config` laisse `process.env` primer sur le
fichier `.env`, donc la configuration de développement reste intacte et la base de
travail `donjon-dragon` n'est jamais touchée.

Le préfixe `donjon-dragon-e2e-` n'est pas décoratif : c'est la seule protection du
balai, et la base de travail ne le porte pas.

La collection elle-même ne supprime rien — elle tourne dans la sandbox sûre, sans
driver Mongo. Le nettoyage supprime toutes les bases préfixées après l'exécution,
succès ou échec. Pour garder l'état et l'inspecter, lancer avec `KEEP_E2E_DB=1`. Le
balai seul : `pnpm e2e:clean`.

Pour rejouer contre une base précise plutôt qu'une base neuve — sur une base jetable
seulement, le balai ne connaît que le préfixe :

```bash
E2E_MONGODB_URI="mongodb://localhost:27017/donjon-dragon-e2e-inspection?replicaSet=donjonDragon&directConnection=true" pnpm test:e2e:api
```

## Exécution

```bash
pnpm test:e2e:api
```

Une seule commande, depuis la racine, avec Mongo démarré.

Pour viser une instance déjà lancée par ailleurs, sans passer par le lanceur :

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
