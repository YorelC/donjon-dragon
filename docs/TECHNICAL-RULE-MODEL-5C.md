# Phase 5C — modèle exécutable, typé et versionné des règles D&D 2024

## Statut et limite du document

- **Statut :** principes structurants validés par le propriétaire le 23 août 2026 ;
  conception détaillée provisoire à confirmer incrémentalement.
- **Prérequis vérifiés :** DEC-015 et DEC-016 sont validées depuis le 21 août 2026.
- **Périmètre :** modèle logique des releases et profils, vocabulaire déclaratif,
  exceptions officielles, compilation, résolution déterministe, traces, erreurs,
  compatibilité et stratégie de validation du corpus D&D 2024.
- **Hors périmètre :** schémas TypeScript ou Zod, DTO partagés, collections nouvelles,
  endpoints HTTP, commandes ou événements Socket.IO, dépendances, catalogue, seed,
  migration, test et toute implémentation.
- **Décision associée :**
  [DEC-017](DECISIONS/017-executable-versioned-rule-model.md).

Ce document détaille le contexte `rules` décidé en Phase 5A sans déplacer les
frontières de persistance validées en Phase 5B. Les formes décrites sont des concepts
du domaine. Elles ne constituent ni des contrats API, ni des interfaces TypeScript
prêtes à intégrer.

## Portée de la validation du 23 août 2026

Le propriétaire valide comme normatifs :

1. le moteur de règles est pur et ne produit aucun effet de bord ;
2. les mêmes entrées versionnées produisent le même résultat et la même explication ;
3. releases, profils et règles sont versionnés, et aucune version courante ne remplace
   silencieusement une version figée ;
4. aucun script utilisateur, hasard interne, lecture MongoDB ou accès caché à l'horloge
   n'est permis dans le moteur.

Il valide également DR-5C-01 avec l'option 1 : les objets personnalisés emploient le
sous-ensemble prudent défini plus bas.

Restent **provisoires** jusqu'à leur preuve par une tranche d'implémentation :

- les futures formes TypeScript et Zod ;
- le découpage et l'ordre exacts du pipeline de compilation et de résolution ;
- le catalogue détaillé des primitives et chemins de faits ;
- la forme persistée et projetée des traces ;
- la représentation exacte des continuations et actions suspendues ;
- les catégories internes, optimisations, caches et liaisons de handlers.

Une précision provisoire ne devient pas normative parce qu'elle figure dans un tableau
ou un exemple de ce document. Elle sert de cible de travail, doit respecter les
principes validés et peut être amendée par la procédure incrémentale définie en fin de
document.

## Entrées normatives

La cible répond à SF-001 à SF-006, DEC-001 à DEC-016 et aux matrices B01 à B09. Les
contraintes non négociables sont :

- un vocabulaire fermé de primitives typées représente les règles communes ;
- un handler TypeScript pur et versionné est réservé à une exception officielle qui
  ne peut pas être représentée correctement par ce vocabulaire ;
- aucun contenu de campagne ne référence ou n'exécute de code ;
- releases, profils et versions ayant produit un résultat sont immuables ;
- MongoDB conserve les manifestes, profils, traces et références selon 5B, mais le
  calcul pur ne lit jamais MongoDB ;
- une commande fournit au calcul toutes ses versions, son instant, ses faits de jeu et
  ses résultats de dés ;
- le serveur reste autoritaire et persiste avant diffusion ;
- une information absente ou contradictoire bloque seulement l'usage concerné ;
- une projection non autorisée ne reçoit jamais un secret, même sous forme de champ
  masqué ou de trace partiellement révélatrice.

## Vocabulaire du document

| Terme | Sens |
|---|---|
| `RulesetRelease` | Manifeste immuable et complet des versions admises ensemble pour une règle de jeu donnée. |
| Profil | Définition mécanique versionnée d'un sort, trait, action, objet, créature, progression ou règle commune. |
| Règle | Contribution atomique nommée d'un profil : applicabilité, coût, calcul, transition, remplacement ou restriction. |
| Primitive | Opération déclarative appartenant au vocabulaire fermé et évaluée par le moteur. |
| Handler officiel | Fonction pure livrée avec l'application, liée par une clé stable et admise par une release. |
| Fait | Valeur typée fournie dans le contexte d'évaluation ; le moteur n'effectue aucune lecture cachée. |
| Contribution | Valeur, contrainte, coût, choix, jet ou effet proposé par une règle applicable. |
| Plan de résolution | Résultat pur ordonné avant mutation : coûts, jets requis, transitions, effets, fenêtres et arbitrages. |
| Continuation | État pur et versionné permettant de reprendre une action suspendue sans la recalculer depuis un état différent. |
| Trace | Arbre causal structuré expliquant entrées, règles retenues ou écartées, opérations, résultats et audiences. |

## Invariants du moteur

1. **Entrées closes.** Une évaluation ne connaît que les faits, profils, versions,
   choix, instant et résultats de dés fournis.
2. **Sortie reproductible.** Les mêmes entrées canoniques produisent le même résultat,
   le même ordre d'effets et la même trace.
3. **Aucun effet de bord.** Le moteur ne persiste, ne diffuse, ne journalise, ne lit
   l'heure et ne génère de hasard.
4. **Version exacte.** Aucune version absente ne retombe sur « la plus récente ».
5. **Échec local.** Une règle invalide ne rend pas les autres releases inutilisables,
   mais le profil ou l'action qui en dépend reste bloqué.
6. **Coût unique.** Une même résolution ne consomme jamais deux fois une ressource,
   y compris après reprise, réaction ou retransmission.
7. **Relation explicite.** Aucun ordre de priorité numérique ni ordre de chargement ne
   décide quelle règle l'emporte.
8. **Secret par construction.** Chaque fait, contribution et étape de trace porte une
   politique d'audience avant projection.
9. **Arbitrage borné.** Une clause narrative ouvre une décision MJ ; elle n'autorise
   ni état incohérent, ni code, ni contournement des coûts déjà validés.
10. **Persistance extérieure.** Le plan pur est appliqué et contrôlé par les agrégats
    propriétaires dans l'enveloppe transactionnelle de 5A/5B.

## TD-5C-001 — structurer une release comme un manifeste fermé

### Problème

Une campagne et un combat doivent retrouver exactement les règles qui ont produit une
fiche ou une conséquence, tout en gardant les milliers de profils hors d'un document
MongoDB unique.

### Options

1. Référencer les profils « courants » par leur seule identité.
2. Copier tous les profils dans chaque campagne ou combat.
3. Figer un manifeste immuable qui épingle chaque version et son hash.

### Conception provisoire

L'option 3 est retenue. Une `RulesetRelease` possède logiquement :

| Groupe | Informations obligatoires |
|---|---|
| Identité | famille de jeu `DND_2024`, clé de release, version métier opaque et identité immuable ; |
| Contrats internes | version du modèle de profil, version du vocabulaire de primitives et version du contrat des handlers ; |
| Provenance | ouvrages, éditions, pages ou sections, datasets autorisés, errata appliqués, dates de qualification et responsables ; |
| Manifeste | références exactes des profils de règles, objets et créatures admis, chacune avec type, clé stable, version et hash ; |
| Handlers | liaisons exactes entre clé de handler, version d'implémentation et profils officiels autorisés à l'appeler ; |
| Dépendances | autres releases ou référentiels exacts requis, sans plage flottante ; |
| Preuves | résultat de compilation, couverture B01–B09, inventaires attendus, cas d'or obligatoires et hash canonique de l'ensemble ; |
| Cycle | date de publication et release remplacée éventuelle ; une release publiée n'a plus d'état éditable. |

La racine `ruleset_releases` et ses entrées `ruleset_release_entries` restent celles de
5B. Le manifeste logique est fermé lorsque toutes ses entrées sont présentes, valides
et hachées ; sa répartition physique ne change pas cette atomicité de publication.

### Conséquences

- Une campagne peut désigner une release active pour les nouvelles validations.
- Un build et un combat conservent leurs références exactes sans recopier le corpus.
- Le contenu d'une release est adressable et vérifiable indépendamment de son ordre de
  chargement.

### Risques

- Un manifeste volumineux demande une compilation globale et une publication
  atomique.
- Une seule référence manquante empêche de déclarer la release complète.

### Conditions de réexamen

Réexaminer seulement si un second système de jeu exige une composition de releases
partielles ou si la mesure prouve que le manifeste fermé empêche un déploiement
raisonnable. Aucun besoin de ce type n'existe pour le pilote D&D 2024.

