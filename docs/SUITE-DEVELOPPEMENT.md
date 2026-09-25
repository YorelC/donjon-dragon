# Suite du développement

Feuille de reprise succincte au 25 septembre 2026. Les exigences et décisions liées
restent normatives ; ce document ordonne seulement leur réalisation.

## 1. Fermer le niveau 1

- Exécuter Playwright, la collection Bruno et les tests avec un vrai MongoDB.
- Prouver le parcours brouillon → soumis → refusé → corrigé → accepté.
- Actualiser `CURRENT-STATE.md`, `GAP-ANALYSIS.md` et `TRACEABILITY.md`.
- Valider les décisions de la Spec 010, puis réaliser le portrait facultatif.
- Fermer les derniers écarts B01 : provenance des compétences et conséquences
  encore descriptives de l'Aasimar.

## 2. Construire la progression

1. Introduire l'état d'aventure B04 : PV et ressources courants, dés de vie,
   conditions, concentration, inspiration, monnaies et inventaire d'instances.
2. Implémenter le déverrouillage individuel et groupé par le MJ, sa révocation et
   les verrous liés au combat.
3. Implémenter B02 niveaux 2–20 : classes, sous-classes, dons, sorts, ressources et
   jets de PV, sans soin ni repos implicite.
4. Implémenter B03 : multiclassage, emplacements multiclassés et respécialisation
   versionnée.

## 3. Ouvrir le combat par une verticale jouable

1. Spécifier les contrats HTTP, événements temps réel et projections secrètes.
2. Persister le cycle `PRÉPARATION → EN_COURS ↔ EN_PAUSE → BUTIN → TERMINÉ`.
3. Ajouter participants, instances de monstres, positions, initiative et reprise.
4. Livrer une première boucle : déplacement, attaque simple, dégâts, soins, mort et
   fin de tour, entièrement validés par le serveur.
5. Étendre ensuite aux sorts, réactions, zones, couverture, invocations, repos et
   butin.

## 4. Chantiers transverses

- Ajouter les preuves Mongo réelles des transactions et courses critiques.
- Décider rétention et abandon des messages d'outbox, observabilité et alertes.
- Définir sauvegardes, restauration et topologie de déploiement.
- Fermer `COR-02` : reprise d'une vérification d'email interrompue.
- Finaliser la livraison des courriels d'invitation et la qualité des catalogues de
  sorts, équipements et créatures.

## Définition de terminé

Pour chaque tranche : `SPEC → PLAN → CODE → TEST → REVIEW`, puis `pnpm typecheck`,
`pnpm lint`, `pnpm test`, preuves de bout en bout utiles et contrôle final du diff.
