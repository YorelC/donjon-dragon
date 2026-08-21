# Phase 5A — architecture technique cible et modèle de calcul

## Statut et limite du document

- **Statut :** validée par le propriétaire le 21 août 2026.
- **Périmètre :** architecture logique, responsabilités, dépendances, frontières
  d'agrégats, invariants, modèle de calcul, cohérence et projections de sécurité.
- **Hors périmètre :** schémas MongoDB, DTO Zod, endpoints HTTP, commandes ou
  événements Socket.IO détaillés, écrans, migrations et implémentation.
- **Décision associée :** [DEC-015](DECISIONS/015-target-technical-architecture.md).

Les choix ci-dessous constituent la cible technique normative de la Phase 5A. Ils ne
constituent ni un plan d'implémentation ni une autorisation de modifier le code.

## Entrées normatives

La cible répond aux exigences SF-001 à SF-006, aux décisions DEC-001 à DEC-014 et aux
matrices B01 à B09. Les contraintes structurantes sont les suivantes :

- MongoDB reste la source de vérité ; la persistance précède toute diffusion ;
- le serveur est autoritaire pour les permissions, règles et jets de partie ;
- les commandes mutantes sont atomiques, idempotentes et versionnées ;
- une reconnexion ou un redémarrage restaure exactement l'état persistant ;
- un secret est filtré côté serveur et n'est jamais envoyé puis masqué côté client ;
- les versions historiques de builds, profils et contenus restent explicables ;
- une correction compense l'historique sans le réécrire ;
- le pilote emploie une seule instance NestJS, sans Redis et sans besoin de montée en
  charge publique.

## Décisions techniques validées

### TD-5A-001 — conserver un monolithe modulaire

La cible reste un seul déploiement NestJS et une seule base MongoDB. Les modules sont
des frontières de code et de propriété métier, pas des services réseau. Socket.IO
sera un transport supplémentaire vers les mêmes use-cases que HTTP ; il ne portera ni
règle, ni état autoritaire.

Options écartées pour le MVP :

- des microservices, qui ajouteraient cohérence distribuée, exploitation et contrats
  réseau sans répondre à une charge établie ;
- Redis, qui n'est requis ni pour une instance unique, ni pour une source de vérité ;
- un moteur séparé déployé comme service, qui rendrait chaque commande de jeu
  dépendante d'un appel réseau.

Conséquences : les transactions Mongo multi-documents restent possibles, les modules
communiquent par use-cases exportés et les ports de repository demeurent privés. Une
extraction future exige d'abord une mesure de charge ou une frontière devenue
autonome ; elle n'est pas préparée par une abstraction réseau anticipée.

### TD-5A-002 — organiser le métier en neuf contextes

La cible conserve les modules actuels qui ont une responsabilité stable et introduit
deux contextes métier : `rules` et `gameplay`. `game-history` désigne la capacité
d'audit fonctionnel append-only ; son emplacement physique sera décidé avec les
schémas, sans changer son propriétaire logique.

| Module cible | Responsabilité possédée | Ne possède pas |
|---|---|---|
| `user` | identité de compte et profil | authentification, rôles de campagne |
| `auth` | sessions, justificatifs et vérification d'identité | profil et permissions de campagne |
| `friendship` | relation sociale entre comptes | invitations de campagne |
| `campaigns` | campagne, adhésions, propriété, rôles, invitations et réglages | personnages, règles de jeu, état de partie |
| `rules` | vocabulaire exécutable, releases de règles et calcul pur | profils éditoriaux, état utilisateur, I/O |
| `items` | définitions et versions d'objets officiels ou de campagne | exemplaires détenus et inventaires |
| `bestiary` | définitions et versions de profils de créatures | instances en jeu |
| `characters` | dossier, build, progression, état d'aventure et inventaire d'un personnage | combat, repos collectif et butin partagé |
| `gameplay` | activité de campagne, préparation, combat, repos, effets de campagne, butin et réserve | comptes, adhésions, catalogues éditoriaux |

Les dés sécurisés et l'horloge sont des capacités déterministes injectées par ports,
pas des contextes qui décident d'une action. L'audit technique de sécurité reste
distinct de `game-history`.

`gameplay` est volontairement le contexte le plus en aval. Il orchestre les mécaniques
qui peuvent toucher plusieurs personnages, mais ne reçoit jamais les repositories de
ses voisins. Les interactions passent par des use-cases étroits et participent à la
même unité de travail lorsque l'indivisibilité l'exige.

