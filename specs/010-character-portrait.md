# Spec 010 — Portrait de personnage

## Statut

**SPEC — non validée.** Elle fixe ce qui est déjà tranché ailleurs, décrit la cible
fonctionnelle du portrait, et isole les dix `DÉCISION REQUISE` qui bloquent tout
plan et tout code. Conformément à `docs/README.md`, l'ordre reste
`SPEC → PLAN → CODE → TEST → REVIEW` : ce document s'arrête à la spec et ne
modifie aucun code.

## Références normatives

- `SF-002`, création de niveau 1 : « portrait téléversé, facultatif » et portrait
  générique à défaut (`docs/REQUIREMENTS.md`) ;
- `SF-002`, section « Restent modifiables » : le portrait échappe au verrou
  d'acceptation ;
- `docs/REQUIREMENTS.md`, section « Visibilité » : en combat, un participant voit le
  portrait d'un **allié** ;
- `docs/REQUIREMENTS.md`, section « Suppression et conservation » : suppression
  logique ordinaire, purge physique sur demande explicite, « médias » explicitement
  nommés dans le périmètre de purge ;
- `DEC-003` (`docs/DECISIONS/003-character-lifecycle.md`) : le portrait téléversé sert
  aussi de pion ; un profil générique est utilisé par défaut ; le portrait reste
  modifiable après acceptation ;
- `DEC-015` / Phase 5A : autorité serveur, projections nommées, enveloppe
  transactionnelle ; `docs/TECHNICAL-ARCHITECTURE-5A.md` reporte explicitement
  « stockage, formats et limites des portraits et images d'objets » ;
- `DEC-016` / Phase 5B : reçus, audit fonctionnel, outbox, concurrence optimiste par
  révision, manifeste de purge par lots ; `docs/TECHNICAL-PERSISTENCE-5B.md` reporte
  la même décision et inscrit « blobs » dans la portée de purge ;
- `B01-ID-008` (`docs/rules/dnd-2024/B01-LEVEL-ONE-CREATION.md`, ligne 106), état
  **ABSENTE**, avec ses trois critères d'acceptation déjà arrêtés ;
- `specs/009-level-one-character-creation.md`, section « Décision — stockage des
  portraits » : le stockage objet est retenu par Charly le 1ᵉʳ septembre 2026, et ce
  choix « n'autorise pas à inventer ces paramètres de sécurité » ;
- `specs/007-character-assignment-visibility.md` : appartenance campagne, projections
  privées, lectures par campagne ;
- `CLAUDE.md`, section « Doc-first NestJS » : transaction Mongo, ajout d'une lib
  tierce et tout élargissement de la surface d'attaque appartiennent à Charly.

## Périmètre

Cette spec couvre **le portrait d'un personnage joueur, et lui seul** :

- l'absence de portrait et le visuel générique qui la représente ;
- le téléversement d'un portrait par un utilisateur autorisé, avant comme après
  l'acceptation par le MJ ;
- le remplacement et le retrait d'un portrait ;
- la représentation du portrait dans les projections existantes — vivier, fiche
  contrôlée, projection MJ — et dans le pion de combat à venir ;
- la vie du fichier : validation, traitement, conservation, suppression,
  réconciliation ;
- la forme des URL servies et les droits de lecture associés.

### Décision de périmètre — les images d'objets restent dehors

**FAIT.** `docs/TECHNICAL-ARCHITECTURE-5A.md` (ligne 372) et
`docs/TECHNICAL-PERSISTENCE-5B.md` (ligne 939) portent une seule et même décision
ouverte, formulée « stockage, formats et limites des portraits **et images
d'objets** ».

**DÉCISION de cette spec.** Elle ne traite que le portrait. Les images d'objets sont
exclues, et l'assumer a un coût qu'il faut nommer :

- ce qui justifie le découpage : le portrait a un porteur unique et un cycle de vie
  déjà spécifié (`SF-002`, `DEC-003`, `B01-ID-008`), là où l'image d'objet n'a
  aujourd'hui **aucune exigence fonctionnelle rédigée** — ni auteur, ni visibilité, ni
  règle de partage entre contenu de référence et contenu personnalisé de campagne.
  Spécifier les deux ensemble reviendrait à inventer la moitié manquante ;
- ce que cela coûte : le contrat de stockage écrit ici devra accueillir un second type
  de média sans être réécrit. La spec impose donc une contrainte de conception —
  §« DR-010-01 » et §« DR-010-10 » — mais ne prétend pas l'avoir validée sur un cas
  d'usage réel ;
- ce que cela laisse ouvert : la décision 5A/5B n'est refermée qu'à moitié. Elle
  restera listée comme ouverte dans les deux documents techniques tant que les images
  d'objets n'ont pas leur propre spec.

**RECOMMANDATION.** Nommer l'abstraction de stockage par sa fonction et non par le
portrait (« média de campagne » plutôt que « stockage de portraits »), afin que la
seconde spec ajoute un type et non une seconde infrastructure.

## Hors périmètre volontaire

- images d'objets, illustrations de monstres, cartes de combat, avatars de compte et
  tout autre média : voir ci-dessus ;
- moteur de combat, plateau, pions et leur rendu. Cette spec fixe **ce que le pion
  reçoit** et pas comment il l'affiche ;
- respécialisation, progression, état d'aventure ;
- modification de `.env`, des seeds, des migrations MongoDB ou du CI ;
- ajout effectif d'une dépendance : aucune n'est ajoutée par cette spec, et plusieurs
  `DÉCISION REQUISE` ci-dessous en supposent une.

## Ce qui est déjà tranché

Rappelé ici pour être lisible sans ouvrir les archives, comme l'exige
`docs/README.md`. Ces points ne sont pas rouverts.

| Point | Nature | Source |
|---|---|---|
| Le portrait est facultatif | DÉCISION | `SF-002` |
| À défaut, portrait générique : fond blanc, silhouette de tête grise | DÉCISION | `SF-002` |
| Le même visuel sert sur la fiche et en combat | DÉCISION | `SF-002`, `DEC-003` |
| Le portrait téléversé sert aussi de pion | DÉCISION | `DEC-003` |
| Le portrait reste modifiable après acceptation par le MJ | DÉCISION | `SF-002`, `DEC-003` |
| Nom, alignement, espèce/lignée, historique et taille deviennent immuables | DÉCISION | `SF-002`, `DEC-003` |
| En combat, un participant voit le portrait d'un **allié** | DÉCISION | `docs/REQUIREMENTS.md`, Visibilité |
| Le stockage est un **stockage objet** | DÉCISION, 1ᵉʳ sept. 2026 | `specs/009`, § stockage des portraits |
| Ce choix n'autorise pas à inventer les paramètres de sécurité | DÉCISION | `specs/009` |