## Identité, version, provenance et dépendances d'une règle

Un profil possède une identité stable indépendante de son texte traduit. Chaque
version mécanique est immuable et porte :

- un `profileType` fermé, par exemple règle commune, trait, progression, sort, objet,
  action de créature ou profil paramétré ;
- une clé stable dans une portée non ambiguë ;
- une version métier opaque et un hash de contenu canonique ;
- une provenance structurée : ouvrage ou décision, édition, page/section, errata,
  dataset et empreinte lorsqu'ils existent ;
- les paramètres attendus et leurs domaines fermés ;
- ses règles atomiques, choix, contributions et politiques d'audience ;
- ses dépendances exactes vers d'autres profils, règles ou catalogues ;
- ses éventuelles liaisons de handlers officiels ;
- les identifiants B01–B09 et cas de preuve qu'il prétend couvrir.

Une règle atomique possède sa propre clé stable dans le profil. Une source peut ainsi
remplacer une étape précise sans remplacer tout le profil. Les dépendances distinguent
au minimum :

- `REQUIERT` : le profil ne compile pas sans la version citée ;
- `RÉFÉRENCE` : la cible est sélectionnée à l'exécution mais doit appartenir au
  manifeste ;
- `ÉTEND` : le profil ajoute des contributions sans réécrire la source ;
- `REMPLACE`, `RESTREINT` ou `EXEMPTE` : relation de spécificité décrite plus bas ;
- `LIE_HANDLER` : exception officielle admise explicitement par la release.

Les dépendances de compilation forment un graphe acyclique. Une relation d'exécution
potentiellement récurrente — par exemple un effet qui crée une action — ne devient pas
une dépendance de compilation et reste contrôlée par la causalité et les ressources de
jeu.

## TD-5C-002 — employer une algèbre fermée de faits, prédicats et contributions

### Problème

Les matrices demandent des formules, choix, conditions et conséquences très variés.
Une chaîne libre est inexécutable ; un langage général ou une expression arbitraire
serait du code déguisé.

### Options

1. Interpréter les descriptions éditoriales.
2. Autoriser des expressions ou scripts généraux.
3. Définir des familles de primitives fermées, chacune avec entrées, sorties et
   invariants connus.

### Conception provisoire

L'option 3 est retenue. Une primitive inconnue ou un champ non admis est une erreur de
compilation, jamais une extension implicite du langage.

### Faits, chemins et expressions

Le moteur lit uniquement un dictionnaire fermé de faits qualifiés : acteur, source,
cibles, build, état d'aventure, inventaire, activité, scène, effets actifs, choix de
commande, instant système, temps fictionnel et références de versions. Un chemin de
fait est déclaré par le vocabulaire ; un profil ne construit pas un chemin de propriété
libre.

Les expressions scalaires couvrent littéraux typés, lecture d'un fait admis, addition,
soustraction, multiplication bornée, division avec règle d'arrondi explicite, somme,
minimum, maximum, écrêtage et sélection dans une table finie. Les distances, durées,
quantités, scores, niveaux, dés et monnaies restent des types distincts. Une expression
ne peut ni appeler une fonction, ni boucler, ni allouer une nouvelle clé de ressource.

### Prédicats et prérequis

Les prédicats sont composés par `TOUS`, `AU_MOINS_UN` et `NON` sur des observations
typées : égalité, appartenance à un ensemble fermé, comparaison ordonnée, présence,
portée de campagne, relation de contrôle, état de cycle, possession, disponibilité de
ressource, état de cible, distance, visibilité, couverture, ligne d'effet et présence
d'un effet source.

Un prérequis ajoute à son prédicat :

- le moment où il doit être vérifié ;
- la raison courte stable si l'échec peut être montré ;
- la politique d'audience de cette raison ;
- son caractère bloquant, filtrant une option ou requalifiant une cible ;
- la règle source qui l'impose.

La validation initiale, la confirmation, la reprise après interruption et l'application
peuvent requalifier le même prérequis. Une cible devenue invalide n'est jamais maintenue
parce qu'elle l'était dans une prévisualisation.

### Sélecteurs

Un sélecteur déclare : source de départ, type d'entité, portée de campagne, cardinalité
minimale et maximale issue d'une règle, ordre canonique, filtres, visibilité exigée,
ligne d'effet, portée, alliance/hostilité/consentement et politique si une cible cesse
d'être valide. Les sélecteurs couvrent acteur, source, cible unique ou multiple,
inventaire, ressource, effet, point, chemin et zone.

Un sélecteur ne retourne jamais implicitement une entité cachée. Le contexte complet
autorisé peut contenir un secret pour le calcul serveur ; la prévisualisation et la
trace projetée restent filtrées séparément.

### Conséquences, risques et réexamen

Le vocabulaire est testable et interdit l'exécution cachée, mais son évolution exige
une nouvelle version du jeu de primitives. Une primitive nouvelle est admise seulement
si elle exprime une famille réutilisable et possède sémantique, invariants, traces et
tests de propriétés. Un cas officiel isolé relève d'abord d'un handler. Réexaminer ce
choix uniquement si l'inventaire complet démontre une prolifération de handlers causée
par une même lacune générique.

## Modèle des coûts, ressources et consommations

Une action produit un ensemble de coûts qualifiés. Chaque coût nomme sa source, son
porteur, son unité, son montant, son point d'engagement et son comportement après un
échec normal. Les unités admises couvrent :

- action, action Bonus, Réaction, attaque d'une action et interaction d'objet ;
- déplacement dans un mode de vitesse déterminé ;
- emplacement de sort ou Magie de pacte, dé de vie et ressource de classe ;
- usage par repos, par jour, recharge ou usage légendaire ;
- charge d'objet, quantité, munition, composant matériel et monnaie ;
- concentration existante à terminer ou effet incompatible à remplacer.

Le cycle est toujours : vérifier la disponibilité, établir le coût, atteindre le point
d'engagement défini par la règle, puis produire la consommation dans le plan de
transition. Avant l'engagement, un refus ne consomme rien. Après engagement, un échec
normal conserve le coût lorsque la règle le prévoit. Une action suspendue conserve les
coûts déjà engagés et ne les émet pas une seconde fois à la reprise.

Les récupérations sont des contributions séparées, déclenchées par fin de repos, début
ou fin de tour, événement fictionnel comme la prochaine aube, recharge ou règle
explicite. Une hausse de maximum conserve la quantité dépensée selon B04 ; elle ne
devient jamais une récupération implicite.

## Primitives de résolution mécanique

### Jets

Une demande de jet porte une identité stable dans la résolution, une expression de dés,
les dés individuels attendus, le mode normal/Avantage/Désavantage, les modificateurs,
la règle de sélection, les relances ou remplacements autorisés, l'audience fixée avant
tirage et la règle source. Elle distingue test de caractéristique, attaque, sauvegarde,
dégâts, soin, table aléatoire et jet sans test d20.

Avantage et Désavantage agrègent leurs sources avant le jet : plusieurs sources du
même côté ne s'empilent pas et la présence des deux côtés revient au mode normal. Une
relance cible un dé identifié et lie le nouveau résultat à l'ancien sans l'effacer.

### Dégâts et soins

Un paquet de dégâts conserve dés ou moyenne, type, source, cible, partage éventuel d'un
même jet entre plusieurs cibles et clauses de réussite/échec. La résolution ordonnée
est : ajustements du paquet, Immunité, Résistance, Vulnérabilité, PV temporaires, PV
actuels, puis déclencheurs vitaux et de concentration. Chaque Immunité, Résistance ou
Vulnérabilité pertinente ne s'applique qu'une fois sauf remplacement explicite.

Un soin et un octroi de PV temporaires sont deux primitives différentes. Le soin est
borné au maximum ; les PV temporaires proposent un choix entre ancienne et nouvelle
valeur, sans addition. Réduction ou restauration d'un maximum, résurrection et passage
à 0 PV utilisent des transitions dédiées afin de ne pas contourner B04.

### Mouvement

Les primitives distinguent dépense de mouvement, déplacement volontaire, mouvement
forcé, poussée, traction, chute, téléportation, mise À terre, relevé, changement de mode
de vitesse et déplacement d'une zone. Elles produisent un chemin, un coût, une position
finale et les déclencheurs traversés. Une téléportation ne produit aucun segment
intermédiaire ; un mouvement forcé ne consomme pas la vitesse de la cible.

### Conditions, ressources et effets

