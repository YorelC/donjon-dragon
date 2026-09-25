# Spec 009 — Création serveur complète d'un personnage de niveau 1

## Références normatives

- `SF-002`, création de niveau 1 ;
- matrice validée `B01-LEVEL-ONE-CREATION.md`, 85 règles ;
- `DEC-003`, `DEC-008`, `DEC-011` et `DEC-012` ;
- `DEC-015`, Phase 5A : autorité serveur, calcul pur, projections nommées et enveloppe
  transactionnelle ;
- `DEC-016`, Phase 5B : snapshots révisés, versions immuables, reçus, audit et outbox ;
- Phase 5C : sélecteurs fermés, cardinalités exactes, provenance et échec local ;
- Spec 007 : appartenance campagne, auto-attribution atomique et lectures privées ;
- *Player's Handbook 2024*, pages pointées par B01. La table des 100 babioles des
  pages 46–47 a été contrôlée textuellement et visuellement pour cet incrément.

## Périmètre

L'incrément rend la commande de création initiale autoritaire pour l'identité, le
build, les sorts, l'équipement et la fiche calculée d'un personnage exactement au
niveau 1. Il couvre aussi l'aperçu, qui emploie le même moteur sans persister, mais
un validateur tolérant : il refuse une source ou une clé inconnue, jamais un choix
encore incomplet (voir « Deux frontières »).

L'incrément couvre également la revue par le MJ et la correction après refus, selon
le workflow décrit plus bas. La progression, l'état d'aventure et le combat restent
hors périmètre. L'auto-attribution et la confidentialité restent celles de la Spec 007.

## Audit initial des 85 règles

Qualification vérifiée avant modification du code : `CONFORME` signifie représenté
et contrôlé par le serveur ; `PARTIELLE`, seulement représenté ou contrôlé sur une
partie du chemin ; `ABSENTE`, non représentable ou sans contrôle utile.

