# DEC-017 — Modèle exécutable, typé et versionné des règles

- **Statut :** validée sur ses principes structurants ; conception détaillée provisoire
- **Date de proposition :** 23 août 2026
- **Date de validation des principes :** 23 août 2026
- **Phase :** 5C
- **Détail :**
  [modèle technique du moteur de règles](../TECHNICAL-RULE-MODEL-5C.md)
- **Prérequis :** DEC-015 et DEC-016 validées.

## Problème

La cible doit exécuter les règles communes et les exceptions des matrices B01 à B09,
qualifier 391 sorts, les profils de créatures, objets, classes et capacités, reprendre
une action interrompue sans double coût ni nouveau hasard et expliquer chaque calcul
sans révéler les secrets.

DEC-015 a retenu des primitives typées et des handlers purs officiels, tandis que
DEC-016 a figé releases, profils, traces et références immuables. Il reste à définir
leur modèle exécutable, leur compilation, leur ordre sémantique, leur compatibilité et
leur preuve de déterminisme.

## Options considérées

### Interprétation des textes ou profils descriptifs

Cette option évite un modèle détaillé, mais ne fournit ni validation statique, ni
exécution fiable, ni trace structurée. Elle est incompatible avec les matrices B01 à
B09.

### DSL ou scripts extensibles

Cette option augmente l'expressivité, mais crée un langage général à sécuriser,
versionner et tester. Elle permettrait au contenu de campagne d'exécuter une logique
arbitraire, contrairement à DEC-006 et DEC-015.

### Vocabulaire fermé compilé et handlers officiels bornés

Cette option représente les familles communes par données typées, vérifie les profils
avant usage et réserve le code pur aux seules exceptions officielles démontrées.

## Décision structurante validée

Le propriétaire valide les principes suivants :

1. Le moteur est pur : il ne lit ni MongoDB, ni réseau, ni fichier, ni variable
   d'environnement et ne produit aucun effet de bord.
2. Le moteur est déterministe et versionné : les mêmes entrées exactes produisent le
   même résultat ; aucune version courante ne remplace silencieusement une version
   figée.
3. Aucun contenu utilisateur ou de campagne n'exécute de script. Les handlers purs
   restent réservés aux exceptions officielles selon DEC-015.
4. Le moteur ne génère aucun hasard et ne consulte aucune horloge cachée. Dés, instant
   système et temps fictionnel lui sont fournis explicitement.

## Conception détaillée provisoire

Les choix suivants forment une direction cohérente, mais ne sont pas encore des
contrats techniques validés :

1. Une `RulesetRelease` est un manifeste immuable et fermé qui épingle versions,
   hashes, provenances, dépendances, vocabulaire et handlers admis.
2. Chaque profil et règle possède une identité stable, une version opaque, un hash,
   une provenance structurée et des dépendances exactes.
3. Le vocabulaire fermé couvre faits, prédicats, prérequis, sélecteurs, expressions,
   coûts, ressources, jets, dégâts, soins, mouvements, conditions, effets, ciblage,
   géométrie, déclencheurs, durées et arbitrages MJ.
4. « Spécifique prévaut sur général » est exprimé par des relations nommées vers une
   règle ou étape précise. Aucun nombre de priorité ni ordre de chargement ne décide du
   résultat.
5. Les conflits, cycles, références absentes, unités incompatibles et données
   mécaniques ambiguës bloquent le profil ou la release concernés.
6. Un handler officiel est pur, total, déterministe, versionné, lié par le manifeste et
   incapable d'I/O, d'horloge ou de hasard caché. Aucun contenu personnalisé ne peut le
   référencer.
7. Les profils sont compilés en graphe canonique de primitives sans générer de code.
8. L'évaluation produit des demandes de choix, dés ou Réactions identifiées, puis
   reprend par continuation avec un instant et des résultats injectés.
9. Une action interrompue conserve versions, révisions, coûts, dés, étape et trace ; sa
   reprise ne relance rien et requalifie l'état courant.
10. Temps système et temps fictionnel sont distincts. Le premier est injecté une fois
    par commande ; le second avance uniquement par transition métier.
11. La trace causale complète classe chaque valeur par audience. Les projecteurs du
    module propriétaire omettent les nœuds secrets sans marqueur révélateur.