### TD-5A-003 — imposer un graphe de dépendances acyclique

Les flèches signifient « peut appeler les use-cases publics de ». Elles n'autorisent
jamais l'import du port, de l'infrastructure ou de la présentation d'un voisin.

```text
auth ───────────────▶ user
friendship ─────────▶ user
campaigns ──────────▶ user, friendship

items ──────────────▶ rules, campaigns
bestiary ───────────▶ rules
characters ─────────▶ campaigns, rules, items
gameplay ───────────▶ campaigns, rules, items, bestiary, characters

notifications ──────▶ user, campaigns       (consommateur en aval)
HTTP / Socket.IO ───▶ use-cases du module propriétaire
```

`rules` ne dépend d'aucun module métier. `campaigns` ne dépend ni des personnages ni
du jeu. `characters` ne dépend jamais de `gameplay` : les opérations qui combinent un
changement de personnage avec l'état de partie sont orchestrées en aval par
`gameplay`. Une lecture composée est un use-case de projection en aval, jamais une
dépendance inverse ajoutée au module amont.

Un besoin créant une flèche inverse est traité dans cet ordre :

1. déplacer l'orchestration vers le contexte déjà en aval ;
2. publier un fait après commit si la cohérence éventuelle suffit ;
3. redéfinir la frontière si l'invariant est réellement partagé ;
4. ne jamais employer `forwardRef()` pour conserver un cycle.

### TD-5A-004 — séparer les agrégats par invariant et cadence de mutation

Une frontière d'agrégat est une frontière de cohérence métier. Elle ne préjuge ni du
nombre de collections ni de la forme des documents.

| Agrégat racine | Propriétaire | Invariants principaux |
|---|---|---|
| `Campaign` | `campaigns` | une campagne, exactement un propriétaire actif, au moins un MJ actif, adhésions et réglages limités à cette campagne |
| `CampaignInvitation` | `campaigns` | cycle unique et idempotent, cible autorisée, aucun rattachement inter-campagnes |
| `CharacterDossier` | `characters` | identité, attribution, état de revue, version examinée et version active ; champs immuables verrouillés après acceptation |
| `BuildChange` | `characters` | intention et build de base figés, version examinée, historique de choix et auteur ; un niveau en attente ne se cumule pas |
| `CharacterAdventureState` | `characters` | PV, ressources, mort, conditions, concentration et maxima cohérents avec le build actif |
| `CharacterInventory` | `characters` | exemplaires uniques, quantités non négatives, port, conteneurs, monnaies et harmonisation cohérents |
| `RulesetRelease` | `rules` | release immuable, complète, sourcée et adressée par une version stable |
| `ItemDefinition` | `items` | identité stable, versions mécaniques immuables, portée officielle ou campagne, archivage sans disparition des exemplaires |
| `CreatureProfile` | `bestiary` | version immuable, provenance et contenu exécutable complets avant utilisation |
| `CampaignPlayState` | `gameplay` | au plus une activité `EN_COURS`, `EN_PAUSE` ou `BUTIN` ; aucun repos actif pendant ces états ; temps fictionnel et release active explicitement versionnés |
| `EncounterPreparation` | `gameplay` | préparation privée MJ, participants et géométrie cohérents ; lancement unique vers un instantané figé |
| `Combat` | `gameplay` | cycle, ordre, round, acteur, positions, fenêtres et état des instances forment une version cohérente |
| `RestProposal` | `gameplay` | une proposition active, participants figés, choix attribués à leur auteur effectif, finalisation unique |
| `LootContainer` | `gameplay` | génération unique, contenu et connaissance privés persistés, première prise valide gagnante |
| `CampaignReserve` | `gameplay` | provenance immuable, quantités non négatives, visibilité MJ et transfert explicite |
| `PersistentEffect` | `gameplay` | source, cible, version de règle, durée, échéance et fin explicites ; aucun effet orphelin |

`BuildVersion`, les profils de contenu et les résultats de calcul acceptés sont
immuables. Ils peuvent être stockés hors du document de leur racine sans devenir des
agrégats librement modifiables.

La fiche affichée n'est pas un agrégat supplémentaire. C'est une projection composée
du dossier, du build actif, de l'état d'aventure, de l'inventaire et des effets
autorisés. Le combat ne duplique pas une fiche comme seconde vérité : il fige les
versions de référence nécessaires et toute conséquence durable passe aussi par
l'agrégat propriétaire.