Une instance de condition cite condition fermée B04, source, cible, début, durée,
immunité, fins et éventuels tests répétés. Plusieurs sources coexistent sans multiplier
un effet non cumulatif. Une primitive de ressource crée, consomme, ajuste ou récupère un
pool nommé par une règle officielle ou un type admis.

Un effet est une instance versionnée avec source, bénéficiaire ou cible qualifiée,
contributions actives, déclencheurs, durée, concentration éventuelle, audience,
échéance et causes de suspension ou de fin. Un effet durable devient le
`PersistentEffect` de 5A/5B après application par son agrégat propriétaire.

## TD-5C-003 — séparer ciblage, géométrie et perception

### Problème

Portée, chemin, visibilité, ligne de vue, ligne d'effet et couverture ont des
conséquences distinctes. Les confondre rendrait incorrects sorts, téléportations,
attaques et secrets.

### Options

1. Employer un unique booléen « cible atteignable ».
2. Laisser chaque profil recalculer sa géométrie.
3. Fournir un instantané géométrique canonique et appliquer des primitives distinctes.

### Conception provisoire

L'option 3 est retenue. Le contexte d'évaluation contient une scène pure et figée :
dimensions métriques, positions et altitudes, empreintes circulaires, obstacles,
terrains, illuminations, zones, sens et connaissances pertinentes. Les opérations
géométriques sont pures et partagées par B05 à B08.

Les primitives couvrent :

- distance euclidienne entre périmètres, adjacence et occupation ;
- validation d'un point, d'une destination et d'un chemin continu ;
- portée et allonge ;
- ligne de vue et perception par sens ;
- ligne d'effet et couverture aucune, partielle, trois-quarts ou totale ;
- origine et inclusion d'un cône, cube, cylindre, émanation, ligne ou sphère ;
- sélection par entrée, sortie, début ou fin de tour dans une zone ;
- exceptions nommées qui ignorent exactement un axe sans ignorer les autres.

Le résultat géométrique conserve les éléments qui l'expliquent, mais ceux qui sont
secrets portent leur audience. Une mesure libre ne consulte que la géométrie déjà
visible de son utilisateur et ne devient jamais une primitive de découverte.

### Conséquences, risques et réexamen

Une seule sémantique sert combat, sorts, objets et créatures. Le risque principal est
la divergence entre prévisualisation et résolution : le serveur recalcule donc depuis
le snapshot confirmé. Réexaminer la représentation seulement si la future 2,5D/3D
entre dans le périmètre ; l'altitude numérique du MVP reste couverte sans caméra 3D.

## TD-5C-004 — résoudre « spécifique prévaut » par relations nommées

### Problème

D&D contient des exceptions au général. Un nombre de priorité ou l'ordre de chargement
serait arbitraire, fragile et impossible à justifier dans une trace.

### Options

1. Affecter une priorité numérique à chaque règle.
2. Déduire automatiquement la spécificité du nombre de prédicats.
3. Exiger qu'une règle cite la règle ou l'étape qu'elle remplace, restreint, exempte ou
   complète.

### Conception provisoire

L'option 3 est retenue. Les relations ont une sémantique fermée :

| Relation | Effet |
|---|---|
| `AJOUTE` | Compose une contribution compatible sans supprimer la cible. |
| `REMPLACE` | Retire exactement la contribution ou étape citée et fournit sa substitution. |
| `RESTREINT` | Réduit le domaine, les cibles ou options de la règle citée. |
| `EXEMPTE_DE` | Neutralise pour un cas nommé une restriction générale citée. |
| `IGNORE` | Ignore un axe nommé, par exemple couverture, seulement pour l'opération citée. |
| `BORNE` | Ajoute minimum, maximum ou plafond à une valeur nommée. |

Le compilateur vérifie que la cible existe dans le manifeste, que la relation est
compatible avec son type, que l'exception n'élargit pas silencieusement une autre
étape et que le graphe n'a pas de cycle. La complexité d'un prédicat ne confère jamais
de priorité.

Deux contributions exclusives sans relation explicite forment un conflit. Deux
remplacements concurrents de la même étape sont invalides sauf si l'un cible
explicitement l'autre. Des bornes compatibles se composent ; des bornes impossibles
produisent un conflit de données. Les contributions commutatives utilisent un ordre
canonique uniquement pour la reproductibilité de la trace, jamais pour modifier leur
sémantique.

### Conséquences

Chaque exception est explicable par sa source et son lien au général. Ajouter une
errata ne change pas silencieusement l'ordre des autres profils.

### Risques et conditions de réexamen

La qualification initiale du corpus demande davantage de travail éditorial. Une cible
trop large pourrait remplacer plus que prévu ; les tests de mutation du compilateur
doivent le détecter. Réexaminer seulement si une famille officielle démontre une
relation récurrente absente du vocabulaire ; elle devient alors une relation typée, pas
un nombre de priorité.

## Conflits et données incomplètes

Le compilateur distingue :

- référence, version, profil ou provenance absente ;
- paramètre obligatoire absent ou hors domaine ;
- primitive, chemin de fait, condition, type de dégâts ou ressource inconnus ;
- dépendance cyclique ;
- remplacement sans cible ou relation de type incompatible ;
- contributions exclusives non arbitrées ;
- cardinalité de sélecteur impossible ;
- expression non totale, division invalide ou unité incompatible ;
- handler inconnu, non admis ou de mauvaise version ;
- trace ou politique d'audience manquante ;
- cas de preuve obligatoire absent.

Une release ne peut être publiée si l'un de ses profils obligatoires échoue. Le rapport
de qualification d'une release candidate peut inventorier une entrée indisponible,
mais cette candidate reste non publiable jusqu'à correction. Une campagne, une fiche
ou un combat ne peut jamais figer un profil non compilé.

À l'exécution, une version historique absente, un paramètre de profil manquant ou une
contradiction découverte tardivement produit `DONNÉE_INCOMPLÈTE`. Le moteur n'emploie
ni zéro, ni texte, ni version courante comme valeur de secours.

## TD-5C-005 — réserver les handlers au corpus officiel

### Problème

Certaines exceptions officielles peuvent être déterministes sans se ramener proprement
aux primitives communes. Les forcer dans un arbre déclaratif illisible serait aussi
risqué qu'une suite de conditions par sort.

### Options

1. Étendre le vocabulaire pour chaque exception.
2. Autoriser des scripts ou callbacks fournis par les profils.
3. Admettre un petit registre de fonctions pures livrées avec l'application.

### Conception provisoire

L'option 3 est retenue, conformément à DEC-015. Un handler officiel respecte le
contrat logique suivant :

- clé stable, version d'implémentation et version du contrat moteur ;
- liste fermée des profils et règles officiels autorisés à le référencer ;
- entrée composée uniquement de faits immuables, paramètres validés et résultats de
  dés déjà fournis ;
- sortie limitée aux mêmes contributions, demandes de jets, choix, effets et étapes de
  trace que les primitives ;
- aucune lecture de base, réseau, fichier, variable d'environnement, horloge globale ou
  générateur aléatoire ;
- aucune mutation de l'entrée, cache partagé, singleton mutable ou dépendance à
  l'ordre d'appel ;
- résultat total et déterministe, ou erreur interne typée ;
- politique d'audience explicite pour toute donnée produite.

Le registre est fermé au démarrage de l'application. La release lie une clé de handler
à une version exacte ; un profil ne choisit jamais dynamiquement un nom de fonction.
L'admission d'un handler exige :

1. la preuve documentée que les primitives produiraient une représentation trompeuse
   ou disproportionnée ;
2. une source officielle et les identifiants B01–B09 concernés ;
3. des cas d'or, tests de propriétés applicables et test de déterminisme ;
4. une trace au même niveau de détail qu'une primitive ;
5. une revue qui confirme l'absence d'I/O, de temps et de hasard cachés.

Un changement de comportement crée une nouvelle version de handler et une nouvelle
release. Une correction interne prouvée sans changement sémantique peut conserver la
version métier du profil, mais le binaire compatible reste vérifié par la liaison de
release et ses cas d'or ; aucune substitution silencieuse n'est permise pour un combat
reprenable.

### Conséquences

Les exceptions restent testables et auditées sans créer un langage général. Le contenu
personnalisé ne peut jamais référencer le registre.

### Risques et conditions de réexamen

Un registre qui grossit vite révélerait une algèbre insuffisante. Dès que plusieurs
handlers partagent une même structure mécanique, une revue obligatoire doit décider si
une primitive générique est justifiée. Un handler qui exige I/O ou état caché est
refusé et la règle reste non représentable jusqu'à nouvelle décision.