**FAIT — état du code au 1ᵉʳ septembre 2026.** `B01-ID-008` est **ABSENTE**. Un champ
`portrait: z.string().url().nullable()` existe déjà dans
`CharacterPoolProjectionSchema` (`shared/src/character-schema.ts:477`) et il est
alimenté par une constante `portrait: null` dans
`back/src/modules/characters/application/character-list.mapper.ts:54`. Il n'existe ni
champ persisté, ni route, ni port de stockage, ni asset générique — `front/public`
n'existe pas. Ce champ est donc une amorce de contrat, pas une implémentation.

## Invariants

1. **Le portrait n'est jamais une condition de validité d'une fiche.** Aucune
   soumission, acceptation, attribution ou entrée en combat ne peut être refusée pour
   absence de portrait.
2. **Un personnage possède au plus un portrait actif.** Le remplacement est une
   substitution, jamais un ajout ; il n'existe pas de galerie.
3. **Le portrait affiché est toujours défini.** À défaut de portrait téléversé, c'est
   le générique. Aucune projection ne rend un état « image cassée » : l'absence est un
   cas nominal, représenté explicitement.
4. **Un seul visuel par personnage.** Le portrait de la fiche et le pion de combat
   dérivent du même original ; ils peuvent différer par leurs dimensions, jamais par
   leur contenu.
5. **Le serveur est l'autorité.** Ni le type MIME déclaré par le client, ni le nom du
   fichier, ni son extension ne sont crus. Seul le contenu réellement lu par le
   serveur fait foi.
6. **Aucun contenu téléversé n'est servi tel quel.** Tout fichier accepté est
   re-encodé par le serveur ; l'octet d'origine n'est jamais renvoyé à un navigateur.
7. **Le portrait est isolé par campagne.** Comme toute ressource, il se charge par
   `campaignId` et identifiant ; un identifiant venu d'une autre campagne est masqué
   comme absent (`specs/007`).
8. **Aucune référence orpheline visible.** Une projection ne désigne jamais un objet
   absent du stockage. La cohérence inverse — un objet sans référence — est tolérée
   temporairement et réconciliée (§ Persistance et cohérence).