| Règle | État initial | État après incrément | Preuve factuelle après |
|---|---|---|---|
| B01-ID-001 | PARTIELLE | CONFORME | Création transactionnelle : reçu, personnage, audit et outbox dans une session ; `mongo-character-creation.repository.test.ts`. |
| B01-ID-002 | PARTIELLE | CONFORME | `progressionOf` rend niveau, PX initiaux, bonus de maîtrise et dé de vie ; `resolve-sheet.test.ts`. |
| B01-ID-003 | PARTIELLE | PARTIELLE | Nom Zod 2-50 ; le verrou de revue existe dans le domaine et le parcours transactionnel possède une preuve Mongo dédiée, à rejouer sur une réplica-set disponible. |
| B01-ID-004 | ABSENTE | CONFORME | `AlignmentSchema` au contrat, exigé par `requireCompleteIdentity`, persisté requis. |
| B01-ID-005 | ABSENTE | CONFORME | `age` entier positif, exigé par `requireCompleteIdentity`, persisté requis. |
| B01-ID-006 | ABSENTE | CONFORME | `heightCm` et `weightKg` positifs, exigés par `requireCompleteIdentity`, persistés requis. |
| B01-ID-007 | ABSENTE | CONFORME | `description` nullable au contrat et en base. |
| B01-ID-008 | ABSENTE | ABSENTE | Le stockage objet est décidé ; fournisseur, contrat de sécurité et téléversement restent à réaliser. |
| B01-ID-009 | PARTIELLE | CONFORME | Douze classes et dix espèces, Aasimar compris (`species.ts`). |
| B01-ID-010 | PARTIELLE | CONFORME | `assertChoiceSources` ferme les sources, `assertChoiceFields` ferme les champs par source. |
| B01-CAR-001 | CONFORME | CONFORME | Inchangé : `VALIDATORS` par méthode dans `ability-assignment.ts`. |
| B01-CAR-002 | CONFORME | CONFORME | Le serveur tire par le port `DICE` et conserve le tirage ; la création ne reçoit qu'une référence, consommée une seule fois. `roll-abilities.use-case.test.ts`, `mongo-ability-roll.repository.test.ts`. |
| B01-CAR-003 | CONFORME | CONFORME | Inchangé : plans et caractéristiques de l'historique contrôlés. |
| B01-CAR-004 | PARTIELLE | CONFORME | `assertFinalScores` refuse un total supérieur à 20 au lieu de l'écrêter. |
| B01-ESP-001 | PARTIELLE | CONFORME | Dix profils avec traits, vitesse, vision et lignages ; les 120 combinaisons passent. |
| B01-ESP-002 | ABSENTE | PARTIELLE | Aasimar présent dans `SPECIES` ; ses trois révélations restent descriptives. |
| B01-ESP-003 | PARTIELLE | CONFORME | Dix ascendances draconiques, lignage contrôlé par `assertLineage`. |
| B01-ESP-004 | PARTIELLE | CONFORME | Traits nains et PV par niveau ; couvert par `resolve-sheet.test.ts`. |
| B01-ESP-005 | PARTIELLE | CONFORME | `assertLineageSpellcastingAbility` exige la caractéristique quand le lignage en propose une. |
| B01-ESP-006 | PARTIELLE | CONFORME | Même contrôle, et la fréquence du sort gnome passe à `proficiencyBonusPerLongRest`. |
| B01-ESP-007 | PARTIELLE | CONFORME | Six ascendances et errata du test de caractéristique. |
| B01-ESP-008 | PARTIELLE | CONFORME | Traits structurés, validés par les 120 combinaisons. |
| B01-ESP-009 | PARTIELLE | CONFORME | Compétence et don de l'Humain contrôlés (`assertOriginFeats`) ; taille calculée par `sizeFromHeight`. |
| B01-ESP-010 | PARTIELLE | CONFORME | Traits orcs validés par les 120 combinaisons. |
| B01-ESP-011 | PARTIELLE | CONFORME | Héritage tieffelin et caractéristique de lignage contrôlés ; taille calculée par `sizeFromHeight`. |
| B01-ESP-012 | ABSENTE | CONFORME | La catégorie est calculée par `sizeFromHeight` depuis la taille physique, puis persistée ; `assertSpeciesPhysique` borne les mesures. |
| B01-HIS-ACOLYTE | PARTIELLE | CONFORME | Initié à la magie contrôlé, liste imposée par `assertFixedBackgroundList`. |
| B01-HIS-ARTISAN | PARTIELLE | CONFORME | Outil d'artisan concret exigé par `BACKGROUND_TOOL_CHOICES`. |
| B01-HIS-CHARLATAN | PARTIELLE | CONFORME | Sous-choix de Doué bornés par `assertFeatChoice`. |
| B01-HIS-CRIMINAL | PARTIELLE | CONFORME | Octrois déterministes, validés par les 120 combinaisons. |
| B01-HIS-ENTERTAINER | PARTIELLE | CONFORME | Instrument concret exigé par `BACKGROUND_TOOL_CHOICES`. |
| B01-HIS-FARMER | PARTIELLE | CONFORME | Octrois déterministes, validés par les 120 combinaisons. |
| B01-HIS-GUARD | PARTIELLE | CONFORME | Boîte de jeux concrète exigée par `BACKGROUND_TOOL_CHOICES`. |
| B01-HIS-GUIDE | PARTIELLE | CONFORME | Initié à la magie contrôlé, liste imposée. |
| B01-HIS-HERMIT | PARTIELLE | CONFORME | Octrois déterministes, validés par les 120 combinaisons. |
| B01-HIS-MERCHANT | PARTIELLE | CONFORME | Octrois déterministes, validés par les 120 combinaisons. |
| B01-HIS-NOBLE | PARTIELLE | CONFORME | Jeu concret et sous-choix de Doué bornés. |
| B01-HIS-SAGE | PARTIELLE | CONFORME | Initié à la magie contrôlé, liste imposée. |
| B01-HIS-SAILOR | PARTIELLE | CONFORME | Octrois déterministes, validés par les 120 combinaisons. |
| B01-HIS-SCRIBE | PARTIELLE | CONFORME | Sous-choix de Doué bornés par `assertFeatChoice`. |
| B01-HIS-SOLDIER | PARTIELLE | CONFORME | Jeu concret exigé par `BACKGROUND_TOOL_CHOICES`. |
| B01-HIS-WAYFARER | PARTIELLE | CONFORME | Outil fixe, sans choix de maîtrise ; sa boîte de jeux relève du paquetage. `validate-choices.test.ts`. |
| B01-ORI-001 | PARTIELLE | CONFORME | `assertLanguages` exige exactement deux langues standards distinctes. |
| B01-ORI-002 | PARTIELLE | CONFORME | Langues de classe contrôlées par `assertSkillChoice` et les octrois. |
| B01-ORI-003 | PARTIELLE | CONFORME | `ALL_CONCRETE_TOOLS` ferme le vocabulaire ; plus de chaîne libre. |
| B01-ORI-004 | PARTIELLE | CONFORME | `assertOriginFeats` : don d'historique imposé, don d'espèce réservé à l'Humain. |
| B01-ORI-005 | PARTIELLE | CONFORME | `assertFeatChoice` borne listes et quotas de chaque don d'Origines. |
| B01-ORI-006 | PARTIELLE | CONFORME | `assertExactUnique` applique les quotas aux valeurs soumises. |
| B01-CLA-BAR | PARTIELLE | CONFORME | Deux bottes d'armes exigées par `assertWeaponMasteries`. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-BARD | PARTIELLE | CONFORME | Instruments et quotas de sorts contrôlés. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-CLR | PARTIELLE | CONFORME | Ordre divin et cardinalités de sorts contrôlés. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-DRU | PARTIELLE | CONFORME | Ordre, druidique et sorts contrôlés. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-FTR | PARTIELLE | CONFORME | Style de combat et trois bottes d'armes contrôlés. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-MNK | PARTIELLE | CONFORME | Outil concret exigé. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-PAL | PARTIELLE | CONFORME | Armes et sorts contrôlés. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-RGR | PARTIELLE | CONFORME | Armes et sorts contrôlés. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-ROG | PARTIELLE | CONFORME | Expertise bornée aux compétences choisies, outils et langue contrôlés. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-SOR | PARTIELLE | CONFORME | Listes et cardinalités contrôlées. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-WLK | PARTIELLE | CONFORME | Invocation et sous-choix publiés au wizard ; Pacte de la Lame calculé et affiché avec sa provenance. Les 120 combinaisons passent. |
| B01-CLA-WIZ | PARTIELLE | CONFORME | Quatre sorts préparés et grimoire de six. Les 120 combinaisons passent (`level-one-combinations.test.ts`). |
| B01-CLA-001 | PARTIELLE | CONFORME | Quotas, listes, doublons et conflits avec les octrois fixes contrôlés (`assertNoDuplicateProficiencies`, `assertGrantedClassSpellsAreNotChosen`). |
| B01-CLA-002 | ABSENTE | CONFORME | `assertWeaponMasteries` borne les bottes au catalogue et au quota de la classe. |
| B01-CLA-003 | PARTIELLE | CONFORME | `assertSingleOption` borne la clé de style aux dix styles de référence. |
| B01-CLA-004 | ABSENTE | CONFORME | `assertInvocationDetails` ferme les sous-choix ; `resolveAttacks` ajoute l'arme de pacte maîtrisée au Charisme et la fiche affiche sa provenance. |
| B01-SOR-001 | PARTIELLE | PARTIELLE | 98 sorts de niveaux 0-1, le seul périmètre qu'une fiche de niveau 1 consomme ; le corpus 391 relève de B06. |
| B01-SOR-002 | PARTIELLE | CONFORME | Chaque origine valide ses propres sorts (`spellsChosenBy`, `assertMagicInitiate`). |
| B01-SOR-003 | PARTIELLE | CONFORME | `assertKnownUnique` refuse une clé absente de `SPELLS`. |
| B01-SOR-004 | PARTIELLE | CONFORME | `SpellFlags` porte préparation, rituel et cadence gratuite jusque dans la fiche. |
| B01-SOR-005 | ABSENTE | CONFORME | `assertWizardSpellbook` : six sorts, et tout préparé doit y figurer. |
| B01-EQP-001 | PARTIELLE | CONFORME | `resolveStartingEquipment` refuse une option qui ne vient pas de la classe ou de l'historique choisi. |
| B01-EQP-002 | PARTIELLE | CONFORME | Objets et or recalculés depuis le paquetage ; ceux du client sont ignorés. |
| B01-EQP-003 | PARTIELLE | CONFORME | Entrées génériques concrétisées par `BACKGROUND_CHOICE_CATALOG` et `CLASS_CHOICE_CATALOG`. |
| B01-EQP-004 | ABSENTE | CONFORME | Cent babioles, `isTrinketId`, ajoutée sans toucher à l'or. |
| B01-EQP-005 | PARTIELLE | PARTIELLE | L'ajout arbitraire est refusé par le recalcul ; le magasin et l'achat restent hors périmètre. |
| B01-EQP-006 | PARTIELLE | CONFORME | Armure et bouclier reliés au paquetage et au type porté. |
| B01-FIC-001 | PARTIELLE | CONFORME | PX, dé de vie, PV courants, attaques et grimoire s'ajoutent aux dérivés. |
| B01-FIC-002 | PARTIELLE | CONFORME | `currentHitPoints` initialisé au maximum calculé. |
| B01-FIC-003 | PARTIELLE | PARTIELLE | Sources portées par PV, PV courants, CA, initiative et vitesse ; pas encore par compétence ni attaque. |
| B01-FIC-004 | CONFORME | CONFORME | Inchangé : aperçu et lecture appellent le même `resolveSheet`. |
| B01-VAL-001 | PARTIELLE | PARTIELLE | Création en un geste, avec reçu et audit ; aucun état soumis versionné. |
| B01-VAL-002 | ABSENTE | PARTIELLE | États, transitions et commandes transactionnelles sont implémentés ; le test Mongo dédié reste à exécuter sur une réplica-set disponible. |
| B01-VAL-003 | ABSENTE | PARTIELLE | Acceptation, refus, autorisation MJ et routes sont couverts ; la preuve Mongo réelle reste à rejouer. |
| B01-VAL-004 | ABSENTE | PARTIELLE | Motif obligatoire, projection privée et audit sont implémentés ; la preuve Mongo réelle reste à rejouer. |
| B01-VAL-005 | ABSENTE | PARTIELLE | Retour en correction, version immuable, correction réelle et resoumission sont couverts ; la preuve Playwright reste à exécuter. |
| B01-VAL-006 | CONFORME | CONFORME | Inchangé : Spec 007, projections privées joueur/MJ. |