## DÉCISION VALIDÉE DR-5C-01 — sous-ensemble des objets personnalisés

### Problème arbitré

SF-006 et B07 autorisent des effets structurés automatisables ou manuels, sans code,
mais ne déterminent pas quelles primitives un MJ peut combiner. Ce choix modifie la
puissance des objets de campagne, la complexité de l'interface et la surface de règles
à valider.

### Options considérées

1. **Sous-ensemble prudent.** Autoriser les modificateurs de valeurs
   dérivées nommées, Résistances/Immunités typées, ressources et charges, activation
   par action connue, cible soi-même ou créature visible unique, attaque ou sauvegarde,
   dégâts, soins, PV temporaires, conditions officielles, déplacement simple, durée
   fixe/concentration et clause manuelle après coût. Interdire nouveaux types de faits,
   nouvelles ressources globales, remplacement d'une règle officielle, Réaction ou
   interruption personnalisée, invocation, transformation, génération aléatoire de
   profil, secret qui change les permissions et tout handler.
2. **Tout le vocabulaire déclaratif.** Donner aux objets de campagne toutes les
   primitives des profils officiels sauf les handlers. Cette option permet des objets
   très riches, mais exige une interface avancée, davantage de validation croisée et
   permet de perturber fortement l'économie d'actions ou les workflows.
3. **Manuel uniquement pour le pilote.** Stocker les descriptions et coûts simples,
   puis faire appliquer toute conséquence par correction MJ. Cette option est sûre et
   rapide, mais ne satisfait que faiblement la promesse d'effets structurés
   automatisables.

### Choix validé le 23 août 2026

Le propriétaire retient l'option 1. Cette frontière est normative : un objet
personnalisé peut seulement combiner les familles autorisées ci-dessus. Toute capacité
hors de ce sous-ensemble reste manuelle ou nécessite une nouvelle décision explicite.

### Conséquences

- Le compilateur emploie une liste d'autorisation de primitives, de chemins de faits,
  de sélecteurs et de déclencheurs propre au contenu de campagne.
- Une clause hors liste reste descriptive et `MANUELLE`; elle ne rend pas le reste de
  l'objet inexécutable si les frontières entre étapes sont explicites.
- Un objet personnalisé ne peut citer `REMPLACE`, `EXEMPTE_DE`, `IGNORE` ou un handler
  sur une règle officielle. Il peut seulement ajouter ou borner les emplacements
  expressément ouverts à la personnalisation.
- Toute modification mécanique crée une nouvelle version et les exemplaires existants
  ne migrent que sur décision explicite du MJ, conformément à 5B.

### Risques et conditions de réexamen

Le sous-ensemble prudent peut être trop limité pour certains objets de la campagne
pilote. Après inventaire des objets réellement nécessaires, le propriétaire pourra
ajouter une famille générique sans ouvrir tout le vocabulaire. Valider l'option 2
exigerait une revue de menace et une stratégie de tests spécifique avant tout éditeur.

### Condition d'évolution

Élargir la liste d'autorisation change la surface fonctionnelle et la surface d'attaque.
Cette évolution doit mettre à jour DR-5C-01, ses menaces et ses preuves avant le code ;
elle ne peut pas résulter silencieusement de l'ajout d'une primitive officielle.

## TD-5C-006 — compiler les profils avant toute utilisation

### Problème

Valider un arbre au moment de chaque action répéterait les contrôles, laisserait entrer
des conflits tardifs et mêlerait erreurs de données et refus de jeu normaux.

### Options

1. Interpréter et valider directement chaque profil à l'exécution.
2. Générer du code exécutable depuis le contenu.
3. Compiler les données en un graphe canonique de primitives, sans génération de code.

### Conception provisoire

L'option 3 est retenue. La compilation reste pure et suit ce pipeline :

```text
profil brut qualifié
  → validation de l'enveloppe et de la provenance
  → résolution des références exactes dans le manifeste
  → validation des paramètres, unités et domaines fermés
  → normalisation des prédicats, sélecteurs, expressions et étapes
  → liaison des handlers officiels admis
  → construction du graphe de dépendances et de spécificité
  → détection des cycles, conflits et données incomplètes
  → vérification des politiques d'audience et points d'engagement
  → vérification des cas de preuve obligatoires
  → forme canonique compilée + rapport + hash
```

La forme compilée contient des clés et opérations canoniques, jamais des fonctions
créées depuis les données. Elle peut être mise en cache par hash, car elle dépend
uniquement du profil, de ses dépendances exactes, du vocabulaire et du registre de
handlers.

### Compilation d'une release

Publier une release exige ensuite :

1. compiler chaque profil et version du manifeste ;
2. vérifier l'unicité des identités et règles ;
3. vérifier la fermeture de toutes les références officielles ;
4. vérifier la compatibilité du vocabulaire et des handlers ;
5. rapprocher les totaux et inventaires attendus B01–B09 ;
6. exécuter les cas d'or et contrats de preuve de la release ;
7. calculer le hash canonique du manifeste complet ;
8. produire un rapport de publication sans avertissement bloquant.

Un avertissement documente une qualité non mécanique sans rendre une règle utilisable.
Toute ambiguïté mécanique est bloquante. L'ordre physique des entrées ne change ni le
hash sémantique ni la résolution.

### Conséquences

L'exécution reçoit seulement des profils déjà qualifiés. Les erreurs de catalogue sont
détectées avant validation d'une fiche ou lancement d'un combat.

### Risques et conditions de réexamen

La compilation globale peut être coûteuse, mais elle est hors commande de jeu et se
met en cache par hash. Réexaminer le découpage seulement si les mesures de publication
l'exigent ; une compilation incrémentale devra toujours refaire les preuves de
fermeture du manifeste.

## TD-5C-007 — évaluer en deux passages déterministes autour du hasard

### Problème

Le moteur doit rester pur alors que les actions demandent des dés, parfois après un
choix, une réaction ou un premier résultat. Générer les dés dans le moteur rendrait le
rejeu impossible ; fournir tous les dés à l'avance inventerait des jets inutiles.

### Options

1. Injecter un générateur aléatoire que le moteur appelle librement.
2. Pré-générer un lot opaque de nombres.
3. Faire produire au moteur des demandes de jets stables, puis reprendre avec leurs
   résultats autoritaires.

### Conception provisoire

L'option 3 est retenue. Une résolution progresse par étapes pures :

```text
intention + versions + snapshot + instant + choix
  → qualification des règles applicables
  → remplacements, restrictions et coûts
  → plan partiel et demandes de choix ou de jets
  → résultats fournis par les ports applicatifs et persistables
  → reprise avec les mêmes entrées et résultats identifiés
  → effets, déclencheurs et éventuelles nouvelles demandes
  → plan final + trace + versions attendues
  → contrôle des invariants par les agrégats propriétaires
  → transaction 5B, puis projections et diffusion
```

Chaque demande de jet reçoit une identité dérivée de la causalité, de la règle, de la
cible et de sa séquence canonique. La reprise refuse un résultat manquant, inattendu ou
de forme différente. Un résultat déjà associé à cette identité est relu ; il n'est
jamais remplacé par un nouveau tirage.

La qualification des contributions suit un ordre sémantique fermé :

1. versions et faits autorisés ;
2. prérequis et choix ;
3. sélecteurs et géométrie ;
4. coûts et point d'engagement ;
5. jets et résultats ;
6. remplacements et effets applicables au résultat ;
7. dégâts, soins, mouvements, conditions et ressources ;
8. déclencheurs, interruptions et effets différés ;
9. invariants et plan final.

Cet ordre est une sémantique du vocabulaire, pas une priorité entre profils.

### Injection de l'horloge

L'application fournit une seule valeur d'horloge système par commande. Elle sert aux
dates d'audit, baux et échéances réelles de fenêtres de Réaction. Le temps fictionnel
est un fait métier distinct, avancé par tours/rounds ou commande MJ. Un profil ne lit
jamais l'horloge système pour faire expirer un sort, un repos, une recharge à l'aube ou
un effet durable.

### Conséquences

Le moteur demeure déterministe et les dés sont persistables avant diffusion. Une
reconnexion reprend une continuation et les résultats déjà obtenus.

### Risques et conditions de réexamen

