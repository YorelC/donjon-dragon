# DEC-015 — Architecture technique cible et modèle de calcul

- **Statut :** validée
- **Date de validation :** 21 août 2026
- **Phase :** 5A
- **Détail :**
  [architecture technique cible](../TECHNICAL-ARCHITECTURE-5A.md)
- **Contexte :** les phases 1 à 4 ont validé le comportement fonctionnel, mais les
  frontières techniques, le modèle de calcul, la cohérence transactionnelle et les
  projections de sécurité restaient indéterminés.

## Problème

Le produit doit appliquer plusieurs centaines de règles et d'exceptions, conserver un
combat reprenable, empêcher tout double jet ou double coût, coordonner des mutations
multi-personnages et ne jamais révéler un secret à la mauvaise audience. Le code actuel
ne fournit ni moteur de règles, ni état d'aventure complet, ni combat, ni audit
fonctionnel.

La cible doit rester réalisable pour un pilote monolithique sans enfermer les règles
dans des conditions propres à chaque sort ou profil.

## Décision

1. Conserver un monolithe modulaire NestJS, MongoDB comme source de vérité et une seule
   instance sans Redis.
2. Introduire un contexte `rules` pur et versionné, puis un contexte `gameplay` en aval
   qui orchestre préparation, combat, repos, effets et butin.
3. Séparer dossier, changement de build, état d'aventure et inventaire en agrégats
   distincts ; séparer également préparation, combat, repos, contenant et réserve.
4. Envelopper chaque commande mutante dans une transaction MongoDB qui persiste état,
   reçu d'idempotence, audit fonctionnel et outbox, avec révisions optimistes.
5. Utiliser des snapshots versionnés et un journal append-only, sans event sourcing.
6. Représenter les règles par un vocabulaire fermé de primitives typées. Les
   exceptions officielles non exprimables emploient des handlers TypeScript purs et
   nommés ; le contenu personnalisé n'exécute jamais de code.
7. Figer releases de règles et profils aux frontières de validation et de lancement ;
   toute errata produit une nouvelle version et une adoption explicite.
8. Construire dans chaque module des projections de sécurité nommées. Ni agrégat ni
   fait interne complet ne sont sérialisés ou diffusés directement.

## Options écartées

### Microservices ou moteur distant

Ils ajoutent cohérence distribuée et exploitation sans charge établie. Une extraction
future restera possible lorsqu'une mesure la justifiera.

### DSL ou scripts de contenu

Un DSL complet crée un second langage à sécuriser, versionner et tester. Des scripts
de campagne élargiraient la surface d'attaque. Les primitives typées couvrent les
familles communes ; les handlers officiels couvrent les exceptions réelles.

### Event sourcing

La reprise exacte et l'audit n'exigent pas de reconstruire l'état depuis tous les
événements. Snapshots, journal et outbox répondent au besoin avec moins de migrations
et de risques de fuite historique.

### Cohérence éventuelle pour les commandes de jeu

Elle ne satisfait pas les opérations fonctionnellement indivisibles : action de
combat, repos, prise de butin, activation de build ou transfert de propriété.

## Conséquences

- L'environnement MongoDB du pilote doit accepter les transactions ; le détail de son
  déploiement sera fixé dans la phase d'infrastructure.
- L'idempotence, l'audit et l'outbox font partie de la transaction métier et ne sont
  pas des ajouts facultatifs de transport.
- Les futurs schémas et contrats doivent citer les agrégats et invariants de la phase
  5A sans les déplacer silencieusement.
- Les ports de repository restent privés ; les coordinations passent par des use-cases
  publics et une unité de travail commune.
- Socket.IO demeure un transport après commit, jamais une source de vérité ou une
  frontière d'autorisation.
- Le moteur produit une trace structurée pour chaque calcul, filtrée selon la même
  audience que le résultat.

## Validation

Le propriétaire a validé explicitement l'ensemble de cette décision le 21 août 2026.
Cette validation autorise la phase suivante à détailler données et contrats. Elle
n'autorise encore aucun code, aucune dépendance et aucune migration.