**Bilan initial : 5 conformes, 65 partielles, 15 absentes.**

**Bilan après incrément, validation domaine uniquement : 74 conformes,
10 partielles, 1 absente.**

> **Portée de ce chiffre.** Il qualifie ce que le serveur valide et calcule,
> prouvé par les tests unitaires du domaine et des use-cases. Il ne dit rien du
> parcours réel. Le wizard représente désormais maîtrises, outils, invocations,
> grimoire, dons répétés et objets concrets, mais le chiffre définitif ne sera établi
> qu'après cet audit de contrat, sur quatre niveaux de preuve distincts :
> validation domaine, parcours HTTP, parcours wizard, persistance Mongo
> réellement exécutée.

Les dix partielles restantes tiennent à cinq causes, toutes assumées : les
révélations de l'Aasimar restent descriptives (`B01-ESP-002`), le corpus complet
des 391 sorts appartient à B06
(`B01-SOR-001`), le magasin et l'achat sont hors périmètre (`B01-EQP-005`), et
les sources par compétence restent incomplètes (`B01-FIC-003`), et le workflow de
validation attend encore l'exécution de ses preuves Mongo et Playwright
(`B01-ID-003`, `B01-VAL-001` à `B01-VAL-005`). La seule ligne absente est le téléversement du
portrait, dont le stockage objet est décidé mais pas encore spécifié techniquement.

Une règle validée dont la conséquence n'atteint pas la fiche ne serait pas
conforme ; le calcul et l'affichage du Pacte de la Lame ferment désormais cet écart.


## Tirage des caractéristiques

L'exception provisoire de `DEC-005` est fermée. Le serveur émet le tirage par le
port `DICE`, le conserve dans un reçu de commande du kernel, et la composition
n'en transporte plus que l'identité (`abilityRollId`).

- **Relances illimitées.** Chaque demande émet un tirage ; seul celui que la
  création désigne est consommé.
- **Consommation unique.** La bascule du reçu de `accepted` à `consumed` a lieu
  dans la transaction qui écrit le personnage : deux créations concurrentes ne
  peuvent pas s'appuyer sur le même tirage.
- **Propriété.** Un tirage n'est lisible que par le joueur à qui il a été émis,
  et dans la campagne où il l'a été.
- **Affectation.** `AbilityAssignment` exigeait déjà que `base` soit une
  permutation exacte des totaux ; cette garantie devient réelle maintenant que
  les totaux viennent du serveur.