Une action complexe peut nécessiter plusieurs allers-retours choix/jets. La trace et
les identités stables empêchent les doublons, mais les futurs contrats devront rendre
ce cycle explicite. Réexaminer seulement si un profil officiel ne peut être découpé en
continuations pures ; il ne justifie pas un hasard caché.

## TD-5C-008 — modéliser déclencheurs, Réactions et actions suspendues

### Problème

Une Réaction peut modifier, annuler ou remplacer une étape déjà engagée. L'action
déclenchante doit attendre sans perdre ses coûts, répéter ses jets ou accepter un état
concurrent incohérent.

### Options

1. Résoudre l'action puis appliquer la Réaction comme correction.
2. Garder l'action uniquement en mémoire jusqu'à la réponse.
3. Produire une continuation persistable et une pile causale de fenêtres.

### Conception provisoire

L'option 3 est retenue. Un déclencheur déclare : événement observé, moment exact avant
ou après l'étape, source, candidats, prédicats, fréquence et caractère obligatoire ou
optionnel. Les moments fermés couvrent notamment début/fin de tour, entrée/sortie de
zone, avant/après déplacement, attaque déclarée, touche, dégâts calculés/subis, sort en
cours d'incantation, coût engagé, 0 PV et fin d'effet.

Une action suspendue conserve :

- causalité et versions figées ;
- intention et choix déjà validés ;
- révisions attendues des agrégats lus ;
- coûts engagés et coûts encore conditionnels ;
- résultats de dés déjà produits ;
- étape exacte à reprendre ;
- fenêtres ouvertes, candidats et audiences ;
- instant d'ouverture, échéance éventuelle et politique d'absence de réponse ;
- trace construite jusque-là.

La fenêtre de Réaction emploie les 15 secondes par défaut et le réglage 5–60 secondes
de B05. Si le compte à rebours est désactivé, aucune échéance automatique n'est créée.
L'expiration est une nouvelle commande alimentée par une horloge injectée ; aucun timer
ne modifie directement le domaine.

Les Réactions simultanées suivent le contrôleur du tour actif, puis chaque résultat
requalifie les candidates restantes. Une Réaction peut elle-même ouvrir une fenêtre :
la continuation forme alors une pile causale. Le compilateur refuse un cycle de
déclenchement qui pourrait se reproduire sans consommation, changement d'état ou fin
explicite. La disponibilité de la Réaction et les révisions empêchent un même acteur de
répondre deux fois.

À la reprise, le moteur revalide révisions, contrôle, portée, cible et déclencheur. Un
état concurrent invalide proprement la continuation ou produit un conflit ; il ne
fusionne rien et ne relance aucun dé.

### Conséquences

Les attaques d'opportunité, `Préparer`, `Counterspell`, protections et Réactions de
profils utilisent le même mécanisme. Une panne serveur ne perd pas l'action suspendue.

### Risques et conditions de réexamen

La pile causale augmente la complexité de persistance et de projection. Des cycles
officiels imprévus exigeraient un handler ou une nouvelle sémantique explicite. Un
simple besoin de réduire les écritures ne justifie pas de revenir à un état mémoire.

## Durées, concentration, échéances et temps fictionnel

Une durée est un type fermé et non une chaîne :

- instantanée ;
- jusqu'au début ou à la fin d'un tour qualifié ;
- nombre de rounds, tours, minutes, heures ou jours fictionnels ;
- pendant un repos court ou long, ou jusqu'à sa fin ;
- Concentration avec maximum ;
- jusqu'à prochaine aube ou autre événement fictionnel nommé ;
- jusqu'à déclencheur, sauvegarde réussie, distance, dissipation, destruction ou mort ;
- permanente ou jusqu'à fin manuelle permise par la source.

Chaque instance fixe son ancre, son propriétaire temporel, son échéance calculée, ses
déclencheurs de fin et la release qui définit sa sémantique. En combat, le passage des
tours et rounds émet les événements temporels. Une pause gèle ce temps mécanique. Hors
combat, seule une transition explicite du temps fictionnel avance les effets.

La concentration est un lien exclusif par créature. Commencer un nouvel effet termine
l'ancien au moment défini et exige la confirmation produit prévue. Chaque instance de
dégâts crée séparément sa sauvegarde de maintien. Mort, incapacité, expiration et fin
volontaire sont des causes typées et tracées.

## Remplacements, restrictions et exceptions explicites

Les relations de TD-5C-004 s'appliquent à quatre emplacements nommés : applicabilité,
calcul, coût et transition. Une exception doit préciser l'emplacement et la règle
cible. Exemples de relations conceptuelles : une caractéristique d'attaque remplace la
caractéristique générale ; une Immunité restreint l'application d'une condition ; une
téléportation ignore le chemin sans ignorer la destination ; une capacité exempte un
composant précis sans supprimer les autres composants.

Une restriction est monotone : elle réduit un ensemble de choix ou ajoute une
condition. Une exemption ne peut viser qu'une restriction nommée et ne crée pas par
elle-même un droit plus large. Un remplacement produit une contribution complète du
même type que sa cible. Toute exception officielle non exprimable sous ces contraintes
est un candidat handler, jamais une invitation à rendre les relations libres.

## TD-5C-009 — produire une trace causale avant toute projection

### Problème

Le produit doit expliquer les calculs et conserver une preuve, sans révéler DD secret,
créature cachée, malédiction, illusion, option de Réaction privée ou réponse MJ.

### Options

1. Construire directement une trace différente pour chaque lecteur.
2. Produire une trace complète puis remplacer les secrets par des marqueurs.
3. Produire une trace causale complète avec audiences par nœud, puis construire une
   projection qui omet les nœuds interdits.

### Conception provisoire

L'option 3 est retenue. Une trace logique possède :

- identité, causalité, commande, release et versions d'entrée ;
- intention, snapshot et instant de référence qualifiés ;
- étapes ordonnées par phase sémantique ;
- pour chaque étape : primitive ou handler, règle/profil/source B01–B09, entrées
  autorisées, opération, contributions retenues ou écartées, relation de remplacement,
  résultat et audience ;
- demandes et résultats de choix ou de dés avec leur identité stable ;
- coûts engagés, transitions proposées, déclencheurs et continuations ;
- résultat final, versions attendues et éventuelle catégorie d'échec.

Les valeurs secrètes ne sont pas noyées dans un texte. Chaque valeur et nœud porte une
classification parmi public de campagne, participants autorisés, joueur concerné,
contrôleur, investigateur/lanceur privé, MJ ou technique interne. Une audience figée
par la règle, comme celle d'un jet, est conservée dans la trace.

### Filtrage

Le moteur produit les classifications, mais le projecteur du module propriétaire
combine celles-ci avec l'identité, l'adhésion, le rôle, le contrôle et la participation
actuels définis en 5A. Le filtrage :

- omet entièrement un nœud secret ;
- n'émet ni emplacement vide, ni nombre d'étapes, ni identifiant permettant de déduire
  son existence ;
- reconstruit les relations visibles entre les nœuds restants ;
- expose un résultat agrégé seulement si cette valeur est elle-même autorisée ;
- ne met jamais en cache une projection sans destinataire et révisions de droits.

Une trace publique peut donc expliquer « attaque avec Avantage, touche, dégâts réduits
par Résistance » sans révéler la source cachée de l'Avantage ou une malédiction privée.
Le MJ reçoit la causalité complète dans la limite de son autorité de campagne.

### Conséquences

La même preuve sert raison courte, détail consultable, audit, cas d'or et diagnostic.
Le filtrage reste cohérent avec les projections de l'état et des événements.

### Risques et conditions de réexamen

Le nombre ou l'ordre de nœuds peut lui-même révéler un secret ; l'omission et la
reconstruction doivent être testées contre ces canaux auxiliaires. Réexaminer le
format si les traces approchent les limites de 5B ; les étapes peuvent rester enfants
paginables sans changer leur modèle causal.

## Erreurs internes et catégories d'échec

Les erreurs sont des résultats typés, jamais des messages levés depuis une description.
Elles distinguent leur phase, leur caractère rejouable, leur point d'engagement et leur
audience. Les futurs transports décideront séparément de leur représentation publique.