### TD-5A-005 — utiliser une enveloppe de commande transactionnelle

Chaque commande mutante est exécutée sous une unité de travail qui persiste ensemble :

1. les nouvelles versions des agrégats touchés ;
2. le reçu d'idempotence et le résultat autoritaire, y compris les jets ;
3. les entrées d'audit fonctionnel acceptées ;
4. les faits d'outbox destinés aux projections et notifications.

La décision est d'utiliser une transaction MongoDB pour cette enveloppe. Les
agrégats portent une révision monotone et chaque mutation vérifie les révisions lues.
Un conflit ne fusionne aucun état : la commande relit ou échoue avec un motif stable.

Une clé de commande rejouée avec la même intention retourne le résultat déjà persisté,
sans nouveau jet ni nouvel effet. La même clé associée à une intention différente est
un conflit. Le détail du format de clé, de sa portée et de sa rétention appartient à
la phase des contrats et schémas.

Les opérations suivantes exigent au minimum une cohérence multi-agrégats :

| Opération | Agrégats coordonnés |
|---|---|
| transfert de propriété puis départ | `Campaign` et son audit transactionnel |
| acceptation initiale ou respécialisation | `CharacterDossier`, `BuildChange`, `CharacterAdventureState`, inventaire initial si nécessaire |
| finalisation d'une progression | build actif, état d'aventure et changement en cours |
| lancement d'un combat | `CampaignPlayState`, préparation, combat et versions participantes figées |
| résolution d'une action | combat, états/inventaires/effets réellement touchés |
| validation d'un repos | proposition, état de partie et tous les états participants |
| prise ou attribution de butin | contenant ou réserve et inventaire destination |
| fermeture du butin | combat, contenants, réserve et état de partie |
| migration mécanique d'objets | définition/version et exemplaires explicitement sélectionnés |

La diffusion lit uniquement l'outbox après commit. Une panne entre commit et émission
retarde un événement mais ne perd ni l'état ni la possibilité de le rediffuser.

### TD-5A-006 — conserver des snapshots et un journal, sans event sourcing

L'état courant est rechargé depuis des snapshots versionnés. L'audit fonctionnel est
append-only et conserve les faits nécessaires à l'explication : campagne, agrégat,
commande, acteur, rôle effectif, action, versions avant/après, règles sources, motifs,
audience et causalité.

Le journal n'est pas utilisé pour reconstruire tous les agrégats. L'event sourcing est
écarté : il imposerait versionnement des événements, migrations de replay et gestion
des secrets dans tout l'historique sans nécessité produit démontrée.

**Précision validée en Phase 5B :** l'historique opérationnel détaillé d'un combat est
append-only seulement tant que le combat ou son butin reste ouvert. Après transfert des
reliquats et passage à `TERMINÉ`, ses interactions, traces, états de reprise et entrées
d'audit propres aux étapes sont supprimés au profit d'un résumé terminal. Les
conséquences durables restent dans les agrégats propriétaires avec leur propre audit.
Cette exception de cycle de vie n'autorise jamais la réécriture d'un combat ouvert.

La purge définitive d'un compte est la seconde exception explicite : les audits qui ne
concernent que le compte sont supprimés ; un fait partagé nécessaire à une campagne
conservée perd irréversiblement son auteur au profit de `ERASED_ACTOR`. Aucun mapping
ne permet de réidentifier l'utilisateur.

Les corrections créent une nouvelle transition liée à celle qu'elles compensent. Elles
ne modifient ni ne suppriment l'entrée d'origine. Les refus d'autorisation et traces de
sécurité restent dans un journal technique séparé, avec une politique de rétention et
des accès distincts.

### TD-5A-007 — calculer avec un noyau fermé de primitives typées

Le moteur de règles n'est ni une suite de `if` par sort, ni un langage de script. Il
reçoit des profils versionnés composés à partir d'un vocabulaire fermé :

- prédicats et prérequis ;
- sélecteurs de source, cible, zone et ressource ;
- modificateurs, remplacements, maxima et minima ;
- coûts et consommations ;
- jets, dégâts, soins, mouvements, conditions et ressources ;
- création, suspension, échéance et fin d'effets ;
- révélation selon audience ;
- demande d'arbitrage MJ.

Une règle spécifique ne gagne pas grâce à un nombre de priorité arbitraire. Elle cite
explicitement la règle ou l'étape qu'elle remplace, ignore ou restreint. Un conflit
non résolu entre deux contributions est une donnée invalide qui bloque uniquement
l'usage concerné.