### Deux contrats, pas un

La composition est commune, mais l'invariant de tirage est opposé selon la
commande. Le contrat partagé l'exprime par deux schémas, et le back comme le
front les distinguent jusque dans leurs types :

| Commande | Schéma Zod | Type | `abilityRollId` |
|---|---|---|---|
| `POST /campaigns/:id/characters` | `CreateCharacterSchema` | `CreateCharacterDto` | obligatoire si `roll`, sinon `null` |
| `PUT /campaigns/:id/characters/:characterId` | `FinalizeCharacterSchema` | `FinalizeCharacterDto` | toujours `null` |

Les confondre casse l'édition de tout personnage tiré aux dés : c'est arrivé une
fois, et la suite « création et édition, deux contrats distincts » de
`shared/src/character-schema.test.ts` verrouille désormais la distinction.

## Contrat de création

La commande HTTP authentifiée porte une `Idempotency-Key` Zod-validée. L'acteur vient
exclusivement de `@CurrentUser()`. L'intention canonique contient le type de commande,
la campagne et le corps validé complet. Même principal, clé et intention relisent le
résultat initial ; même clé et intention différente répondent en conflit.

Le corps représente uniquement des entrées et choix :

- identité : nom, alignement parmi neuf valeurs, âge entier positif, taille physique
  positive en centimètres, poids positif en kilogrammes, description facultative ;
- origine : espèce, lignée éventuelle, catégorie `Small`/`Medium`, historique, deux
  langues standards distinctes ;
- caractéristiques : méthode, six bases, bonus d'historique et dés bruts lorsque la
  méthode est le tirage ;
- choix sourcés : compétences, expertise, outils, langue de classe, don humain,
  caractéristique magique, style, ordre, bottes d'armes, invocation et sous-choix,
  sorts de classe/don/invocation et grimoire ;
- équipement : identifiants d'option de classe et d'historique, choix concrets promis
  par ces options, armure et bouclier portés, babiole facultative identifiée de 1 à
  100. Les objets, quantités et l'or envoyés historiquement sont ignorés au profit du
  recalcul serveur et ne deviennent jamais une source d'autorité.

Le serveur force niveau 1, 0 PX, bonus de maîtrise +2 et release de référence courante
de l'incrément. Aucune valeur dérivée n'est acceptée dans le corps.

## Invariants de composition

1. Les catalogues de création sont fermés : 10 espèces, 12 classes, 16 historiques,
   10 dons d'Origine, langues, outils, armes, styles, ordres, cinq invocations niveau 1,
   sorts et 100 babioles.
2. Chaque choix possède exactement la source qui le permet. Un champ supplémentaire
   sur une source qui ne le demande pas est refusé.
3. Les quotas sont des égalités, jamais des minima. Les doublons ne satisfont aucun
   quota et une maîtrise déjà fixe oblige à choisir une autre option autorisée.
4. Toute combinaison espèce–classe est permise ; seules les règles internes peuvent
   invalider la copie.
5. La taille D&D est distincte de la taille physique et appartient aux options de
   l'espèce.
6. Le don d'historique est imposé. Le don humain est limité aux dons d'Origine et ses
   sous-choix sont validés comme une source séparée.
7. Initié à la magie, la magie de classe, la magie d'espèce, une invocation et le
   grimoire gardent listes, niveaux, quotas et provenance distincts.
8. Le grimoire contient six sorts de Magicien niveau 1 uniques ; les quatre préparés
   sont inclus dans ces six.
9. Pacte du grimoire contient trois sorts mineurs et deux rituels niveau 1 issus de
   listes autorisées et non déjà préparés. Pacte de la chaîne et Pacte de la lame
   n'acceptent que leurs catalogues fermés.
10. Les options d'équipement appartiennent à la classe et à l'historique choisis. Le
    serveur agrège leurs entrées, remplace toute entrée générique par le choix concret,
    additionne l'or et ajoute la babiole sans coût.
11. Une armure ou un bouclier porté est possédé. Une option en or seul ne matérialise
    aucun objet promis par le paquetage abandonné.
12. Le score final est recalculé et une composition au-delà de 20 est refusée, jamais
    écrêtée silencieusement.

## Persistance et transaction

La création persiste atomiquement le personnage complet, son auto-attribution lorsque
l'acteur est joueur, le reçu durable, l'audit fonctionnel et le fait d'outbox. Une
erreur de catalogue, quota, appartenance, unicité ou persistance annule tout. Le
personnage porte une révision initiale explicite ; toute mutation ultérieure filtre
sur la révision attendue. Une relecture charge toujours par campagne et identifiant.

Le document persiste les entrées de composition et l'équipement recalculé. La fiche
reste une projection calculée, sans dérivés client persistés.

## Fiche initiale calculée

La fiche expose niveau, PX, bonus de maîtrise, scores/modificateurs, PV max et actuels
initiaux, dé de vie, CA, initiative, vitesse, perception passive, sauvegardes,
18 compétences, maîtrises/expertise, langues, attaques d'armes possédées, magie groupée
par provenance, DD/attaque magique, capacités, ressources, grimoire et équipement.
Les dérivés sont obtenus du même moteur pour l'aperçu et la lecture persistée.

## Projections et isolation

Les lectures complètes restent réservées au joueur assigné et aux MJ actifs. Le vivier
ne reçoit ni identité détaillée, ni caractéristiques, choix, sorts ou équipement. Toute
ressource se charge par campagne ; un identifiant extérieur est masqué comme absent.

## Cas limites Given/When/Then

1. Étant donné chacune des 120 paires espèce–classe et des choix internes valides,
   quand la création est commandée, alors elle produit un personnage niveau 1.