| Catégorie | Sens | Mutation permise |
|---|---|---|
| `PROFIL_INVALIDE` | Le profil n'a pas compilé ou son hash ne correspond pas. | Aucune. |
| `VERSION_INDISPONIBLE` | Une version exacte figée est absente ou incompatible. | Aucune ; pas de fallback. |
| `DONNÉE_INCOMPLÈTE` | Un paramètre mécanique requis manque ou se contredit. | Aucune sur l'usage concerné. |
| `INTENTION_INAPPLICABLE` | L'action ou option n'est pas disponible dans ce contexte. | Aucune. |
| `PRÉREQUIS_NON_SATISFAIT` | Un prérequis connu échoue. | Aucune avant engagement. |
| `CHOIX_REQUIS` | La résolution attend un choix autorisé. | Aucune ; continuation possible. |
| `CIBLE_INVALIDE` | Cardinalité, portée, visibilité, ligne d'effet ou état invalide. | Selon le point d'engagement défini par la règle. |
| `RESSOURCE_INSUFFISANTE` | Coût, quantité, usage ou économie indisponible. | Aucune. |
| `JET_REQUIS` | Une demande déterministe attend son résultat serveur. | Aucune ; continuation possible. |
| `RÉACTION_EN_ATTENTE` | Une fenêtre suspend l'action. | Coûts déjà engagés seulement. |
| `ARBITRAGE_MJ_REQUIS` | Une clause narrative attend une décision privée. | Coûts et conséquences déterministes déjà engagés selon la règle. |
| `CONFLIT_DE_RÈGLES` | Deux contributions ne possèdent aucune relation valide. | Aucune ; donnée à corriger. |
| `CONFLIT_DE_RÉVISION` | L'état lu n'est plus courant lors de l'application. | Aucune mutation partielle, aucun nouveau hasard. |
| `INVARIANT_VIOLÉ` | Le plan final ne respecte pas un agrégat propriétaire. | Transaction refusée. |
| `HANDLER_DÉFAILLANT` | Un handler officiel viole son contrat ou ne produit pas de résultat total. | Aucune ; incident interne. |
| `ERREUR_MOTEUR` | Défaut inattendu du vocabulaire ou de l'évaluateur. | Aucune ; incident interne. |

Un échec normal d'attaque ou une sauvegarde réussie n'est pas une erreur. Il produit un
résultat de jeu et conserve les coûts engagés. Une erreur interne n'est jamais
transformée en échec normal afin de faire avancer la partie silencieusement.

## TD-5C-010 — versionner séparément structure, primitives et sémantique

### Problème

Une enveloppe persistée peut évoluer sans changer la règle, tandis qu'une errata peut
changer la règle sans changer la forme du profil. Une unique version sémantique ne
permet pas de distinguer ces compatibilités.

### Options

1. Employer uniquement une version de release supposée suivre SemVer.
2. Déduire la compatibilité des champs présents.
3. Porter des versions explicites et une matrice de compatibilité du moteur.

### Conception provisoire

L'option 3 est retenue :

- `schemaVersion` concerne la représentation persistée de 5B ;
- la version du modèle de profil concerne la forme logique acceptée par le compilateur ;
- la version du vocabulaire fixe la sémantique de chaque primitive ;
- la version du contrat de handler fixe entrées, sorties et règles de pureté ;
- la version de profil identifie une mécanique officielle ou de campagne ;
- la version de release ferme un ensemble qualifié.

Le moteur déclare une matrice explicite des versions qu'il sait compiler et évaluer.
Il ne devine aucune compatibilité grâce à SemVer, à un champ optionnel ou à une version
supérieure. Un upcaster de représentation ne change pas le hash sémantique ; une
modification de comportement crée une nouvelle version mécanique.

### Adoption d'une errata

Une errata suit obligatoirement :

1. enregistrer la nouvelle provenance et comparer la règle précédente ;
2. créer les nouvelles versions de profils concernées ;
3. recompiler les dépendants et exécuter leurs preuves ;
4. publier une nouvelle `RulesetRelease` ;
5. rendre cette release sélectionnable pour les nouvelles validations ;
6. proposer séparément l'adoption aux campagnes ou états existants ;
7. revalider ou migrer explicitement chaque build, exemplaire, profil ou effet choisi ;
8. auditer avant/après, auteur, motif, release source et release cible.

Un combat lancé conserve toutes ses versions. Une errata ne le modifie jamais. Une
fiche acceptée ne change pas sans revalidation ou migration. Un effet durable peut
rester sous son ancienne règle ou faire l'objet d'une migration explicite qui décrit
sa transition ; la release courante ne le recalcule pas silencieusement.

### Migrations explicites

Une migration mécanique est un plan versionné et pur qui nomme : périmètre éligible,
versions source/cible, prérequis, transformations, effets conservés, choix requis,
invariants et stratégie d'échec. Elle ne réécrit aucune version historique. Son
application appartient aux agrégats et transactions 5B, pas au compilateur de règles.

### Conséquences

Les anciennes parties restent reproductibles et les évolutions compatibles sont
explicites.

### Risques et conditions de réexamen

Le nombre de versions augmente et plusieurs releases peuvent rester actives. Les
outils d'exploitation devront mesurer leur usage avant archivage éditorial. Une
suppression physique reste interdite tant qu'une référence durable existe.

## Pipeline déterministe provisoire de résolution

Le pipeline ci-dessous précise TD-5C-007 et la frontière avec l'application :

| Étape | Entrée | Sortie pure | Refus principal |
|---|---|---|---|
| 1. Charger | Références exactes | Paquet d'entrée complet construit hors moteur | Version absente |
| 2. Canoniser | Intention, faits, choix, instant | Contexte ordonné et typé | Fait inconnu |
| 3. Découvrir | Profils compilés et déclencheurs | Contributions candidates | Profil invalide |
| 4. Qualifier | Prédicats et sélecteurs | Contributions applicables/écartées | Prérequis/cible |
| 5. Composer | Relations nommées | Graphe sans conflit | Conflit de règles |
| 6. Chiffrer | Expressions, coûts, géométrie | Prévisualisation et point d'engagement | Ressource insuffisante |
| 7. Demander | Choix, jets ou Réactions manquants | Continuation stable | Attente normale |
| 8. Résoudre | Résultats injectés | Conséquences mécaniques ordonnées | Résultat invalide |
| 9. Déclencher | Événements produits | Effets immédiats, différés ou nouvelle continuation | Cycle invalide |
| 10. Planifier | État avant et conséquences | Deltas, effets, trace et versions attendues | Invariant évident |
| 11. Appliquer hors moteur | Agrégats et révisions | Snapshots, reçu, audit, outbox | Conflit/invariant |
| 12. Projeter après commit | Résultat persistant et droits courants | Vues et événements autorisés | Aucun droit |

La prévisualisation et la confirmation utilisent le même profil compilé et la même
sémantique. La prévisualisation n'engage aucun coût, ne produit aucun jet autoritaire et
ne promet pas qu'une révision restera valide.

## Stratégie de validation du corpus D&D 2024

### Unité de qualification

Chaque entrée de catalogue possède une fiche de preuve : identité, provenance, version,
hash, dépendances, profils compilés, couverture de primitives/handlers, scénarios
positifs et négatifs, bornes, secrets et identifiants B01–B09. « Présent dans un seed »
ou « description disponible » ne constitue jamais une preuve.

### Les 391 sorts

Le registre B06 reste l'inventaire d'autorité. Chaque `B06-SP-xxx` satisfait AC-SP
seulement si :

- les neuf métadonnées et marqueurs sont recoupés avec PHB et errata ;
- chaque phrase mécanique est rattachée à une primitive, une relation, une étape MJ ou
  un handler officiel justifié ;
- ciblage, composantes, économie, coût, concentration, durée, surclassement, réussite,
  échec, fin et secret sont complets ;
- nominal, cible invalide, ressource absente, borne, surclassement et retransmission ont
  un cas de preuve ;
- les profils de créatures ou objets dépendants pointent une version du manifeste.

Le contrôle de release exige exactement 391 identités et la distribution
`34/64/63/52/41/48/34/21/18/16` des niveaux 0 à 9. L'absence actuelle de `telepathy`
reste un écart de données ; elle ne peut pas être compensée par une entrée inventée.

### Créatures

Les 503 profils XMM de la release 5e.tools `v2.33.3`, son empreinte figée, les errata
officiels prioritaires et les 15 profils PHB paramétrés forment l'inventaire B08. Pour
chaque profil, la preuve couvre statistiques, défenses, sens, vitesses, attaques,
sauvegardes, traits, ressources, recharges, magie, Réactions, actions légendaires,
formes, équipement récupérable, contrôle, visibilité et trésor applicables.

Les cinq Modrons absents, les deux profils divergents, les 89 profils tronqués et les
15 profils paramétrés non exécutables restent bloquants pour leur usage tant qu'une
version qualifiée n'existe pas. Une identité scalaire concordante ne vaut pas profil
exécutable.

