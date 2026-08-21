# DEC-016 — Modèle MongoDB cible et stratégie de persistance

- **Statut :** validée
- **Date de proposition :** 21 août 2026
- **Date de validation :** 21 août 2026
- **Phase :** 5B
- **Détail :**
  [modèle de données et stratégie de persistance](../TECHNICAL-PERSISTENCE-5B.md)
- **Prérequis :** DEC-015 et Phase 5A validées.

## Problème

La cible doit préserver les versions ayant produit une fiche ou un combat, garantir
l'atomicité multi-agrégats et l'idempotence, isoler les campagnes et rester sous les
limites BSON sans imposer de plafonds arbitraires à la partie. Les collections actuelles
sont des reliquats jetables et ne doivent pas orienter le modèle.

## Décision fonctionnelle préalable validée

Un niveau déverrouillé et une respécialisation déverrouillée ne coexistent jamais pour
un même personnage. Un seul `BuildChange` peut être ouvert :

- une respécialisation ouverte interdit le déverrouillage d'un niveau jusqu'à son
  acceptation et son activation ;
- un niveau en attente ou commencé interdit le déverrouillage d'une respécialisation
  jusqu'à sa finalisation et son verrouillage, ou jusqu'à sa révocation lorsqu'elle est
  encore permise ;
- l'action groupée signale le personnage inéligible sans bloquer les autres.

Une respécialisation peut être abandonnée. Son `BuildChange` devient terminal, le
candidat et ses versions restent auditables, et le build actif, l'état d'aventure et
l'inventaire demeurent inchangés. L'emplacement est libéré pour un futur niveau.
Le joueur assigné et tout MJ actif peuvent l'abandonner.

## Options considérées

### Documents monolithiques enrichis

Cette option limite le nombre de collections, mais conserve le couplage actuel,
augmente les risques de limite BSON et rend les versions historiques difficiles à
protéger.

### Event sourcing

Cette option offre une reconstruction complète, mais DEC-015 l'a écartée : elle ajoute
versions d'événements, migrations de replay et exposition historique sans nécessité
produit.

### Snapshots révisés et versions immuables séparées

Cette option conserve des lectures courantes directes, protège les versions
mécaniques, et utilise l'audit pour expliquer plutôt que reconstruire.

## Décision technique validée

1. Persister un snapshot courant par racine mutable, avec `schemaVersion`, identité
   métier stable, dates BSON et `revision` monotone explicite.
2. Séparer les `BuildVersion`, `RulesetRelease`, versions de profils de règles,
   d'objets et de créatures dans des documents immuables adressés par version et hash.
3. Employer des références métier explicites, toujours accompagnées de la portée
   campagne lorsqu'elle existe ; ne jamais utiliser une population Mongo comme
   contrôle d'autorisation.
4. Stocker inventaires et réserves comme une racine révisée et des entrées enfants,
   toutes modifiées uniquement par le repository de la racine.
5. Persister chaque commande mutante avec ses agrégats, son reçu d'idempotence, son
   audit fonctionnel, ses traces éventuelles et son outbox dans une transaction MongoDB.
6. Garantir la concurrence par filtre sur toutes les révisions lues ; aucun conflit ne
   fusionne un état ou ne relance un hasard.
7. Conserver dans des collections communes les reçus et l'outbox sous propriété
   technique du `kernel`, et l'audit append-only sous la capacité `game-history`, tout
   en enregistrant le module propriétaire de chaque fait.
8. Ne rendre obligatoire aucune projection persistée pour le pilote. Toute projection
   future reste reconstructible, versionnée et impropre aux décisions métier.
9. Initialiser une base propre sans copier, convertir ou relire les collections
   actuelles ; charger seulement les releases et données conformes aux spécifications.
10. Appliquer un soft delete aux comptes et campagnes. Les données métier et l'audit
    fonctionnel durables ne sont jamais effacés automatiquement ; une purge définitive
    exige une demande explicite, et les seules données de reprise d'un combat suivent
    leur clôture métier.