2. Étant donné une langue rare dans le quota de deux langues standards, quand la copie
   est soumise, alors elle est refusée ; une langue de classe séparée ne réduit pas ce
   quota.
3. Étant donné un score final supérieur à 20, quand la copie est soumise, alors aucune
   fiche n'est persistée et aucune valeur n'est écrêtée.
4. Étant donné un sort inconnu, du mauvais niveau, de la mauvaise liste, dupliqué, en
   trop ou manquant, quand la copie est soumise, alors la source fautive est refusée.
5. Étant donné un sort d'Initié à la magie, quand le quota de classe est évalué, alors
   ce sort ne le satisfait pas.
6. Étant donné un Magicien avec quatre préparés dont un absent de son grimoire, quand
   la copie est soumise, alors elle est refusée.
7. Étant donné une invocation de niveau 2+, une forme de familier inconnue, une arme de
   pacte à distance ou un rituel invalide, quand la copie est soumise, alors elle est
   refusée sans effet partiel.
8. Étant donné une botte d'arme sur une arme non maîtrisée par la classe, quand la
   copie est soumise, alors elle est refusée.
9. Étant donné une option d'équipement d'une autre classe, un objet ou de l'or forgé
   par le client, quand la copie est soumise, alors le serveur refuse l'option ou
   recalcule les conséquences sans reprendre les valeurs forgées.
10. Étant donné une armure ou un bouclier non reçu, quand le personnage le déclare
    porté, alors la copie est refusée.
11. Étant donné la même composition avec et sans une babiole valide, quand les deux
    équipements sont calculés, alors l'or est identique et une seule possession
    supplémentaire apparaît.
12. Étant donné une création joueur, quand une écriture de l'enveloppe échoue, alors
    ni personnage, ni attribution, reçu, audit ou outbox ne subsiste.
13. Étant donné une commande acceptée retransmise avec la même clé et intention, quand
    elle est rejouée, alors le résultat initial est relu sans second personnage.
14. Étant donné la même clé avec une intention différente, quand elle est rejouée,
    alors elle répond en conflit sans mutation.
15. Étant donné l'identifiant d'un personnage d'une autre campagne ou un autre joueur,
    quand la fiche ou le build est demandé, alors aucune donnée privée n'est projetée.

## Statuts HTTP et preuve de bout en bout

| Cas | Statut |
|---|---|
| Émission d'un tirage | `201`, corps `{ rollId, dice, totals }` |
| Rejeu de la même clé, même intention | `201`, même `rollId`, aucun nouveau jet |
| Même clé, autre campagne | `409` |
| Clé d'idempotence absente ou non-UUID | `400` |
| Création qui désigne un tirage émis | `201` |
| Création `roll` sans tirage désigné | `400` (contrat), `409` si le use-case est appelé hors HTTP |
| Création sans tirage qui en désigne un | `400` |
| Création réutilisant un tirage consommé | `400` |
| Édition d'un personnage tiré, `abilityRollId: null` | `200` |
| Édition qui redésigne un tirage | `400` |

Ces dix cas sont exécutés par la collection Bruno (`e2e/bruno`, requêtes 106 à 119),
contre un vrai serveur et une vraie base : c'est la seule couche qui traverse les
décorateurs Zod, l'authentification et la persistance. Les tests unitaires prouvent
les branches d'erreur isolées ; les tests d'intégration Mongo, gardés par
`MONGODB_INTEGRATION_URI`, prouvent concurrence et atomicité.

## Parcours de création — état civil, gabarit et langues

Avant ce lot, **aucune création issue de l'interface ne pouvait aboutir** : le
contrat exigeait `alignment`, `age`, `heightCm`, `weightKg`, `size` et
`standardLanguages`, et le modèle front n'en portait aucun. L'aperçu était rejeté
lui aussi — `PreviewCharacterSheetSchema` exige déjà le gabarit et les langues —
donc le bouton final ne s'activait jamais.

### Invariants

- **Deux langues standards distinctes**, prises parmi les neuf de
  `STANDARD_LANGUAGES`. Le Commun est accordé d'office (`DEFAULT_LANGUAGE`) et
  n'est **pas** sélectionnable : l'offrir brûlerait un des deux emplacements.
  Les langues rares relèvent d'autres sources — la langue supplémentaire du
  Roublard — et ne comptent pas dans ce quota.
- **Le gabarit n'est jamais demandé au joueur** (DEC-008). Il est imposé par
  l'espèce, sauf pour les trois qui offrent `['Small', 'Medium']` : le backend le
  déduit alors de la taille physique (`sizeFromHeight`, seuil 122 cm). Le contrat
  HTTP ne transporte pas `size`. Changer d'espèce remet taille et poids à leur
  valeur par défaut pour la nouvelle espèce, milieu de plage arrondi à l'inférieur
  (DEC-008) : des mesures prises dans les bornes d'une autre espèce n'en sont pas.
  L'espèce proposée à l'ouverture du wizard reçoit les mêmes valeurs par défaut.
- **L'état civil est exigé à la création.** Tant que la fiche est un brouillon ou
  a été refusée, le wizard la rouvre entièrement modifiable, état civil compris ;
  une fiche acceptée ne se rouvre plus. Après acceptation, une commande dédiée ne
  modifie que la description, l'âge et le poids. L'alignement et la taille physique
  restent figés avec les autres choix engagés par la validation.

### Deux frontières, et pourquoi elles diffèrent

| Commande | Schéma | Exige l'origine | Exige l'état civil |
|---|---|---|---|
| `POST /sheet-preview` | `PreviewCharacterSheetSchema` | oui | **non** |
| `POST .../characters` | `CreateCharacterSchema` | oui | oui |
| `PUT .../characters/:id` | `FinalizeCharacterSchema` | oui | oui |