### Objets

La qualification couvre les 38 armes, 12 armures, le bouclier, 25 familles d'outils,
82 entrées de matériel/paquetage, le grimoire, variantes concrètes et le catalogue
magique A–Z. Les propriétés partagées sont testées une fois comme profils communs puis
chaque objet prouve ses paramètres, écarts, charges, prochaine aube, harmonisation,
malédiction, secrets, invocation et clause narrative propres.

Un objet personnalisé n'entre jamais dans la release officielle. Sa version de
campagne est compilée sous la liste d'autorisation issue de DR-5C-01 et reste limitée à
sa campagne.

### Classes, sous-classes, dons et capacités

La preuve suit les matrices B01 à B04 : dix espèces, douze classes, seize historiques,
création complète, vingt niveaux, quarante-huit sous-classes, dons, choix,
remplacements, ressources, multiclassage, emplacements, respécialisation et états
conservés. Chaque table officielle possède un test tabulaire exhaustif par niveau et
chaque capacité déclenchée un profil mécanique propre.

Les dérivés de fiche sont vérifiés depuis des builds représentatifs et des combinaisons
limites : mono-classe, multiclassage, formules de CA concurrentes, changements de
Constitution, sources de magie multiples, équipement non maîtrisé, concentration et
effets temporaires.

### Barrière de publication

Une release candidate n'est publiable que si : inventaires complets, compilation sans
erreur, hashes reproductibles, aucune référence orpheline, aucun handler non admis,
aucune donnée mécanique ambiguë, couverture B01–B09 complète et suite de preuve verte.
Les écarts connus restent dans son rapport de qualification et empêchent la
publication ; ils ne sont pas masqués par un avertissement.

## Matrice provisoire de représentabilité B01 à B09

Cette matrice argumente que chaque famille possède une voie de représentation. La
preuve définitive viendra des tranches d'implémentation et de leurs tests ; elle ne
prétend pas que les profils du catalogue sont déjà écrits ou validés.

| Bloc | Familles normatives | Représentation 5C | Preuve attendue |
|---|---|---|---|
| B01 | création, quotas, choix, équipement initial, dérivés et validation | prérequis, sélecteurs de catalogue, cardinalités, tables finies, contributions de build, coûts nuls nommés et trace de dérivé | toutes les combinaisons valides et chaque refus de quota ; même résultat en prévisualisation et validation |
| B02 | niveaux 2–20, classes, sous-classes, dons, sorts, PV et ressources | profils paramétrés par niveau, tables finies, remplacements de choix, jets de PV, ajustements de maxima et transitions de build | table exhaustive par niveau/classe ; aucun soin ou repos implicite |
| B03 | prérequis multiclasses, cumuls, emplacements et respécialisation | prédicats de scores/classes, somme et arrondis typés, relations `RESTREINT/REMPLACE`, plan de transformation d'état | combinaisons mono/multiclasses et avant/après exhaustif de respécialisation |
| B04 | dérivés, PV, mort, ressources, conditions, concentration, inventaire | expressions tracées, soins/dégâts, ressources, catalogue fermé de conditions, effets, durées et invariants propriétaires | propriétés de bornes, transitions vitales, sources concurrentes et corrections compensatoires |
| B05 | initiative, tours, actions, mouvement, zones, attaques, dégâts et Réactions | économie d'action, jets d20, géométrie pure, sélecteurs, paquets de dégâts, déclencheurs, continuations et pile de fenêtres | scénarios de combat, mouvements limites, interruptions et reprise identique |
| B06 | 391 sorts, composants, ciblage, concentration, surclassement, effets durables et narration | profils de sort, coûts matériels, zones, durées, effets, relations explicites, handlers officiels exceptionnels et `ARBITRAGE_MJ_REQUIS` | AC-SP sur 391 lignes, distribution par niveau et cas d'or des familles d'exceptions |
| B07 | armes, objets, charges, harmonisation, secrets et objets de campagne | profils d'objet/activation, ressources, emplacements, déclencheurs, effets, projections et compilateur restreint personnalisé | tables communes, profils A–Z, versions d'exemplaires et liste d'autorisation DR-5C-01 |
| B08 | profils, actions, recharges, contrôle, invocations, formes et renforts | profils de créature paramétrés, ressources, déclencheurs, actions, sources de contrôle, références B06/B07 et versions figées | 503 XMM + 15 PHB, anomalies bloquées et scénarios d'instance indépendante |
| B09 | validation, jets libres, repos, butin, investigation, corrections et audit | mêmes profils compilés orchestrés par workflows, horloge fictionnelle, jets injectés, audience, trace et plans multi-agrégats | cas d'idempotence, secret, choix MJ, repos collectif et concurrence de butin |

### Limites assumées de la représentabilité

- Les permissions, transactions, workflows de revue et baux restent dans leurs
  contextes propriétaires ; le moteur produit leurs décisions mécaniques sans posséder
  leurs agrégats.
- Les clauses subjectives ne sont pas « calculées » : elles produisent une étape MJ
  bornée et auditée.
- Les exceptions officielles réellement isolées restent représentables par un handler
  pur, à condition de satisfaire TD-5C-005.
- Le sous-ensemble prudent des objets personnalisés est fixé par DR-5C-01 ; sa liste
  technique exacte de primitives reste provisoire jusqu'à la première tranche.

## Exemples conceptuels représentatifs

Ces exemples illustrent les concepts. Ils ne fixent ni noms de champs, ni payloads, ni
signatures, ni ordre de collections.

### Valeur dérivée de fiche

Un personnage possède une formule de CA sans armure, un bouclier maîtrisé et un effet
temporaire compatible. Le moteur sélectionne une seule formule de base parmi les
alternatives, explique pourquoi les autres sont écartées, ajoute le bouclier et l'effet,
puis applique une éventuelle borne. La trace relie chaque contribution à son build, à
la version de l'objet ou à l'effet actif. Modifier la Dextérité recalcule cette valeur,
mais ne touche ni PV actuels ni ressources sans règle liée.

### Attaque avec Avantage, Résistance et condition

Une créature attaque une cible visible avec une source d'Avantage tandis qu'une autre
source impose Désavantage. Les contributions s'annulent et la demande ne contient
qu'un d20 retenu. Après une touche, le paquet de dégâts typé est calculé ; la Résistance
de la cible le divise une fois avant les PV temporaires. L'attaque tente ensuite
d'appliquer une condition officielle : l'Immunité éventuelle la refuse sans annuler les
dégâts. Une projection publique peut montrer le résultat et la Résistance sans révéler
la source secrète d'un modificateur.

### Sort avec coût, sauvegarde, concentration et effet durable

Un lanceur choisit la source du sort et son niveau d'emplacement. Les prérequis
contrôlent préparation, composantes, limite d'emplacement du tour, cible, portée et
ligne d'effet. La confirmation engage l'emplacement et le composant consommé. Le moteur
demande les sauvegardes serveur, applique les conséquences propres aux réussites et
échecs, puis crée un effet de Concentration avec échéance et déclencheurs répétés. Si
l'effet dépasse la scène, le plan demande un `PersistentEffect` rattaché à une cible ou
un lieu nommé. Une cible invalide après engagement suit la clause du sort et ne rend pas
automatiquement les coûts.

### Réaction suspendant une action

Une attaque validée quitte l'allonge d'une défense qui peut réagir. Le moteur conserve
l'intention, les versions, le mouvement avant sortie, les coûts engagés et l'étape de
reprise. Une fenêtre privée s'ouvre pour le contrôleur autorisé. Si la Réaction inflige
un effet qui annule le mouvement, la continuation requalifie la destination et reprend
depuis le nouvel état. Une expiration vaut refus et reprend la même continuation ; elle
ne rejoue ni attaque ni coût déjà obtenu.

### Objet personnalisé limité

Conformément à DR-5C-01 validée, un objet de campagne peut posséder trois charges,
dépenser une charge par action Magie, viser une créature visible à portée fixe, imposer
une sauvegarde et appliquer des dégâts plus une condition officielle pendant une durée
fixe. Le MJ ne peut pas saisir une formule libre, cibler un chemin interne de fiche,
référencer un handler, remplacer une règle officielle ou créer une invocation. Une
clause supplémentaire hors sous-ensemble est marquée manuelle.

### Clause narrative après dépense normale