Les rares exceptions déterministes impossibles à exprimer avec les primitives
emploient un handler TypeScript pur, nommé et enregistré par clé stable. Ces handlers
sont réservés au contenu officiel livré avec l'application. Un contenu personnalisé
utilise seulement les primitives autorisées et ne peut référencer aucun code
arbitraire.

### TD-5A-008 — exécuter chaque règle par un pipeline déterministe

Le même pipeline sert création, fiche, progression, combat, sorts, objets et repos :

```text
versions figées
  → contexte complet autorisé
  → contributions applicables
  → remplacements et restrictions explicites
  → plan de transition pur
  → jets serveur persistables
  → application ordonnée des effets
  → contrôle des invariants
  → snapshots + trace + faits à projeter
  → commit atomique
  → projections autorisées et diffusion
```

Le calcul pur ne lit ni MongoDB, ni l'horloge, ni le réseau et ne génère pas seul de
hasard. L'application lui fournit un instant unique, les résultats de dés et toutes
les versions d'entrée. Rejouer les mêmes entrées produit le même plan et la même trace.

Chaque dérivé ou résolution conserve une trace structurée : valeur d'entrée, opération,
contributions appliquées ou écartées, source B01–B09 ou profil, version et résultat.
Cette trace alimente à la fois la raison courte de l'interface, le détail consultable,
les tests et l'audit sans exposer les contributions secrètes.

### TD-5A-009 — figer les versions aux frontières de jeu

Une `RulesetRelease` et chaque version de profil sont immuables. La campagne désigne
une release active pour les nouvelles validations. Une fiche acceptée conserve la
release et les profils qui ont produit son build. Le lancement d'un combat fige les
versions des builds, créatures, objets, règles et paramètres effectivement utilisés.

Une errata ou correction crée une nouvelle version. Elle ne réécrit ni ancien combat,
ni audit, ni exemplaire existant. Son adoption par un état déjà actif passe par une
revalidation ou migration explicite et auditée ; aucune actualisation silencieuse
n'est permise.

### TD-5A-010 — produire des projections de sécurité nommées

Un agrégat ou un événement interne n'est jamais sérialisé directement. Chaque module
propriétaire définit des projecteurs explicites à partir de l'état complet :

- projection MJ complète ;
- projection du joueur assigné ou de l'auteur ;
- projection participant/allié ;
- projection adversaire publique ;
- projection privée d'un investigateur ou d'un lanceur ;
- absence de projection pour un acteur non autorisé.

La sélection d'une projection vérifie à l'instant de la lecture ou de l'émission :

1. l'identité authentifiée issue du serveur ;
2. l'adhésion active à la campagne ;
3. le rôle effectif actuel ;
4. le contrôle ou la participation utile ;
5. l'appartenance de chaque ressource chargée à cette campagne ;
6. l'audience métier figée par la règle ou l'action.

Les rooms Socket.IO facilitent l'acheminement mais n'accordent aucun droit. Une
promotion, rétrogradation, désassignation ou exclusion prend effet sur la commande,
la requête et la prochaine émission, sans attendre l'expiration du JWT ou une
reconnexion.

Cette cible n'introduit aucun rôle global ni permission durable dans le JWT. `MJ`,
joueur et propriétaire restent des propriétés de l'adhésion à la campagne chargée au
moment de l'opération.

Les faits d'outbox internes portent une politique d'audience, pas un payload commun
contenant tous les secrets. Le module propriétaire construit un payload distinct par
audience. Un événement public de déplacement, de jet, de butin ou d'effet ne contient
jamais une clé cachée, un DD secret, une raison d'invalidité privée ou un profil MJ.

## Projections minimales par domaine

| Domaine | Joueur concerné | Autres participants | MJ |
|---|---|---|---|
| dossier et revue | candidat, motifs et décisions autorisés | rien | dossier complet |
| fiche active | fiche complète de son personnage | résumé allié prévu | toutes les fiches |
| adversaire | état qualitatif et éléments révélés | identique | valeurs et profil complets |
| entité cachée | aucune existence transmise | aucune existence transmise | état complet |
| jet privé joueur | faces et détail autorisé | aucun fait | détail complet |
| jet secret MJ | rien | rien | détail complet |
| butin visible | contenu découvert encore disponible | contenu découvert autorisé | contenu complet |
| investigation | tentative et découvertes propres | aucune existence transmise | détail complet |
| réserve | rien | rien | contenu et provenance complets |
| objet magique | propriétés découvertes et compteurs autorisés | selon possession/règle | propriétés, malédiction et texte privé |
| audit fonctionnel | entrées dont il est destinataire | aucune déduction supplémentaire | audit fonctionnel de campagne autorisé |