Un joueur voit donc sa fiche calculée bien avant d'avoir choisi son âge, et même
avant d'avoir fini ses choix de classe. L'aperçu n'applique pas `validateChoices` :
les quotas (compétences, sorts, maîtrises, lignage requis…) ne sont vérifiés qu'à la
création et à l'édition. Il applique `validateChoiceKeys` : sources de choix,
champs autorisés par source et clés connues du référentiel, pour que le moteur ne
calcule jamais sur une clé inventée. De même, tant qu'un paquet de départ ou l'objet
qu'il fait choisir manque, l'aperçu calcule sans équipement
(`previewStartingEquipment`) ; une option inconnue reste refusée. Un choix
incomplet donne une fiche partielle, pas un `400`. Côté
front, `toPreviewPayload` s'arrête à l'origine et aux langues, plus la taille
physique dès qu'elle est connue ; `toCreatePayload`
ajoute la garde d'identité, un rétrécissement de type et non un `as`.

### Création, correction et données personnelles

Le `PUT` de correction remplace la composition complète tant que la fiche est en
`draft` ou `refused`. Il est inaccessible pendant la revue et après acceptation.
Une seconde commande étroite prend alors le relais pour les seules données que
DEC-003 laisse modifiables, sans accepter les champs immuables dans son contrat.

| Champ | Édition | Chemin serveur |
|---|---|---|
| composition complète | `draft` ou `refused` | `PUT .../characters/:id` |
| `age`, `weightKg`, `description` | `accepted` | `PUT .../characters/:id/personal-details` |
| `name`, `alignment`, espèce/lignée, historique, `heightCm`, catégorie de taille | **figés après acceptation** | absents du contrat dédié |

Le joueur assigné et les MJ autorisés par la politique d'édition de la campagne
peuvent employer la commande dédiée. Elle exige la révision courante, est
idempotente et persiste personnage, reçu, audit et outbox dans une transaction.

### Exigence → front → HTTP → validation

Première tranche de la matrice complète, limitée à ce lot.

| Exigence | Représentation front | Champ HTTP | Validation serveur |
|---|---|---|---|
| Deux langues standards | étape « Langues », compteur 2/2 | `standardLanguages` | `assertLanguages` : exactement 2, distinctes, dans `STANDARD_LANGUAGES` |
| Gabarit de l'espèce | aucune saisie, déduit de la taille physique | aucun | `sizeFromHeight` dans le build |
| Alignement | étape « Identité », cartes du catalogue | `alignment` | `AlignmentSchema` + `requireCompleteIdentity` |
| Âge, taille, poids | étape « Identité », âge numérique, échelles bornées par l'espèce pour taille et poids | `age`, `heightCm`, `weightKg` | nombres positifs + `requireCompleteIdentity` + `assertSpeciesPhysique` |
| Description | étape « Identité », facultative | `description` | `z.string().nullable().optional()` |

Le catalogue publie les langues (standards et rares) et les alignements, clés
typées par `LanguageSchema` et `AlignmentSchema` : le front ne redit aucune de
ces listes, il les reçoit.

### Critères d'acceptation

1. Étant donné un Nain Clerc Fermier complet, quand le joueur renseigne langues
   et état civil, alors l'aperçu s'affiche et la création répond `201`.
2. Étant donné une espèce qui n'offre qu'une taille, quand le personnage est
   créé, alors sa catégorie est celle de l'espèce, sans aucun choix à l'écran.
3. Étant donné un Humain composé à 110 cm, quand le joueur passe au Goliath,
   alors taille et poids valent le milieu des plages du Goliath (228 cm, 146 kg) ; un Humain
   de 110 cm est créé `Small`, un Humain de 122 cm `Medium`.
4. Étant donné une seule langue choisie, quand le joueur tente d'avancer, alors
   l'étape reste invalide et aucun aperçu n'est demandé.
5. Étant donné un personnage persisté non accepté, quand le wizard le rouvre,
   alors état civil et langues sont restitués et restent modifiables ; une fois la
   fiche acceptée, le wizard ne l'ouvre plus, même par son URL.

### Terminologie française — tranchée

Les libellés des langues et des alignements ne sont sourcés nulle part dans le
dépôt : `docs/characteres/srd-2024/5e-SRD-Languages.json` est en anglais. Ils ont
été arrêtés par Charly le 31/08/2026 et posés dans `LANGUAGE_LABELS`
(`proficiencies.ts`) et `ALIGNMENT_LABELS` (`character-identity.ts`).

`commonSignLanguage`, ajouté par le PHB 2024, ne figurait pas dans la première
liste transmise ; « Langue des signes courante » a été validé le 31/08/2026. La
langue est bien offerte au choix, au même titre que les huit autres standards.

## Parcours de création — ordre et invalidation des choix

Le wizard ordonne chaque choix après toutes les sources dont sa validité dépend :

```text
espèce → lignage → langues → classe → historique → compétences de classe
→ style ou ordre → dons → expertise → caractéristiques → sorts → équipement
→ identité
```

Les étapes conditionnelles ajoutées par les incréments suivants restent placées
derrière leur source : outil d'historique après l'historique ; maîtrises d'armes,
outils et langue de classe après la classe ; expertise après les dons.

Changer une source invalide immédiatement ses conséquences, y compris lorsque
l'utilisateur revient à une étape antérieure :

| Transition | Choix invalidés ou filtrés |
|---|---|
| Classe | compétences, expertise, sorts, style, ordre et paquetage de classe ; armure et bouclier conservés seulement s'ils restent possédés |
| Historique | bonus, paquetage et configuration du don si son octroi change ; compétences de classe devenues doublons et expertise devenue orpheline sont filtrées ; armure et bouclier suivent la possession restante |
| Don configuré | expertise limitée aux compétences encore maîtrisées |