9. **Le portrait n'entre pas dans la version examinée par le MJ.** Le changer ne crée
   ni révision de build, ni nouvelle soumission (§ Le portrait et le verrou
   d'acceptation).
10. **Le générique n'est pas un fichier de personnage.** Il n'appartient à aucune
    campagne, n'est jamais supprimé par une purge, et ne consomme aucun quota.

## Les décisions bloquantes

Rien de ce qui suit ne peut être implémenté avant arbitrage. Chaque entrée porte les
options réellement praticables et leurs conséquences. Les `RECOMMANDATION` sont des
propositions : elles ne valent pas décision.

### DR-010-01 — Contrat du fournisseur de stockage objet

Le stockage objet est décidé ; **le fournisseur ne l'est pas**, et rien dans le dépôt
ne le désigne. `back/package.json` ne contient aucun SDK de stockage, et
`back/src/config/env.validation.ts` aucune variable correspondante.

Ce qu'il faut arrêter, en un bloc : fournisseur, région, garanties de durabilité et de
disponibilité annoncées, nature des secrets, mécanisme de rotation, et comportement de
l'application quand le service est indisponible.

**Options.**

1. **Fournisseur S3-compatible auto-hébergé (type MinIO), à côté de MongoDB.** Aucune
   dépendance à un tiers, données hébergées avec le reste, coût marginal nul en
   pilote. En contrepartie : la durabilité devient la responsabilité de l'exploitant,
   il faut une sauvegarde et une restauration propres au stockage, et le déploiement
   gagne un service à superviser — sujet déjà listé comme non résolu par 5B.
2. **Fournisseur managé S3-compatible.** Durabilité et disponibilité contractuelles,
   sauvegarde intégrée, montée en charge immédiate. En contrepartie : un compte, une
   facture, des secrets à faire vivre hors du dépôt, une région à choisir
   explicitement, et une dépendance externe dans le chemin de lecture.
3. **AWS S3.** Écosystème le plus documenté, mais le SDK est lourd et le choix engage
   sur un fournisseur unique alors que l'API S3 est disponible ailleurs.

**Conséquence commune à toutes les options.** Un SDK est une **dépendance nouvelle**,
donc une décision de Charly au titre de `CLAUDE.md`. Le protocole S3 étant commun aux
trois options, le choix du fournisseur peut être différé **si et seulement si** l'accès
passe par un port applicatif et une seule implémentation S3-compatible pilotée par la
configuration.

**Sous-décision — région.** Elle n'est pas cosmétique : les portraits sont des données
personnelles au sens du RGPD dès qu'ils représentent une personne, et la purge de
compte promise par `docs/REQUIREMENTS.md` doit pouvoir être exécutée et prouvée. Une
région hors Union européenne exige une base légale de transfert que rien dans le dépôt
ne documente.

**Sous-décision — indisponibilité.** Deux comportements possibles, aux conséquences
opposées :

- *dégradation* : le stockage indisponible n'empêche ni la lecture d'une fiche, ni un
  combat ; le générique est affiché à la place du portrait, et le téléversement répond
  `503`. La fonctionnalité principale ne tombe jamais avec le stockage ;
- *échec franc* : toute lecture qui référence un portrait échoue. Plus honnête pour le
  diagnostic, mais un incident de stockage devient un incident de jeu.

**RECOMMANDATION.** Option 1 ou 2 selon l'hébergement retenu, accès par un port
`PortraitStoragePort` dans `application/ports/`, une seule implémentation
S3-compatible, région UE, et dégradation vers le générique en lecture. La
dégradation respecte l'invariant 3 : l'absence d'image est déjà un cas nominal.

### DR-010-02 — Formats acceptés et validation réelle du contenu

**FAIT.** Rien dans le dépôt ne fixe un format de portrait.

Une extension et un `Content-Type` sont fournis par le client : ils ne prouvent rien.
La validation doit lire les premiers octets et confirmer le format par sa signature,
puis décoder réellement l'image ; un fichier qui ne se décode pas est refusé.

**Options de liste de formats.**

1. **JPEG et PNG.** Couvre l'essentiel des photos et exports, décodeurs éprouvés.
   Refuse les captures WebP produites par un navigateur récent.
2. **JPEG, PNG et WebP.** Couvre le parc réel, au prix d'un décodeur de plus.
3. **Ajouter AVIF.** Meilleure compression, mais support de décodage plus jeune et
   surface d'attaque moins éprouvée.
4. **Ajouter SVG.** À écarter explicitement, et la raison mérite d'être écrite : un SVG
   est un document exécutable, porteur de script et de références externes. L'accepter
   ferait du portrait un vecteur de XSS stocké, visible par tous les alliés d'un
   combat.

**Conséquences.** La validation par signature et décodage suppose une bibliothèque de
traitement d'image côté serveur — même décision de dépendance qu'en DR-010-04, et le
même arbitrage. Sans elle, seule l'extension serait contrôlée, ce que cette spec
interdit (invariant 5) et ce que `B01-ID-008` ne pourrait pas prouver.

**RECOMMANDATION.** Option 2 en entrée. SVG refusé par principe, pas par oubli. Le
format de sortie est traité en DR-010-04 et ne suit pas nécessairement le format
d'entrée.

### DR-010-03 — Taille maximale, en octets et en dimensions

**FAIT.** Aucune limite n'existe dans le dépôt. `back/src/config/env.validation.ts`
ne porte aucune limite de corps ; la limite implicite d'Express ne s'applique pas à un
`multipart`.

Trois limites distinctes sont nécessaires, et confondre les deux dernières est une
faille connue :

1. **taille du corps de la requête**, refusée avant lecture complète ;
2. **taille du fichier décodé** ;
3. **dimensions en pixels**, contrôlées **avant** décodage complet. Une image de
   30 000 × 30 000 pixels tient dans quelques kilo-octets compressés et demande des
   giga-octets à décompresser : c'est la *decompression bomb*, et une limite en octets
   seule ne l'arrête pas.

**Options pour l'ordre de grandeur.**

1. **Strict — 2 Mo, 4 000 × 4 000 pixels.** Suffisant pour un portrait, coût de
   traitement borné, refus visible d'une photo brute de smartphone récent.
2. **Confortable — 8 Mo, 8 000 × 8 000 pixels.** Accepte une photo brute sans rogner
   l'usage, au prix d'une mémoire de décodage plus élevée par requête concurrente.
3. **Redimensionnement côté client avant envoi.** Améliore le confort mais ne remplace
   aucune limite serveur : un client modifié ne redimensionne rien.

**Conséquences.** La limite en octets doit être appliquée **au niveau du transport**,
pas après avoir tout mis en mémoire. La limite en pixels doit être appliquée sur les
en-têtes de l'image avant décodage. Un dépassement répond `413` (§ Contrat HTTP), pas
`400` : le client doit pouvoir distinguer « trop gros » de « invalide ».

**Sous-décision — quota.** Faut-il borner le nombre de téléversements par personnage
ou par compte sur une fenêtre de temps ? Sans quota, un compte authentifié peut
remplir le stockage par remplacements successifs. Le `ThrottlerModule` est déjà
configuré (`THROTTLE_TTL_MS`, `THROTTLE_LIMIT`) et peut porter une limite resserrée
par décorateur, comme le font déjà les routes d'authentification.

**RECOMMANDATION.** Option 1, plus une limite de fréquence dédiée sur la route de
téléversement. Les valeurs exactes appartiennent à Charly ; aucune n'est inscrite dans
le code avant son arbitrage.

### DR-010-04 — Traitement d'image

**FAIT.** `back/package.json` ne contient aucune bibliothèque de traitement d'image.

Le traitement recouvre cinq gestes distincts, à trancher séparément :

- **re-encodage** — imposé par l'invariant 6 : le fichier servi est produit par le
  serveur, jamais l'octet reçu. Il neutralise les charges utiles cachées dans un
  conteneur d'image et referme les formats polyglottes ;
- **suppression des métadonnées EXIF** — un cliché de smartphone transporte des
  coordonnées GPS, une date et un modèle d'appareil. En combat, ce portrait est visible
  d'autres joueurs : conserver l'EXIF publierait la position du domicile d'un joueur à
  sa table. À l'inverse, l'orientation EXIF doit être **appliquée** avant d'être
  effacée, sinon les portraits arrivent couchés ;
- **redimensionnement** vers une taille de rendu bornée ;
- **recadrage** — le portrait de fiche et le pion n'ont pas le même cadre. Un pion est
  circulaire (`docs/REQUIREMENTS.md` : « Les pions ont une empreinte circulaire ») ;
- **vignette de pion** — dérivée séparée, plus petite, servie sur le plateau où
  plusieurs pions coexistent.

**Options de dérivées.**

1. **Une seule image normalisée**, carrée, utilisée par la fiche et par le pion, que le
   front rogne visuellement en cercle. Le plus simple ; le plateau télécharge une image
   surdimensionnée par pion.
2. **Deux dérivées — portrait et vignette de pion.** Deux objets, deux clés, deux
   suppressions à tenir cohérentes ; plateau nettement plus léger.
3. **Trois dérivées ou plus** (vignette de liste comprise). Gain marginal, coût de
   cohérence multiplié.

**Options de cadrage.**

1. **Recadrage automatique centré** en carré. Aucun geste utilisateur, décapite un
   sujet décentré.
2. **Recadrage choisi par le joueur** avant envoi, le serveur ne recevant que la zone
   retenue. Bien meilleur résultat ; ajoute une étape d'interface et une bibliothèque
   front.
3. **Aucun recadrage**, ratio conservé et image contenue dans son cadre. Jamais
   déformé, mais le pion circulaire devient impossible à cadrer correctement.

**Conséquence transversale.** Toutes ces options sauf « aucun traitement » — que
l'invariant 6 exclut — supposent une **bibliothèque de traitement d'image serveur**,
donc une dépendance nouvelle, donc une décision de Charly. Elle décode des données
hostiles : c'est le composant le plus exposé de la fonctionnalité, et son choix doit
tenir compte de son historique de sécurité et de sa maintenance.

**RECOMMANDATION.** Option 2 des dérivées, option 1 du cadrage pour le premier lot, EXIF
appliqué puis supprimé, sortie re-encodée dans un format unique. Le recadrage choisi
par le joueur est un incrément ultérieur, pas un prérequis.

### DR-010-05 — Politique de suppression

**FAIT.** `docs/REQUIREMENTS.md` inscrit les « médias » dans la purge de compte, et
`docs/TECHNICAL-PERSISTENCE-5B.md` décrit une purge « de tous les documents et blobs du
compte » exécutée par manifeste, par lots idempotents. Le portrait est donc déjà
concerné par un mécanisme décidé. Ce qui manque, c'est le comportement dans les quatre
situations ordinaires.

| Situation | Question ouverte |
|---|---|
| Portrait remplacé | L'ancien objet est-il supprimé immédiatement, ou conservé le temps d'un délai de sûreté ? |
| Personnage supprimé | La suppression d'un personnage par un MJ est-elle logique ou physique ? Le portrait la suit-il ? |
| Campagne purgée | Le portrait est un objet portant `campaignId` : il tombe avec la campagne — reste à décider **quand**. |
| Compte purgé | Le portrait d'un personnage **conservé dans le vivier** d'une campagne survivante appartient à un compte effacé. |

Le dernier cas est le seul réellement épineux, et il oppose deux exigences déjà
validées : le personnage reste disponible aux MJ après la purge de son joueur, mais
« les faits partagés ne gardent aucun lien vers le compte effacé ». Un portrait est un
média du compte purgé *et* une donnée du personnage conservé.

**Options pour le compte purgé.**

1. **Supprimer le portrait et retomber sur le générique.** Aligné sur la promesse
   d'effacement : plus aucun contenu produit par le compte ne subsiste. Le personnage
   conservé perd son visage.
2. **Conserver le portrait, désolidarisé de son auteur.** Le personnage reste
   utilisable tel quel, mais une image téléversée par une personne effacée continue
   d'exister. Si cette image est une photo, la purge ne tient pas sa promesse.
3. **Conserver seulement quand le personnage est assigné à un autre joueur.** Nuance
   séduisante, règle difficile à expliquer et à prouver.

**Options pour le remplacement et la suppression ordinaire.**

1. **Suppression immédiate** dans la foulée du commit MongoDB. Aucun résidu ; une
   erreur de suppression laisse un orphelin, traité par la réconciliation.
2. **Suppression différée** — l'objet est marqué et balayé après un délai. Permet
   d'annuler, mais introduit un état supplémentaire et une donnée personnelle qui
   survit à sa suppression apparente.
3. **Aucune suppression**, on empile. À écarter : coût qui croît sans borne, et
   contradiction directe avec la purge promise.

**Sous-décision — la suppression logique.** `docs/REQUIREMENTS.md` pose que « la
suppression ordinaire d'un compte ou d'une campagne est toujours logique ». Un objet de
stockage n'a pas d'équivalent de `deletedAt` : il existe ou non. Deux lectures
possibles — le fichier survit à la suppression logique et ne disparaît qu'à la purge
physique (cohérent avec la doctrine, mais conserve des données personnelles d'une
campagne « supprimée »), ou l'accès est coupé côté application pendant que l'objet
reste (cohérent aussi, à condition que **rien** ne serve d'URL directe hors
application — ce qui contraint DR-010-06).

**RECOMMANDATION.** Suppression immédiate au remplacement ; le portrait suit le sort
de son personnage ; option 1 pour le compte purgé, seule compatible avec la promesse
d'effacement irréversible ; la suppression logique coupe l'accès sans détruire l'objet,
et la purge physique le détruit par le manifeste 5B.

### DR-010-06 — Forme des URL, droits de lecture et projections

**FAIT.** `CharacterPoolProjectionSchema` déclare déjà
`portrait: z.string().url().nullable()`. La forme de cette URL n'est décidée nulle
part, et elle commande tout le modèle d'autorisation du média.

**Options.**

1. **URL publique non devinable** (clé aléatoire longue, objet lisible par quiconque
   connaît l'URL). Trivial à mettre en œuvre, cacheable par le navigateur, aucune
   expiration à gérer. Mais l'autorisation devient « connaître l'URL » : elle échappe
   au contrôle serveur exigé par le point 9 de `docs/REQUIREMENTS.md` — « toutes les
   autorisations sont vérifiées côté serveur » — et une URL fuitée par un partage
   d'écran ou un historique reste valable indéfiniment.
2. **URL signée à durée de validité courte**, produite à chaque projection. L'accès
   redevient une décision serveur, réévaluée à chaque lecture. Coût : une signature par
   portrait projeté, une durée à choisir, un cache navigateur cassé à chaque
   régénération, et un combat long qui doit rafraîchir ses URL.
3. **Proxy applicatif** — l'API sert elle-même les octets après contrôle des droits.
   Modèle d'autorisation le plus simple à raisonner et le seul qui referme
   complètement le trou de l'option 1 ; mais chaque affichage traverse l'API, et le
   bénéfice de bande passante du stockage objet disparaît.

**Sous-décision — durée de validité** (si option 2). Trop courte, l'URL expire au
milieu d'un combat ; trop longue, elle redevient une URL publique. La durée doit être
cohérente avec la fréquence de rafraîchissement des projections temps réel
(`TECHNICAL-REALTIME-5D.md`), et non choisie isolément.

**Qui lit quoi.** Indépendamment de la forme retenue, la cible fonctionnelle est déjà
fixée par les sources et ne se rediscute pas :

| Projection | Contenu portrait attendu | Fondement |
|---|---|---|
| Vivier (`pool`) | portrait ou générique, sans donnée privée additionnelle | `specs/007` ; le champ existe déjà au contrat |
| Fiche contrôlée (`controlled`) | portrait ou générique | `SF-002` |
| Projection MJ (`gameMaster`) | portrait ou générique de tous les personnages | Visibilité : « Tous les MJ consultent toutes les fiches » |
| Pion de combat | portrait ou générique **d'un allié** | Visibilité : nom, portrait, classe, niveau, PV |
| Non-membre de la campagne | rien : la ressource est masquée comme absente | `specs/007`, invariant 7 |

Le portrait est déjà visible dans le vivier, projection la plus ouverte : un portrait
n'est donc **jamais** une donnée privée au sein d'une campagne. Il l'est absolument
entre campagnes.

**Question ouverte induite par le pion.** « Le portrait d'un allié » n'interdit pas
qu'un adversaire soit visible par ailleurs — le combat oppose des personnages joueurs à
des monstres, pas à d'autres personnages joueurs. La règle est claire tant que les deux
camps ne contiennent pas de personnages joueurs ; le cas contraire relève de la spec de
combat, pas de celle-ci.

**RECOMMANDATION.** Option 2, durée alignée sur le rafraîchissement des projections,
avec un point de vigilance assumé : l'option 2 n'a de sens que si aucune URL signée
n'est mise en cache par une projection persistée. L'option 1 doit être écartée
explicitement plutôt que par défaut.

### DR-010-07 — Portrait générique exact

**FAIT.** Le visuel est décidé — fond blanc, silhouette de tête grise — et le fichier
n'existe pas. `front/public` n'existe pas ; `front/src/assets` non plus.

Restent à trancher : dimensions, format, provenance du fichier, et chemin de service.

**Options de provenance.**

1. **SVG versionné dans le dépôt**, écrit pour l'occasion. Aucune question de licence,
   net à toute taille, quelques centaines d'octets. Un SVG *produit par le projet* et
   servi comme asset statique n'a rien à voir avec un SVG *téléversé* refusé en
   DR-010-02 : le premier est du code relu, le second une donnée hostile.
2. **PNG versionné**, exporté une fois. Plus lourd, une résolution figée par usage,
   mais aucune ambiguïté de rendu.
3. **Asset d'une bibliothèque d'icônes tierce.** Licence à vérifier, dépendance
   supplémentaire, et le résultat ne correspondra pas exactement à « fond blanc,
   silhouette de tête grise ».

**Options de chemin de service.**

1. **Asset front.** Zéro appel réseau vers l'API, zéro coût de stockage, aucun risque
   de dégradation quand le stockage est indisponible. Le front doit alors savoir
   décider quand l'employer, donc le contrat doit distinguer « pas de portrait » de
   « portrait indisponible ».
2. **Servi par le même chemin que les portraits téléversés.** Le front n'a plus qu'un
   cas à traiter, `portrait` n'est jamais nul. Mais un incident de stockage
   supprimerait aussi le portrait par défaut, ce qui contredit la dégradation
   recommandée en DR-010-01, et le générique deviendrait une donnée d'exploitation
   alors qu'il n'appartient à personne (invariant 10).

**Conséquence sur le contrat.** Le champ existant est
`portrait: z.string().url().nullable()`. Avec l'option « asset front », `null` signifie
« aucun portrait téléversé » et le front rend le générique. La forme exacte du champ —
`null` contre un objet discriminé qui distinguerait aussi « indisponible » — dépend de
DR-010-01.

**RECOMMANDATION.** SVG versionné dans le dépôt, servi comme asset front, `portrait:
null` signifiant l'absence. Dimensions et teinte exacte de gris à fixer avec le
designer, en cohérence avec `docs/ui-design/Charte_graphique_v2.html`.

### DR-010-08 — Élargissement de la surface d'attaque

`CLAUDE.md` réserve à Charly « tout ce qui élargit la surface d'attaque ». Le
téléversement de fichier en est un cas d'école. Cette décision n'est pas un détail
d'implémentation : elle conditionne l'existence même de la fonctionnalité.

Ce que la fonctionnalité ajoute, sans exception :

- **un décodeur d'images exposé à des données hostiles.** C'est le risque principal :
  les décodeurs d'images sont une famille historique de vulnérabilités mémoire, et il
  s'exécute ici dans le processus API ;
- **une consommation de ressources pilotée par l'attaquant** : *decompression bomb*,
  téléversements concurrents, remplacements en boucle (DR-010-03) ;
- **un chemin de diffusion de contenu produit par un utilisateur** vers d'autres
  utilisateurs — le cœur du risque de XSS stocké si un format actif était accepté
  (DR-010-02) ;
- **des secrets d'infrastructure supplémentaires** dans la configuration, à ne jamais
  écrire dans le dépôt (DR-010-01) ;
- **une catégorie de données personnelles nouvelle** : une photo de visage, et l'EXIF
  qui l'accompagne (DR-010-04, DR-010-05) ;
- **au moins deux dépendances tierces** — SDK de stockage, bibliothèque d'image — dont
  la seconde traite l'entrée hostile.

**Options.**

1. **Refuser le téléversement.** Tous les personnages emploient le générique. Coût
   nul, risque nul, `B01-ID-008` reste ABSENTE et `SF-002` n'est pas satisfaite.
2. **Accepter avec les mesures de cette spec** : validation par signature, décodage
   borné, re-encodage systématique, EXIF supprimé, limites de taille et de fréquence,
   autorisation serveur à chaque lecture, stockage isolé de l'application.
3. **Accepter, mais sans dérivée ni traitement**, en se contentant de valider et de
   stocker. À écarter : c'est précisément la variante qui sert l'octet hostile au
   navigateur d'un autre joueur.

**RECOMMANDATION.** Option 2. Aucune ligne de code de téléversement avant un accord
explicite de Charly, tracé dans un `DEC-0xx` dédié : la décision engage la sécurité du
produit, pas seulement un lot.

### DR-010-09 — Modération d'un portrait

Le portrait est visible des autres joueurs d'une campagne. Rien dans `PRODUCT.md`,
`REQUIREMENTS.md` ni les `DECISIONS/` ne prévoit de signalement, de retrait, ni de
contrôle de contenu. **La documentation est muette : cette spec ne tranche pas seule.**

**Options.**

1. **Rien.** La campagne est un groupe restreint et invité ; le MJ règle hors ligne.
   Aucun mécanisme, aucun coût. Reste qu'un joueur peut imposer une image à sa table
   sans qu'aucun outil ne permette de la retirer.
2. **Retrait par le MJ.** Tout MJ actif peut retirer le portrait d'un personnage de sa
   campagne ; celui-ci retombe sur le générique. Cohérent avec l'autorité du MJ déjà
   posée par `DEC-002` et `DEC-003`, et peu coûteux : c'est la route de suppression,
   ouverte à un second rôle. Le joueur peut téléverser à nouveau — il faut donc décider
   si le retrait pose un verrou.
3. **Signalement vers le responsable de plateforme.** Introduit une file de
   modération, un rôle et un parcours qui n'existent pas ; `docs/REQUIREMENTS.md`
   précise que l'administrateur « n'obtient pas automatiquement accès au contenu des
   campagnes ». Disproportionné au MVP.
4. **Analyse automatique de contenu.** Service tiers, coût, faux positifs, et envoi
   des images d'utilisateurs à un tiers. Hors sujet au MVP.

**RECOMMANDATION.** Option 2, sans verrou au premier lot : le MJ retire, le joueur peut
resoumettre, et une récidive se règle par l'exclusion de la campagne — mécanisme qui
existe déjà. Si Charly retient l'option 1, l'écrire explicitement comme une décision,
et non la laisser comme un oubli.

### DR-010-10 — Où vit le code du portrait

Question de rangement, mais elle engage le `Protocole de déplacement` de `CLAUDE.md` :
remonter du code d'un module vers `kernel/` est une décision explicite, dans un commit
dédié.

**Options.**

1. **Port et adaptateur dans le module `characters`.** Le plus direct, conforme au
   protocole (« un module ne récupère pas du code partagé, il définit son propre
   port »). Quand les images d'objets arriveront, le module `items` définira son
   propre port et une seconde implémentation existera, ou bien l'adaptateur remontera
   au `kernel` par un commit dédié — ce qui est exactement le protocole.
2. **Adaptateur dans `kernel/infrastructure/` dès maintenant.** Anticipe le second
   usage, mais partage une abstraction sur un seul cas connu, et transforme la
   décision de périmètre en dette déguisée.
3. **Module `media` dédié.** Plus lourd qu'un port, et sans exigence fonctionnelle
   propre à porter tant que les images d'objets ne sont pas spécifiées.

**RECOMMANDATION.** Option 1.

## Le portrait et le verrou d'acceptation

**FAIT.** `SF-002` et `DEC-003` rangent le portrait parmi les champs qui restent
modifiables après acceptation, aux côtés de la description, de l'âge et du poids ; nom,
alignement, espèce/lignée, historique et taille deviennent immuables.

**Pourquoi c'est cohérent.** Le verrou d'acceptation protège ce que le MJ a examiné et
sur quoi il s'est engagé : ce qui produit des conséquences de règles. Le nom identifie
la fiche dans l'historique de la table ; l'espèce, l'historique et la taille alimentent
directement les dérivés calculés — vitesse, vision, traits, empreinte du pion. Le
portrait ne produit **aucun dérivé** : le changer ne modifie ni un score, ni une
maîtrise, ni un jet. Le figer n'apporterait rien au MJ et empêcherait un joueur de
corriger une image mal cadrée pour toute la durée d'une campagne.

**Conséquence sur le versionnement.** Un changement de portrait **ne crée pas de
nouvelle version examinable**. Précisément :

1. il ne fait pas repasser la fiche de `ACCEPTÉE` à `SOUMISE` ;
2. il ne produit pas de snapshot numéroté de soumission — `specs/009` réserve ces
   snapshots aux versions examinées par le MJ ;
3. il ne réinitialise ni le dernier motif de refus, ni l'historique des décisions de
   validation ;
4. il reste néanmoins une **mutation du personnage** : il incrémente la révision de
   l'agrégat, passe par le filtre de révision attendue, et produit une entrée d'audit
   fonctionnel comme toute autre mutation (`DEC-016`). Deux téléversements concurrents
   ne peuvent donc pas se croiser silencieusement.

Le point 4 mérite d'être explicite, car il est contre-intuitif : « hors du verrou
d'acceptation » ne veut pas dire « hors de la concurrence optimiste ». La différence
est que la révision protège l'écriture, tandis que la version soumise protège la revue.

**HYPOTHÈSE — à confirmer par la spec de combat.** Un portrait changé pendant un
combat en cours se propage aux pions par le canal temps réel existant. Rien ne
justifierait de le figer, mais `TECHNICAL-REALTIME-5D.md` ne mentionne aucun événement
de média. Cette hypothèse ne doit pas guider de code définitif.

## Contrat HTTP et statuts

Le contrat ci-dessous est **conditionnel** : sa forme de corps dépend de DR-010-02,
DR-010-03 et DR-010-04, et sa forme d'URL de DR-010-06. Il fixe ce qui ne dépend
d'aucune décision ouverte — routes, autorisation, statuts, cas d'erreur.

Les routes prolongent le contrôleur existant
(`back/src/modules/characters/presentation/character.controller.ts`, préfixe
`campaigns/:campaignId/characters`).

| Route | Rôle | Acteur autorisé |
|---|---|---|
| `PUT :characterId/portrait` | téléverse ou remplace le portrait | joueur assigné, créateur, tout MJ actif |
| `DELETE :characterId/portrait` | retire le portrait, retour au générique | mêmes acteurs (retrait MJ : DR-010-09) |

**Choix de la méthode.** `PUT` et non `POST` : le portrait est une ressource unique et
l'opération est idempotente en intention — remplacer deux fois par le même fichier
laisse le même état. Le corps est un `multipart/form-data` à un seul champ fichier.

**Idempotence.** Contrairement à la création (`specs/009`), la commande de portrait ne
porte **pas** d'`Idempotency-Key`. Une clé d'idempotence protège contre la duplication
d'une entité ; ici, un rejeu ne peut produire qu'un remplacement par le même contenu,
et l'agrégat est protégé par sa révision. **DÉCISION REQUISE mineure** si Charly
préfère l'uniformité de l'enveloppe de commande : le coût est un reçu durable et une
empreinte d'intention qui devrait alors inclure le contenu binaire, ce qui est
inhabituel.

**Concurrence.** La commande porte la révision attendue du personnage, comme
`CharacterReviewCommandSchema` le fait déjà pour la revue.

### Statuts

| Cas | Statut | Note |
|---|---|---|
| Téléversement accepté | `200` | Corps : personnage projeté avec sa nouvelle révision et son portrait |
| Retrait accepté | `200` | Corps : même projection, portrait absent |
| Retrait alors qu'aucun portrait n'existe | `200` | Idempotent : l'état visé est atteint |
| Non authentifié | `401` | Garde existante |
| Membre de la campagne sans droit sur ce personnage | `403` | Ni assigné, ni créateur, ni MJ |
| Personnage d'une autre campagne, ou inexistant | `404` | Masqué comme absent (invariant 7) |
| Corps absent, champ manquant, plusieurs fichiers | `400` | |
| Révision attendue absente ou mal formée | `400` | |
| Révision attendue périmée | `409` | Aucune mutation |
| Type MIME hors liste | `415` | Décidé par DR-010-02 |
| Extension ou MIME conformes mais contenu non conforme | `415` | Le contenu fait foi (invariant 5) |
| Fichier au-delà de la limite d'octets | `413` | Refusé sans lecture complète |
| Dimensions au-delà de la limite de pixels | `413` | Contrôlé avant décodage complet |
| Image formellement valide mais indécodable | `422` | Distinct de `415` : le format est reconnu, l'image est cassée |
| Fréquence de téléversement dépassée | `429` | DR-010-03, sous-décision quota |
| Stockage objet indisponible | `503` | Aucune référence écrite en base (§ suivante) |
| Écriture MongoDB échouée après écriture de l'objet | `500` | L'objet devient orphelin, réconcilié (§ suivante) |

**Note sur `415` et `422`.** Les séparer n'est pas de la coquetterie : `415` dit
« ce type n'est pas accepté ici », `422` dit « ce type est accepté mais ce fichier est
inexploitable ». L'interface ne donne pas le même conseil dans les deux cas.

## Persistance et cohérence

### Ce qui est persisté dans MongoDB

Le personnage porte une **référence**, jamais l'image. La référence doit permettre de
reconstruire une URL, de supprimer l'objet, et de détecter un désaccord :

- la clé de l'objet dans le stockage ;
- les clés des dérivées produites (DR-010-04) ;
- le format de sortie et les dimensions retenues ;
- l'empreinte du contenu produit, qui sert à la réconciliation et évite un
  re-téléversement identique ;
- l'instant du téléversement et son auteur.

Aucune URL n'est persistée : une URL signée expire, et une URL persistée deviendrait une
autorisation gelée dans la base.

### L'atomicité est impossible, et il faut choisir de quel côté pencher

Écrire un objet hors MongoDB et une référence dans MongoDB ne peut pas être atomique :
l'enveloppe transactionnelle de `DEC-016` ne couvre que MongoDB. Deux ordres sont
possibles, et ils échouent différemment.

**Ordre retenu — l'objet d'abord, la référence ensuite.**

1. valider le fichier — signature, dimensions, décodage ;
2. produire les dérivées et les écrire dans le stockage sous des clés **nouvelles**,
   jamais en écrasant les clés existantes ;
3. écrire la référence dans MongoDB, dans une transaction qui porte aussi le filtre de
   révision, l'audit fonctionnel et le fait d'outbox ;
4. **après commit seulement**, supprimer les objets de l'ancien portrait.

**Pourquoi cet ordre.** L'ordre inverse — référence d'abord — produirait une référence
qui désigne un objet absent, ce que l'invariant 8 interdit : la fiche afficherait une
image cassée. L'ordre retenu ne peut produire que l'anomalie inverse, un objet sans
référence, invisible de tous et rattrapable.

**Anomalies possibles, et ce qu'elles coûtent.**

| Anomalie | Cause | Visible ? | Traitement |
|---|---|---|---|
| Objet orphelin | Commit MongoDB échoué après écriture de l'objet, ou étape 4 échouée | Non | Balayage de réconciliation |
| Objet orphelin | Client qui abandonne entre l'étape 2 et l'étape 3 | Non | Idem |
| Référence orpheline | Objet supprimé hors application | Oui, image absente | Dégradation vers le générique (DR-010-01) + alerte |

L'écriture sous une clé nouvelle à l'étape 2 est ce qui rend l'échec inoffensif : un
commit qui échoue laisse l'ancien portrait intact et parfaitement servi. Écraser la
clé existante rendrait l'échec destructeur.

### Réconciliation

Un balayage périodique compare les clés du stockage aux références en base et supprime
les objets sans référence dont l'âge dépasse un délai de sûreté — délai qui doit être
supérieur à la durée maximale d'un téléversement, sans quoi le balayage supprimerait
un objet en cours d'écriture.

**DÉCISION REQUISE incluse dans DR-010-05.** Trois paramètres restent à fixer :
fréquence du balayage, délai de sûreté, et déclencheur — tâche planifiée, commande
d'exploitation, ou consommation de l'outbox. `docs/TECHNICAL-PERSISTENCE-5B.md` décrit
déjà un mécanisme de purge par manifeste et par lots idempotents : la réconciliation
doit s'y adosser plutôt que d'inventer un second ordonnanceur.

## Projections et isolation

- Le portrait suit la règle d'isolation générale : lecture par `campaignId` et
  identifiant, un identifiant extérieur masqué comme absent (`specs/007`).
- Les trois projections existantes reçoivent le portrait. `pool` le porte déjà au
  contrat ; `controlled` et `gameMaster` en héritent par extension.
- **FAIT à corriger par le futur lot** :
  `back/src/modules/characters/application/character-list.mapper.ts:54` renvoie
  `portrait: null` en dur, pour les trois projections. Ce n'est pas une décision, c'est
  une valeur d'attente.
- Le pion de combat reçoit la dérivée de pion — ou le portrait unique, selon
  DR-010-04 — pour un **allié**. La règle de camp appartient à la spec de combat.
- Aucune projection ne rend un état intermédiaire : tant que le commit de l'étape 3
  n'a pas eu lieu, le portrait projeté reste l'ancien.
- Le portrait ne figure dans aucun journal de sécurité : `security_events` interdit
  tout payload métier (`docs/TECHNICAL-PERSISTENCE-5B.md`). L'audit fonctionnel
  enregistre le fait, jamais le contenu.

## Cas limites Given/When/Then

1. Étant donné un personnage sans portrait, quand sa fiche et son pion sont projetés,
   alors les deux emploient le visuel générique exact — fond blanc, silhouette de tête
   grise.
2. Étant donné une création de personnage sans fichier, quand elle est commandée,
   alors elle réussit ; aucune étape de portrait ne bloque le parcours.
3. Étant donné un fichier nommé `portrait.png` dont le contenu est un exécutable, quand
   il est téléversé, alors il est refusé sur son contenu et rien n'est écrit.
4. Étant donné un SVG contenant un script, quand il est téléversé, alors il est refusé
   sur son type.
5. Étant donné une image de quelques kilo-octets déclarant 30 000 × 30 000 pixels, quand
   elle est téléversée, alors elle est refusée avant décodage complet et la mémoire du
   processus ne croît pas.
6. Étant donné une photo portant des coordonnées GPS et une orientation EXIF, quand
   elle est acceptée, alors l'image servie est correctement orientée et ne contient
   aucune métadonnée EXIF.
7. Étant donné un personnage avec portrait, quand un nouveau portrait est téléversé,
   alors la fiche montre le nouveau, l'ancien objet est supprimé, et à aucun instant la
   fiche ne montre une image absente.
8. Étant donné un téléversement dont le commit MongoDB échoue, quand la commande se
   termine, alors le personnage garde son portrait précédent et l'objet écrit devient
   un orphelin invisible.
9. Étant donné un objet orphelin plus ancien que le délai de sûreté, quand la
   réconciliation s'exécute, alors il est supprimé et aucun portrait référencé ne l'est.
10. Étant donné deux téléversements concurrents sur le même personnage, quand tous deux
    portent la même révision attendue, alors un seul est accepté et l'autre répond
    `409` sans mutation.
11. Étant donné une fiche `ACCEPTÉE`, quand son portrait est remplacé, alors elle reste
    `ACCEPTÉE`, aucun snapshot de soumission n'est produit, et la révision est
    incrémentée.
12. Étant donné une fiche `ACCEPTÉE`, quand son nom est modifié, alors la modification
    est refusée : le portrait est une exception, pas une brèche.
13. Étant donné un membre de la campagne B, quand il demande le portrait d'un
    personnage de la campagne A dont il connaît l'identifiant, alors la ressource est
    masquée comme absente.
14. Étant donné un personnage supprimé, quand la suppression est commise, alors son
    portrait suit la politique de DR-010-05 et aucune projection ne le référence plus.
15. Étant donné une purge de compte, quand le manifeste s'exécute, alors les portraits
    téléversés par ce compte sont traités selon DR-010-05, et le générique n'est jamais
    supprimé.
16. Étant donné un stockage objet indisponible, quand une fiche est lue, alors elle
    s'affiche avec le générique ; quand un téléversement est tenté, alors il répond
    `503` sans écrire de référence.
17. Étant donné un joueur non assigné et non MJ, quand il tente de changer le portrait
    d'un personnage du vivier, alors la commande répond `403`.

## Critères d'acceptation

Les trois premiers reprennent ceux déjà arrêtés par `B01-ID-008` ; ils qualifient le
passage de cette règle de **ABSENTE** à **CONFORME**.

1. **Création sans fichier réussie avec le visuel exact.** Un personnage créé sans
   portrait affiche le générique décidé, et le même sur la fiche et sur le pion.
2. **Téléversement visible sur fiche et sur pion.** Un portrait accepté apparaît sur
   les deux surfaces, sans second téléversement.
3. **Remplacement autorisé après acceptation.** Une fiche `ACCEPTÉE` accepte un
   nouveau portrait, et refuse toujours un changement de nom.

Ajoutés par cette spec :

4. Un fichier dont le contenu ne correspond pas à son extension est refusé, prouvé par
   un test qui téléverse un contenu non-image portant une extension d'image.
5. Aucune donnée EXIF ne survit au traitement, prouvé sur un fichier d'entrée qui en
   contient.
6. Les limites d'octets et de pixels sont appliquées séparément, chacune prouvée par
   son propre cas de refus.
7. Un échec de commit ne laisse ni portrait modifié, ni référence écrite ; l'orphelin
   produit est supprimé par la réconciliation.
8. Un changement de portrait n'altère ni l'état de validation, ni la version soumise,
   ni l'historique des décisions du MJ.
9. Le portrait respecte l'isolation par campagne dans les quatre projections.
10. Le parcours complet — création sans portrait, téléversement, remplacement,
    retrait — est prouvé de bout en bout contre un vrai serveur, comme les dix cas de
    `specs/009` le sont par `e2e/bruno`.

## Récapitulatif des DÉCISION REQUISE

| Réf. | Objet | Bloque |
|---|---|---|
| DR-010-01 | Fournisseur, région, secrets, comportement en indisponibilité | Toute la fonctionnalité |
| DR-010-02 | Formats acceptés et validation par le contenu | Contrat HTTP, sécurité |
| DR-010-03 | Limites d'octets, de pixels, et quota de fréquence | Contrat HTTP, sécurité |
| DR-010-04 | Traitement, dérivées, cadrage, EXIF | Persistance, projections, pion |
| DR-010-05 | Suppression : remplacement, personnage, campagne, compte purgé, réconciliation | Persistance, conformité RGPD |
| DR-010-06 | Forme des URL, durée de validité, droits de lecture | Projections, contrat |
| DR-010-07 | Portrait générique : dimensions, format, provenance, chemin | `B01-ID-008` critère 1 |
| DR-010-08 | Accord sur l'élargissement de la surface d'attaque | Toute la fonctionnalité |
| DR-010-09 | Modération : retrait par le MJ, signalement, ou rien | Contrat HTTP |
| DR-010-10 | Emplacement du port et de l'adaptateur | Plan technique |

DR-010-08 est un prérequis des neuf autres : tant qu'il n'est pas tranché, aucun plan
ne doit être ouvert.

## Fichiers qu'un futur lot devra toucher

Inventaire, pas modification. Aucun de ces fichiers n'est modifié par cette spec.

**Contrat partagé**

- `shared/src/character-schema.ts` — champ portrait des trois projections, schéma de
  la commande de téléversement, schéma de la référence persistée ;
- `shared/src/character-schema.test.ts` — isolation du portrait par projection ;
- `shared/src/index.ts` — exports.

**Back — configuration**

- `back/src/config/env.validation.ts` — variables du stockage objet, sans valeur par
  défaut pour un secret, conformément au commentaire déjà présent en tête du fichier ;
- `back/src/config/configuration.ts` — namespace dédié.

**Back — module `characters`**

- `application/ports/` — nouveau port de stockage de média ;
- `application/use-cases/` — téléversement et retrait ;
- `application/character-list.mapper.ts` — remplacer le `portrait: null` en dur ;
- `application/character.mapper.ts`, `application/character-sheet.mapper.ts`,
  `application/character-build-detail.mapper.ts` — exposition du portrait ;
- `application/realtime-projection.ts` — propagation vers le pion ;
- `domain/character.ts` — référence de portrait sur l'agrégat, mutation hors verrou
  d'acceptation ;
- `domain/character.errors.ts` — erreurs de portrait ;
- `infrastructure/persistence/character.schema.ts` — champs de référence ;
- `infrastructure/` — adaptateur de stockage objet ;
- `presentation/character.controller.ts` — les deux routes ;
- `characters.module.ts` — câblage du port ;
- `testing/character.fixture.ts` — fixture avec et sans portrait ;
- les tests unitaires correspondants, écrits par le testeur.

**Back — kernel et commun**

- `back/.dependency-cruiser.cjs` — si l'adaptateur introduit une frontière nouvelle ;
- `back/src/common/filters/domain-exception.filter.ts` — correspondance des nouveaux
  statuts `413`, `415`, `422`.

**Front**

- asset du portrait générique — le dossier de destination n'existe pas encore ;
- `front/src/pages/campaigns/detail/characters/_internal/views/character-row.view.tsx` ;
- `front/src/pages/campaigns/detail/characters/builder/_internal/` — étape facultative
  de portrait, hooks associés ;
- fiche de personnage et futur plateau de combat ;
- tests Vitest correspondants.

**Preuves de bout en bout**

- `e2e/bruno` — requêtes de téléversement, remplacement, retrait et cas d'erreur ;
- `front/e2e/character-creation.spec.ts` — création sans portrait, puis téléversement.

**Documentation**

- `docs/rules/dnd-2024/B01-LEVEL-ONE-CREATION.md` — état de `B01-ID-008` ;
- `docs/TRACEABILITY.md` — exigence, code et tests ;
- `docs/DECISIONS/` — un `DEC` nouveau portant les arbitrages DR-010-01 à DR-010-10 ;
- `docs/TECHNICAL-ARCHITECTURE-5A.md` et `docs/TECHNICAL-PERSISTENCE-5B.md` — la
  décision ouverte se réduit aux seules images d'objets ;
- `specs/009-level-one-character-creation.md` — la ligne « téléversement de portrait
  jusqu'à définition du fournisseur » de son hors-périmètre pointera vers cette spec.

**Jamais touchés** : `.env`, seeds, migrations MongoDB, CI.