11. Sortir toute cardinalité non bornée dans des collections enfants et garder les
    racines mutables sous un budget de conception de 1 Mio, avec refus à 8 Mio.
12. Figer au lancement les références versionnées des participants d'un combat,
    persister une transition par interaction, puis supprimer les données détaillées de
    reprise après fermeture complète du butin.
13. Protéger la fouille d'un contenant par un bail exclusif persistant et expirant,
    jamais par une transaction maintenue pendant l'interaction humaine.
14. Garantir une seule amitié par paire canonique ; la première acceptation clôt toute
    demande inverse sans créer de doublon.
15. Conserver le journal de sécurité séparé et minimisé pendant 12 mois, avec accès
    plateforme uniquement et chiffrement du stockage et des sauvegardes.

## Rétention validée

- aucun TTL pour les snapshots métier, versions, reçus, traces et audits fonctionnels
  durables, qu'ils soient actifs, terminaux, abandonnés ou supprimés logiquement ;
- suppression métier des interactions et états de reprise du combat après fermeture
  complète de sa phase de butin ;
- aucune expiration d'une outbox non livrée, puis 30 jours après livraison complète ;
- TTL des seuls jetons techniques à leur expiration ;
- TTL de 12 mois pour le journal technique de sécurité ;
- purge physique complète selon manifeste après demande explicite validée.

Une suppression ordinaire marque le compte ou la campagne comme supprimé et bloque les
parcours normaux sans rompre les références. Une purge définitive efface compte,
authentification, médias, amitiés et adhésions ; elle désassigne les personnages des
campagnes conservées. Une campagne possédée est transférée par vote lorsqu'elle garde
des membres, ou purgée avec toutes ses données lorsqu'elle n'en garde aucun. Les faits
partagés restants anonymisent irréversiblement l'acteur et les sauvegardes antérieures
sont détruites.

Les règles détaillées du vote de succession restent une **DÉCISION REQUISE**.

## Conséquences

- Les activations de build, actions de combat, repos et transferts de butin peuvent
  modifier plusieurs collections sans état partiel.
- Une errata ou modification mécanique ne réécrit aucun historique.
- Les index uniques défendent l'emplacement unique de `BuildChange`, les attributions,
  amitiés, adhésions, activités, générations et baux concurrents.
- MongoDB doit fonctionner dans une topologie compatible avec les transactions.
- Les lectures composées peuvent coûter davantage de requêtes avant qu'une mesure ne
  justifie un read model.
- Les données reliques sont volontairement abandonnées ; aucun état `LEGACY` ne pollue
  le domaine cible.
- Une respécialisation abandonnée ferme son workflow sans supprimer son candidat.
- Un compte ou une campagne supprimé reste explicable et restaurable tant qu'aucune
  purge définitive n'a été explicitement demandée ; après purge, aucune restauration
  depuis une ancienne sauvegarde n'est permise.

## Risques

- Une transaction trop longue ou volumineuse peut être annulée ; le découpage en
  enfants, les lots et les manifestes évitent de transformer 16 Mio en objectif.
- Le volume des versions, reçus et audits durables croît volontairement hors purge
  explicite et nettoyage terminal des étapes de combat.
- L'ancien code et l'ancienne base ne constituent aucun chemin de rollback.
- Le vote de succession incomplet bloque la purge d'un propriétaire afin de ne pas
  laisser une campagne sans responsable.

## Validation

Le propriétaire a validé cette décision le 21 août 2026, y compris l'abandon d'une
respécialisation par le joueur assigné ou tout MJ actif, le soft delete ordinaire, la
purge définitive complète, l'initialisation sur base propre, le bail de fouille,
l'unicité des amitiés, l'historique temporaire des combats et le journal de sécurité.

Cette validation ne modifie aucun code et n'autorise encore ni dépendance, ni seed, ni
migration, ni CI.