La configuration d'un don ne se résume pas à sa clé. Acolyte, Guide et Sage
accordent tous `magic-initiate`, mais avec trois listes imposées différentes. Un
changement de cette configuration remet donc à zéro liste, caractéristique,
sorts mineurs, sort de niveau 1, compétences et outils choisis par les dons. Tant
que ces choix restent à plat, cette remise à zéro est volontairement globale.

L'expertise propose toutes les compétences déjà maîtrisées, quelle que soit leur
source. Elle n'est jamais conservée sur une compétence qui ne l'est plus.

### Critères d'acceptation du socle

1. Recliquer sur la classe ou l'historique courant ne modifie aucune sélection.
2. Changer de classe conserve une armure ou un bouclier seulement si le paquetage
   d'historique encore sélectionné le fournit.
3. Changer d'historique retire toute compétence de classe désormais accordée par
   le nouvel historique et filtre l'expertise sur les maîtrises restantes.
4. Passer d'Acolyte à Guide remet à zéro la configuration d'Initié à la magie,
   bien que la clé du don ne change pas.
5. L'expertise du Roublard peut cibler une compétence d'historique ou de don.

**Décision du 1er septembre 2026 — langue supplémentaire du Roublard.** Elle
doit être distincte des deux langues standards déjà choisies. Le serveur refuse
le doublon et le front désactive ces deux options avec leur provenance.

## Parcours de création — objets concrets et babiole

Une option de paquetage publie explicitement le choix d'objet concret qu'elle
exige. Le wizard ne le déduit jamais de son libellé ni de la présence d'une
entrée générique : l'option A du Moine exige bien un outil ou un instrument sans
porter de sentinelle dans `entries`.

- le choix de classe et le choix d'historique sont indépendants ;
- chacun porte exactement une clé prise dans la liste publiée pour l'option ;
- choisir l'option « or seul » remet sa clé concrète à `null` ;
- changer d'option remet armure et bouclier à zéro ;
- une babiole facultative est choisie par son identifiant de 1 à 100 ;
- la babiole est ajoutée une fois à l'inventaire sans modifier l'or.

Le catalogue HTTP publie, par option, `itemChoice` avec les clés et libellés
autorisés, ainsi que les cent babioles. La composition conserve
`classChoiceItemKey`, `backgroundChoiceItemKey` et `trinketId`; le payload les
transmet sans recalculer leur validité côté client.

### Critères d'acceptation

1. Un Barde ou un Moine ayant retenu l'option A ne peut terminer l'étape sans
   choisir l'objet concret annoncé.
2. Un Voyageur ayant retenu l'option A choisit une boîte de jeux sans gagner une
   maîtrise supplémentaire.
3. Passer d'une option avec objet concret à l'or seul efface la clé précédente.
4. Une babiole peut rester absente ; si elle est choisie, la réouverture restitue
   son identifiant et l'or reste identique.

## Parcours de création — magie et manifestations occultes

Le catalogue publie les cinq manifestations occultes disponibles au niveau 1 et
le type de sous-choix que chacune exige. Le wizard ne déduit jamais ce sous-choix
du nom de la manifestation : Pacte de la Chaîne choisit une forme de familier,
Pacte de la Lame une arme de corps à corps et Pacte du Grimoire trois sorts
mineurs ainsi que deux rituels de niveau 1.

Les choix d'Initié à la magie restent séparés par leur provenance. L'historique
et le don d'espèce de l'Humain peuvent donc accorder deux occurrences distinctes,
chacune avec sa liste imposée ou choisie, sa caractéristique et ses propres sorts.

Le Magicien choisit quatre sorts préparés et six sorts de niveau 1 dans son
grimoire. Les quatre préparés doivent appartenir aux six ; le wizard applique la
même contrainte que le serveur et restitue les deux ensembles à la réouverture.

Pacte de la Lame produit une attaque calculée même si l'arme n'appartient pas au
paquetage. Cette attaque emploie le Charisme, ajoute le bonus de maîtrise et porte
la provenance « Pacte de la Lame ». Si le paquetage contient la même arme, la
version de pacte remplace son attaque ordinaire afin de ne pas afficher deux lignes
indistinguables pour une même arme.

### Critères d'acceptation

1. Un Occultiste ne peut franchir l'étape sans une manifestation et son éventuel
   sous-choix complet ; changer de manifestation efface les détails précédents.
2. Pacte de la Lame n'offre que les armes de corps à corps et produit une attaque
   maîtrisée au Charisme, y compris sans possession de l'arme.
3. Un Magicien ne peut préparer un sort absent de son grimoire, ni terminer avec
   moins de six sorts de grimoire distincts.
4. Deux dons Initié à la magie conservent deux choix sourcés et deux quotas
   indépendants dans le payload.
5. Pacte du Grimoire refuse tout doublon, tout sort mineur manquant et tout sort
   de niveau 1 qui n'est pas un rituel.

## Cas d'idempotence et leur preuve

Les deux commandes — émission d'un tirage, création d'un personnage — partagent
la collection `command_receipts` et son index unique `{principalKey,
idempotencyKey}`. Une clé appartient donc à **une** intention, pas à un joueur.