## Invariants transverses

Ces invariants s'appliquent à toute commande, même lorsqu'une matrice fonctionnelle ne
les répète pas :

1. **Portée campagne :** aucun identifiant ne permet de lire ou muter une ressource
   appartenant à une autre campagne.
2. **Autorité serveur :** acteur, rôle, total de jet, règle applicable et conséquence
   ne proviennent jamais d'une affirmation du client.
3. **Révision attendue :** une commande obsolète n'applique aucune mutation partielle.
4. **Idempotence :** une intention acceptée produit au plus une résolution autoritaire.
5. **Persistance avant diffusion :** aucune notification n'annonce un état non commis.
6. **Hasard unique :** un jet ou une génération est produit une fois, puis relu.
7. **Provenance :** toute valeur dérivée, exemplaire, correction et contenu généré
   cite ses sources et versions.
8. **Historique immuable :** une correction ajoute une compensation.
9. **Secret par construction :** une projection non autorisée ne contient pas le
   champ secret, même sous forme chiffrée, masquée ou nulle informative.
10. **Aucun code de contenu :** seul le code versionné de l'application exécute des
    handlers ; les données de campagne restent déclaratives.
11. **Défaillance locale :** un profil incomplet bloque seulement l'action ou le
    contenu concerné et n'invente aucune valeur.
12. **Temps explicite :** un instant système est fourni une fois par commande ; le
    temps fictionnel avance seulement par transition métier.

## Règles de conception pour les phases suivantes

- Une commande appartient au module qui possède son intention métier ; une
  orchestration multi-module appartient au contexte le plus en aval.
- Un module voisin appelle un use-case public, jamais un repository ou un schéma.
- Un projecteur de sécurité reste dans le module qui connaît les secrets concernés.
- Une lecture optimisée peut employer un read model reconstructible ; celui-ci ne
  devient jamais la source d'autorité d'une mutation.
- Une primitive de règle nouvelle doit être générique, typée et justifiée par au moins
  une famille de règles ; un cas isolé préfère un handler officiel nommé.
- La description détaillée des collections, index, payloads et événements doit citer
  les agrégats et invariants de ce document, sans les redéfinir.

## Points explicitement reportés après 5A

Les sujets suivants nécessitent les décisions de données, de contrats ou
d'exploitation ultérieures :

- découpage exact des collections et documents, index et stratégie d'initialisation ou
  de compatibilité ;
- forme des identifiants de commande et durée de conservation des reçus ;
- schémas des profils de règles, DTO et erreurs publiques ;
- endpoints HTTP, commandes/événements Socket.IO, accusés et curseurs de reconnexion ;
- stockage, formats et limites des portraits et images d'objets ;
- rétention chiffrée de l'audit fonctionnel et des journaux de sécurité ;
- observabilité, sauvegarde, restauration et déploiement détaillés ;
- choix d'une dépendance Socket.IO et câblage précis des transactions NestJS/Mongoose.

Une ambiguïté fonctionnelle a été détectée sans être résolue techniquement : les
spécifications distinguent progression et respécialisation, mais ne disent pas si un
niveau en attente peut coexister avec une respécialisation déverrouillée. La cible 5A
ne crée donc pas d'exclusion implicite ; toute activation reste liée à la version de
build qui lui servait de base et un conflit de version ne produit aucune mutation.
Cette cardinalité doit être décidée avant les schémas et contrats correspondants.

**Résolution postérieure à la validation 5A :** le propriétaire a décidé le 21 août
2026 qu'il n'existe aucune coexistence. Un seul `BuildChange` peut être ouvert par
personnage. La règle fonctionnelle est intégrée à SF-002, DEC-003, B02 et B03 ; sa
représentation est définie par la Phase 5B et DEC-016.

## Validation enregistrée

Le propriétaire a explicitement validé le 21 août 2026 :

1. le monolithe modulaire et le graphe de dépendances ;
2. les frontières d'agrégats ;
3. l'enveloppe transactionnelle MongoDB et la concurrence optimiste ;
4. le modèle de règles par primitives typées et handlers officiels ;
5. les snapshots avec audit/outbox, sans event sourcing ;
6. les projections de sécurité nommées et construites côté serveur.
