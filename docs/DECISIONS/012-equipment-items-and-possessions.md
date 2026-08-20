# DEC-012 — Équipement, objets et possessions

- **Statut :** validée
- **Contexte :** le bloc B07 doit concilier les unités du *Player's Handbook 2024*,
  ses variantes facultatives, l'autorité des joueurs sur leurs possessions et les
  objets magiques du *Dungeon Master's Guide 2024*, sans introduire dans le MVP un
  simulateur de commerce ou d'artisanat.

## Décision

Le poids est présenté avec la conversion fonctionnelle `1 lb = 0,5 kg`. La valeur
source en livres reste conservée afin que sommes, limites, corrections et relectures
historiques soient reproductibles.

La capacité de port est un réglage de campagne désactivé par défaut. Lorsqu'il est
actif, le produit avertit avant la limite puis refuse une mutation qui la dépasserait.
L'activation du réglage sur un inventaire déjà excédentaire signale l'écart sans
supprimer, déplacer ou abandonner automatiquement une possession.

La variante de taille d'équipement, son ajustement et son coût `1d4 × 10 %` ne sont
pas automatisés au MVP. Le MJ l'arbitre et peut enregistrer une correction auditée.

Le MVP n'offre ni boutique ni workflow de commerce, fabrication, service, monture ou
véhicule. Acquisition, dépense, vente et fabrication sont arbitrées par le MJ. Une fois
un objet détenu, toutes ses conséquences mécaniques déterministes sont néanmoins
automatisées ; les montures et véhicules conservent leurs profils propres.

Le joueur assigné peut organiser, équiper, utiliser et déposer ses possessions. Il
peut proposer un transfert à un autre personnage actif de la même campagne, mais le
transfert ne devient effectif qu'après consentement de son joueur assigné. Un MJ actif
peut attribuer ou corriger directement selon ses permissions, avec motif obligatoire
pour une correction.

La maîtrise d'une arme et sa botte d'arme sont deux notions distinctes. La maîtrise
autorise l'ajout du bonus de maîtrise au jet d'attaque. Une botte est une propriété
spéciale déverrouillée pour un type d'arme par la capacité *Bottes d'arme* ; elle se
greffe à une attaque selon son déclencheur propre et n'est pas une Action autonome.

## Conséquences

- Inventaire, mains, port, conteneurs, exemplaires et poids sont indépendants du build
  du personnage et restent auditables.
- Une mutation refusée pour charge, permission ou consentement ne déplace et ne
  consomme rien.
- Les valeurs de vente et recettes restent disponibles au MJ sans créer de marché ou
  de disponibilité garantis.
- Identification, harmonisation, charges, malédictions, artefacts, objets conscients
  et chaque profil magique A–Z suivent les sources PHB/DMG et les projections privées.
- Les 116 règles communes et 10 constats d'implémentation sont inventoriés dans la
  [`matrice B07`](../rules/dnd-2024/B07-EQUIPMENT-ITEMS-AND-PROFICIENCIES.md).