| Cas | Comportement attendu | Où c'est prouvé |
|---|---|---|
| Rejeu après réponse perdue, tirage | même `rollId`, aucun dé relancé | `roll-abilities.use-case.test.ts` |
| Rejeu après réponse perdue, création | même personnage, aucune seconde écriture | `create-character.use-case.test.ts`, `mongo-character-creation.repository.test.ts` |
| Rejeu d'une création : le tirage n'est pas relu | court-circuit avant `findIssued`, donc pas de seconde consommation | `create-character.use-case.test.ts` |
| Reçu présent, résultat illisible | conflit, jamais un second résultat | les deux use-cases, les deux repositories |
| Même clé, autre intention (autre campagne) | conflit | `roll-abilities.use-case.test.ts`, requête Bruno 111 |
| Même clé, autre commande (tirage ↔ création) | résultat jugé illisible, donc conflit | les deux repositories Mongo |
| Collision d'index, reçu lisible et même empreinte | le reçu déjà écrit fait foi, les dés du perdant sont jetés | les deux repositories Mongo |
| Collision d'index, reçu introuvable | conflit pour un tirage ; personnage déjà existant pour une création, l'index violé n'étant alors pas celui de la clé | les deux repositories Mongo |
| Erreur Mongo qui n'est pas une collision | remonte telle quelle, jamais avalée | `mongo-character-creation.repository.test.ts` |

Deux limites assumées, à ne pas lire comme des garanties :

- ces tests de repository montent des modèles Mongoose doublés. Ils prouvent la
  **logique** de rejeu et de récupération, pas que l'index unique existe ni que
  la transaction s'annule vraiment. Cette preuve-là appartient aux tests
  d'intégration gardés par `MONGODB_INTEGRATION_URI`, non exécutés par défaut ;
- sur une collision récupérée, le use-case a bel et bien lancé ses dés avant de
  perdre la course. Ils sont jetés sans être écrits : ce qui est garanti, c'est
  qu'une clé ne rend jamais deux résultats — pas qu'aucun dé n'a été tiré.

## Décision — relance du tirage après création

Les relances **avant** création sont tranchées : illimitées, avec consommation
unique du tirage retenu. Ce qui arrive **après** ne l'est pas. L'implémentation
refuse aujourd'hui toute relance, faute d'enveloppe transactionnelle sur `PUT` :
c'est un état de fait, pas une décision.

Options à arbitrer :

1. **Relance interdite après création.** Le personnage garde ses valeurs de base
   à vie, hors respécialisation. Le plus simple, et le plus proche d'une table
   réelle ; mais toute correction d'erreur de saisie passe par la suppression du
   personnage.
2. **Relance ouverte sur `PUT`.** Il faut alors doter `FinalizeCharacterUseCase`
   d'une enveloppe transactionnelle avec reçu, comme la création, pour consommer
   le tirage atomiquement. Coût réel, et cela ouvre la porte à relancer jusqu'à
   obtenir de bons scores sur un personnage déjà joué.
3. **Relance réservée à la respécialisation.** Cohérent avec `DEC-003` et avec la
   matrice B03, mais rien de tout cela n'existe : la décision resterait sans
   effet jusqu'à cet incrément-là.

Charly a retenu l'option 1 le 1er septembre 2026. Les demandes de tirage restent
illimitées avant la création ; le tirage consommé ne peut jamais être remplacé.
Avant acceptation, ses six valeurs peuvent être réaffectées. Après acceptation,
classe et caractéristiques ne changent que par la respécialisation de DEC-003,
qui conserve elle aussi méthode et six valeurs sans nouveau tirage.

## Décision — stockage des portraits

La cible fonctionnelle impose un portrait facultatif et un visuel générique, mais 5A,
5B et 5C reportent explicitement stockage, formats et limites. Aucun mécanisme n'est
donc inventé dans cet incrément.

Options à arbitrer :

1. stockage local initial : simple pour une instance, mais sauvegarde, purge et futur
   déploiement multi-instance doivent gérer des fichiers hors MongoDB ;
2. GridFS/MongoDB : transaction et sauvegarde rapprochées, mais base alourdie et
   diffusion HTTP à concevoir ;
3. stockage objet : diffusion et montée en charge adaptées, mais nouveau service,
   secrets, coûts et stratégie transactionnelle à décider.

Charly a retenu le stockage objet le 1er septembre 2026. Le contrat technique du
fournisseur, les formats, la taille maximale, le traitement, la suppression et
la forme des URL doivent être fixés avant d'introduire le téléversement ; ce choix
de stockage n'autorise pas à inventer ces paramètres de sécurité.

## Workflow de validation par le MJ

L'état de validation est distinct de l'état d'aventure et suit exclusivement :

```text
BROUILLON → SOUMISE → ACCEPTÉE
                  ↘ REFUSÉE → SOUMISE
```

- la création complète produit un brouillon ;
- le créateur ou le joueur auquel la fiche est attribuée soumet la révision
  courante ; la version soumise est figée ;
- pendant `SOUMISE`, aucune correction silencieuse n'est possible ;
- tout MJ actif peut accepter ou refuser seul ; le refus exige un motif non vide ;
- seul le créateur autorisé corrige une fiche `REFUSÉE`, puis la resoumet ;
- chaque soumission conserve un snapshot numéroté, et chaque décision conserve
  auteur, date, motif éventuel et révision examinée ;
- l'acceptation verrouille nom, alignement, origine, historique et catégorie de
  taille. Classe et caractéristiques relèvent ensuite de la respécialisation ;
- une fiche non acceptée ne peut pas être sélectionnée comme participante d'un
  combat.

Soumission, correction, resoumission, refus et acceptation emploient la même
enveloppe transactionnelle que la création : filtre de révision, reçu durable,
audit fonctionnel et fait d'outbox dans une transaction Mongo. Une collision de
révision ne fusionne jamais deux versions.

## Hors périmètre volontaire

- progression au-delà du niveau 1, respécialisation, aventure et combat ;
- magasin, achat, fabrication, commerce et variante de taille d'équipement ;
- téléversement de portrait jusqu'à définition du fournisseur et du contrat de sécurité ;
- modification des seeds, migrations, `.env` ou CI ;
- relance du tirage d'un personnage déjà créé, interdite par la décision ci-dessus :
  `PUT` exige `abilityRollId: null`.