12. Structure persistée, modèle de profil, vocabulaire, contrat de handler, profil et
    release possèdent des versions distinctes et une compatibilité explicite.
13. Une errata crée profils et release nouveaux. Builds, combats, exemplaires et effets
    existants ne changent que par revalidation ou migration explicite auditée.
14. La preuve combine propriétés, tables exhaustives, cas d'or, invariants, corpus,
    reprises et tests de déterminisme.

## DÉCISION VALIDÉE DR-5C-01 — contenu personnalisé

Le propriétaire retient le sous-ensemble prudent : modificateurs nommés, charges,
activation simple, attaque ou sauvegarde, dégâts, soins, PV temporaires, conditions
officielles, mouvement simple, durée fixe ou Concentration et clause manuelle après
coût.

Sont interdits : remplacement d'une règle officielle, Réaction ou interruption
personnalisée, invocation, transformation, génération de profil, handler, nouveau type
de fait, chemin interne libre et secret qui modifie les permissions.

Une mécanique hors sous-ensemble reste manuelle. Élargir cette frontière exige une
nouvelle décision explicite et une revue de la surface d'attaque avant le code.

## Statut provisoire des détails

Restent notamment provisoires :

- les formes TypeScript et Zod ;
- l'ordre et le découpage exacts des pipelines ;
- le catalogue précis des primitives et des faits accessibles ;
- la structure, la persistance et le filtrage exacts des traces ;
- la forme des continuations et des actions suspendues ;
- les optimisations, caches et liaisons concrètes de handlers.

Ces détails seront confirmés incrémentalement par des tranches d'implémentation. Une
tranche part d'une famille B01–B09, implémente le minimum nécessaire, apporte ses
preuves et revient à `SPEC` avant fusion lorsqu'un détail de 5C est infirmé. Le code ne
devient pas normatif : il fournit la preuve qui permet de marquer un détail comme
éprouvé ou de corriger la proposition documentaire.

## Conséquences validées

- Le calcul pur ne dépend d'aucun repository, transport ou adaptateur d'infrastructure.
- Le hasard serveur, l'instant système et le temps fictionnel sont des entrées
  explicites, jamais des effets cachés du moteur.
- Une version figée ne peut pas être remplacée silencieusement par une version plus
  récente.
- Le contenu personnalisé reste déclaratif et limité au sous-ensemble prudent ; une
  clause hors liste reste manuelle.
- Les frontières MongoDB, transactions, audits et projections de 5B restent inchangées
  et extérieures au calcul pur.
- Cette décision n'est pas un contrat API et ne fige aucune forme TypeScript.
- L'implémentation pourra progresser par tranches, sous réserve du cycle
  `SPEC → PLAN → CODE → TEST → REVIEW` et des retours documentaires avant fusion.

## Risques à éprouver

- La qualification initiale du corpus représente un volume important.
- Un vocabulaire trop pauvre gonflerait le registre de handlers ; un vocabulaire trop
  large recréerait un DSL général.
- Une mauvaise classification d'audience peut révéler un secret par la trace ou par
  l'absence visible d'une étape.
- Les continuations et Réactions imbriquées augmentent la complexité de reprise.
- La coexistence de releases exige de conserver durablement profils et handlers
  compatibles avec les états encore référencés.

## Conditions de réexamen

- une même structure mécanique apparaît dans plusieurs handlers ;
- une règle officielle validée n'est représentable ni par primitives ni par un handler
  pur ;
- un second système de jeu entre effectivement dans le périmètre ;
- la 2,5D/3D remplace la géométrie du MVP ;
- les mesures de compilation, trace ou résolution dépassent les objectifs futurs ;
- l'inventaire réel d'objets personnalisés justifie d'élargir le sous-ensemble validé.

## Validation

Le propriétaire a validé le 23 août 2026 les principes structurants de DEC-017 et
l'option 1 de DR-5C-01. Cette validation n'étend pas aux formes TypeScript, au pipeline
exact, au catalogue détaillé des primitives, aux traces ou aux continuations ; ces
éléments restent provisoires et seront confirmés incrémentalement par l'implémentation,
les tests et la revue.