Un effet officiel comporte une partie déterministe et une demande ouverte. Le moteur
valide normalement le lancement, consomme la ressource, résout les bornes et effets
automatiques, puis produit `ARBITRAGE_MJ_REQUIS` avec intention, contexte et audience
privée. Le MJ choisit une conséquence autorisée ou saisit un résultat narratif ; les
agrégats vérifient encore leurs invariants. L'absence de décision ne rembourse pas
silencieusement le coût et la reprise conserve l'étape en attente.

## TD-5C-011 — valider par plusieurs niveaux de preuve complémentaires

### Problème

Quelques tests d'exemples ne prouvent ni les invariants algébriques, ni les centaines
de profils. Des snapshots massifs seuls rendraient les erreurs difficiles à localiser.

### Options

1. Tester uniquement chaque profil par exemples manuels.
2. Utiliser uniquement des snapshots d'ensemble.
3. Combiner propriétés, tables, cas d'or, invariants, tests de corpus et déterminisme.

### Conception provisoire

L'option 3 est retenue.

### Propriétés du noyau

- même entrée canonique, même plan et même trace ;
- permutation de contributions commutatives, même résultat sémantique ;
- Avantage/Désavantage idempotents et annulation mutuelle ;
- minimum, maximum, Résistance et Vulnérabilité respectent arrondis et bornes ;
- aucun coût avant engagement et aucune double consommation après reprise ;
- tout remplacement cible exactement une étape ;
- aucune projection faible n'est plus informative qu'une projection forte autorisée ;
- une version ou un résultat de dé absent ne déclenche aucun fallback.

### Tests tabulaires

Les tables couvrent niveaux, bonus de maîtrise, dés de vie, progression de classe,
emplacements multiclasses, tailles/empreintes, distances métriques, couvertures, types
de dégâts, conditions, repos, armes, armures, charges, recharges et profils paramétrés.
Chaque ligne de source devient un cas nommé et traçable.

### Cas d'or

Un cas d'or fixe release, profils, faits, choix, instant, dés, plan final et trace
complète. Il couvre les exemples représentatifs, les décisions produit particulières,
les exceptions officielles et chaque handler. Une mise à jour n'accepte un nouveau cas
d'or qu'avec provenance et justification de l'écart.

### Tests de corpus

- compilation de chaque profil et de la release complète ;
- contrôle des totaux et hashes B01–B09 ;
- absence de référence orpheline et de conflit ;
- exécution des preuves attachées aux 391 sorts et aux profils de créatures/objets ;
- contrôle qu'aucun profil de campagne n'accède à une primitive interdite ;
- test de chaque errata contre le profil remplacé et les dépendants.

### Déterminisme et reprise

Chaque scénario est exécuté au moins deux fois avec sérialisation/canonisation
intermédiaire. Les continuations sont reprises après choix, jet et Réaction. Les tests
font varier ordre physique des profils, reconnexion, retransmission et instant système
non pertinent : aucune variation ne doit changer le résultat. Un changement du temps
fictionnel ou d'un dé injecté doit au contraire produire uniquement les différences
causales attendues.

### Invariants d'intégration

Sans tester ici les transports, les futurs tests d'application prouvent : révisions
vérifiées, transaction indivisible, reçu d'idempotence, hasard unique, trace/audit/outbox
persistés ensemble et diffusion après commit. Le moteur ne remplace pas ces preuves de
5A/5B.

### Risques et conditions de réexamen

Le volume de cas peut ralentir la validation complète. Les suites rapides peuvent être
sélectionnées par dépendance et hash, mais la barrière de publication d'une release
reste exhaustive. Réexaminer la répartition des suites sur mesure de temps, jamais en
retirant une famille de preuve.

## Confirmation incrémentale par l'implémentation

La conception détaillée sera éprouvée tranche par tranche, sans faire du code une
source normative. Chaque tranche part d'une famille B01–B09 et suit :

1. sélectionner des règles représentatives, leurs bornes, secrets et exceptions ;
2. préciser le minimum provisoire de formes, primitives, étapes, traces et
   continuations nécessaire à cette tranche ;
3. implémenter ce minimum derrière les frontières 5A/5B ;
4. prouver propriétés, cas tabulaires, cas d'or, déterminisme et reprise applicables ;
5. comparer les résultats aux matrices et sources normatives ;
6. revenir à `SPEC` avant fusion si la preuve invalide un détail de 5C ;
7. marquer comme éprouvés seulement les éléments couverts par code revu et tests verts.

Les statuts de conception sont :

| Statut | Sens |
|---|---|
| `VALIDÉ` | Principe ou décision explicitement accepté par le propriétaire ; une implémentation ne peut le changer. |
| `PROVISOIRE` | Proposition détaillée cohérente avec les principes, encore libre d'évoluer avant preuve. |
| `ÉPROUVÉ` | Détail confirmé sur au moins une tranche représentative par implémentation, tests et revue. |

Un détail `ÉPROUVÉ` peut encore être généralisé ou corrigé lorsqu'une autre famille
révèle une limite. Si cette correction modifie un comportement fonctionnel, une
décision propriétaire précède le code. Si elle ne change que la forme technique, le
document, la preuve et les dépendants sont mis à jour dans la même tranche.

Les jalons de confirmation portent en priorité sur :

- les formes TypeScript/Zod, confirmées par le compilateur strict et la validation des
  entrées externes ;
- le pipeline, confirmé par une résolution simple puis une action avec choix, jet et
  interruption ;
- le catalogue de primitives, confirmé progressivement par les familles B01–B09 et
  l'inventaire des handlers réellement nécessaires ;
- les traces, confirmées par l'explication d'un calcul et les tests de non-divulgation ;
- les continuations, confirmées par reprise après Réaction, reconnexion et conflit de
  révision sans nouveau hasard.

Cette méthode ne réduit pas la barrière finale : une `RulesetRelease` D&D 2024 reste
non publiable tant que tout son corpus obligatoire et ses preuves ne sont pas complets.

## Synthèse des conceptions provisoires et décisions validées

| ID | Statut | Conception ou décision | Risque principal | Condition de réexamen |
|---|---|---|---|---|
| TD-5C-001 | `PROVISOIRE` | release comme manifeste fermé et épinglé | publication globale coûteuse | second système ou mesure bloquante |
| TD-5C-002 | `PROVISOIRE` | algèbre fermée et typée | vocabulaire incomplet | famille répétée de handlers |
| TD-5C-003 | `PROVISOIRE` | géométrie et perception séparées | divergence de snapshot | entrée réelle de la 2,5D/3D |
| TD-5C-004 | `PROVISOIRE` | spécificité par relations nommées | qualification éditoriale exigeante | nouvelle relation officielle récurrente |
| TD-5C-005 | `PROVISOIRE` | handlers purs officiels seulement | registre trop large | plusieurs exceptions de même structure |
| DR-5C-01 | `VALIDÉ` | sous-ensemble personnalisé prudent | expressivité insuffisante | inventaire réel des objets pilote |
| TD-5C-006 | `PROVISOIRE` | compilation sans génération de code | coût de publication | mesure nécessitant compilation incrémentale |
| TD-5C-007 | `PROVISOIRE` | continuations et dés/horloge injectés | plusieurs allers-retours | exception officielle non découpable |
| TD-5C-008 | `PROVISOIRE` | pile causale d'actions suspendues | complexité de reprise | cycle officiel non représentable |
| TD-5C-009 | `PROVISOIRE` | trace complète classifiée puis projetée | canaux auxiliaires de fuite | format devenu trop volumineux |
| TD-5C-010 | `PROVISOIRE` | compatibilités et migrations explicites | coexistence de versions | outillage mesuré insuffisant |
| TD-5C-011 | `PROVISOIRE` | preuve multi-niveaux exhaustive | temps de suite | optimisation mesurée sans perte de preuve |

## Décisions reportées et frontière de la suite

Restent hors de 5C :

- schémas TypeScript/Zod et forme persistée détaillée des profils ;
- contrats HTTP et Socket.IO, accusés, curseurs et durée de bail de fouille ;
- dépendances et câblage NestJS/Mongoose ;
- construction effective des profils, catalogues, seeds, migrations et tests ;
- stockage des images, déploiement, observabilité et sauvegarde.

Les tranches d'implémentation peuvent maintenant commencer sous les principes validés,
mais elles ne doivent pas figer d'avance les formes provisoires. Aucune tranche
n'autorise à inventer une donnée officielle absente : chaque profil devra franchir sa
barrière de preuve et tout écart retournera à `SPEC` avant fusion.
