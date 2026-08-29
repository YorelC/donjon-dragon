# Audit qualité du back — complément du 29 août 2026

## Objet

Seconde lecture de `back/src`, un jour après `AUDIT-QUALITE-BACK-2026-08-28.md`.
Deux questions : cet audit tient-il, et qu'a-t-il laissé de côté sur les fonctions
coûteuses, le nombre de boucles et d'appels Mongo, et la sécurité.

Ce document **ne remplace pas** celui du 28/08. Il le recoupe, puis le complète.
Pour tout constat déjà couvert là-bas, il y renvoie sans le réécrire.

Audit statique en lecture seule. Le code n'a pas été modifié pendant l'analyse ;
les corrections appliquées ensuite sont récapitulées en fin de document, section
« État des corrections au 29 août 2026 ».

## Recoupement de l'audit du 28 août

Tous les constats ont été repointés dans le code. **Les preuves citées visent les
bonnes lignes, les scénarios tiennent, et les coûts en nombre de requêtes sont
justes.** Les mesures automatisées donnent exactement les mêmes résultats qu'hier.

| Constat | Repointé | Preuve relue le 29/08 |
|---|---|---|
| SEC-01 `appOrigin` fourni par le client | oui | `shared/src/user-schema.ts:66-72`, `register.use-case.ts:40,57` |
| SEC-02 rotation de refresh non atomique | oui | `refresh-tokens.use-case.ts:82-95`, `mongo-refresh-token.repository.ts:25` |
| PERF-01 N+1 liste de campagnes | oui | `mongo-campaign-persistence.repository.ts:46-51,86-99` |
| PERF-02 N+1 liste d'invitations | oui | `list-campaign-invitations.use-case.ts:41-58` |
| COR-01 upsert sans révision | oui | `mongo-character.repository.ts:22` contre `:85-90` |
| COR-02 consommation du token email | oui | `verify-email.use-case.ts:42-48` |
| PERF-03 listes non bornées | oui | quatre repositories concernés, sans `limit` |
| PERF-04 index friendship incomplet | oui | `friendship.schema.ts:26-31` contre `mongo-friendship.repository.ts:96-101` |
| PERF-05 regex de recherche + `skip` | oui | `mongo-user.repository.ts:45-59` |
| MAINT-01 onze `@Param` non validés | oui | `campaign.controller.ts:106,118,135,150,165,219` ; `friendship.controller.ts:63,74,85,129` ; `bestiary.controller.ts:30` |
| MAINT-02 gardes rouges | oui | mêmes 5 erreurs ESLint, même cycle, même warning |
| Tests : 776 passés, 7 ignorés | oui | `pnpm --filter back test` : 78 fichiers passés, 2 ignorés |

Les « Points positifs vérifiés » se recoupent également : guards par défaut, cookies
`httpOnly`, CSRF signé à comparaison constante, secrets hashés en SHA-256, index
TTL sur les deux collections de jetons, `.lean()` sur les lectures inspectées.

Ce recoupement porte sur ce qui est vérifiable en lecture statique. Comme l'audit
du 28/08 le dit lui-même, les plans de requête et les comportements concurrents
n'ont été mesurés ni là-bas ni ici : sur ces deux terrains, les deux documents
émettent des hypothèses, pas des mesures.

**L'audit reste incomplet.** Quatorze constats manquent, dont un écart à une
spécification normative et un défaut structurel qui explique une partie des N+1.

## Constats manquants — temps réel

### [Élevé] NEW-14 — Les audiences de campagne ne sont jamais résolues, contrairement à la spécification

**C'est le constat le plus lourd de ce complément.** Il ne relève pas de la
performance mais de la conformité : le code produit des messages qu'il ne sait pas
livrer, alors que le document normatif exige leur résolution.

**Ce que la spécification impose** — `TECHNICAL-REALTIME-5D.md`

- `:23-24`, principe 4 : « Toute audience dépendant d'un rôle ou d'une adhésion est
  recalculée depuis les données autoritaires à chaque émission. »
- `:67-72`, vocabulaire **fermé** : `campaign-members` → « adhésions actives relues
  depuis la campagne » ; `campaign-game-masters` → « adhésions MJ actives relues
  depuis la campagne ».
- `:153-160`, tranche verticale, point 6 : « étendre ensuite aux invitations et
  campagnes ».

**Ce que le code fait**

`realtime-outbox.relay.ts:43-46` — `RESOLVABLE_AUDIENCES` ne contient que
`friendshipParticipants` et `targetUser`. Les deux audiences de campagne en sont
explicitement exclues, et le commentaire `:36-42` assume le choix : « les résoudre
demande une lecture d'adhésion que la 5D n'a pas spécifiée ».

Or la 5D **la spécifie**, à la ligne 67-72, en toutes lettres. Le commentaire
décrit une spécification qui n'est pas celle du dépôt.

**Impact**

Toute mutation dont l'audience est `campaign-members` ou `campaign-game-masters`
n'est **jamais diffusée**. `mongo-character-assignment.repository.ts:41` écrit
justement ses messages avec `AUDIENCE = OUTBOX_AUDIENCE_POLICY.campaignMembers` :
les affectations de personnages ne parviennent donc à aucun client en temps réel.
Les messages ne sont pas perdus — ils restent `pending`, indéfiniment — mais la
fonctionnalité est absente et son absence est silencieuse.

Note : le principe 6 de la 5D (`:26`) prévoit qu'« une politique d'audience inconnue
ne diffuse rien et termine en quarantaine ». Ces politiques ne sont pas inconnues,
elles sont connues et non implémentées : elles échappent donc aussi au filet de la
quarantaine, qui les aurait rendues visibles.

**Recommandation**

Implémenter le résolveur d'audience de campagne prévu par la 5D — une lecture
d'adhésions au moment de l'émission, conformément au principe 4. Tant qu'il
n'existe pas, ces messages devraient au minimum être **visibles** : un compteur ou
une alerte sur les `pending` non résolvables, pour qu'un écart fonctionnel ne se
manifeste pas seulement par « l'interface ne se met pas à jour ».

`CLAUDE.md` rappelle que `docs/` décrit la cible normative et que le code décrit
seulement l'état actuel. Ici les deux divergent, et c'est le code qui a tort.

**Corrigé le 29/08 — résolveur back seul.** Le relais résout désormais les quatre
politiques par une table fermée : les deux audiences portées par l'enveloppe se
lisent, les deux audiences de campagne se relisent au moment d'émettre, via un
port implémenté par le seul fichier de `realtime` qui connaît `campaigns`. Un
membre exclu disparaît donc de la diffusion suivante, conformément au principe 4.

Le vocabulaire navigateur fermé (`:104-113`) n'a **pas** été touché : l'élargir
reste une décision. Conséquence directe et voulue : `character.assigned` et
`character.unassigned` n'y ont aucune ressource, ils passent donc de `pending`
silencieux à **`quarantined` avec une trace d'erreur**. La fonctionnalité reste
absente ; son absence est désormais bruyante. Elle le restera tant que la
question du vocabulaire ne sera pas tranchée.

### [Faible à Moyen, à mesurer] NEW-03 — Polling fixe sans backoff, et deux requêtes par message

**Preuves** — `realtime-outbox.relay.ts`

- `:31,89` — `setInterval` à **500 ms**, **sans backoff**. Le timer s'arrête bien à
  la fermeture explicite de l'application (`:93-95`), mais rien ne l'espace quand
  l'outbox est vide : à vide, le coût plancher est de **deux requêtes par seconde**,
  dont une écriture (`findOneAndUpdate`).
- `:118-122,97-102` — `drainBatch` réclame les messages **un par un** : `claimOne`
  (1 requête) puis `updateStatus` (1 requête) = **2 allers-retours par message**,
  jusqu'à 40 par cycle de poll (`MAX_MESSAGES_PER_POLL = 20`).
- `:173-182` — `claimableFilter` filtre sur `deliveryChannel` et `audiencePolicy`,
  **absents de l'index** `{ status, availableAt, leaseUntil }`
  (`outbox-message.schema.ts:66`), et combine un `$or` avec
  `sort: { availableAt: 1 }`.

**Pourquoi ce n'est pas classé plus haut**

`TECHNICAL-REALTIME-5D.md:165` pose que « le pilote reste mono-instance et sans
Redis ». Le coût à vide est donc borné à deux requêtes par seconde pour
l'installation entière, pas par réplique. C'est mesurable et probablement
supportable ; ça mérite une mesure, pas une correction réflexe.

Le désalignement entre l'index et le filtre est une lecture directe du code. La
conséquence sur le plan retenu ne l'est pas : **plan potentiellement sous-optimal, à
confirmer par `explain('executionStats')`.** Ni le nombre de documents examinés ni
la présence d'un tri en mémoire ne sont démontrés ici.

**Recommandation**

Le **backoff** est simple et vaut indépendamment du plan : espacer le poll quand un
cycle ne rend aucun message.

La **réclamation par lot n'est pas une optimisation triviale.** MongoDB n'offre pas
de `findManyAndUpdate` atomique avec tri et limite : il faudrait un protocole de
claim par propriétaire de bail, une transaction, ou une autre stratégie. C'est une
décision de conception, à instruire séparément — pas un correctif.

L'index, lui, ne se choisit qu'après le `explain`.

### [Moyen] NEW-04 — L'outbox n'est ni purgée, ni bornée en tentatives, ni observée

**Preuves**

- `outbox-message.schema.ts:66-67` — deux index, **aucun TTL**, alors que
  `refresh-token.schema.ts:22` et `email-verification-token.schema.ts:17` en posent
  un correctement. Les messages `delivered` et `quarantined` s'accumulent sans fin.
- `realtime-outbox.relay.ts:124-137,162-170` — aucun compteur de tentatives. Un
  message dont la livraison échoue reste `processing`, son bail expire au bout de
  30 s (`LEASE_DURATION_MS = 30_000`), `claimableFilter` le reprend — **en boucle,
  sans plafond ni dead-letter**.

**Deux gisements de `pending` permanents**

1. **Les audiences de campagne non résolues** — voir NEW-14. C'est un écart
   fonctionnel avant d'être un problème de volume.
2. **Les demandes de courriel d'invitation.**
   `mongo-campaign-invitation-envelope.repository.ts:189-193` écrit un
   `campaign.invitation.email-requested` sur le canal `email`, tandis que
   `claimableFilter` ne réclame que le canal `realtime`.

   **Cette production est conforme.** `TRACEABILITY.md:16` acte le périmètre :
   « la demande de courriel par outbox ; livraison du courriel et contenu
   personnalisé restent hors de cet incrément ».
   `specs/005-campaign-invitation-lifecycle.md:27,169` pose la même distinction —
   la création atomique de la demande est dans l'incrément, « l'envoi réel du
   courriel, fournisseur ou worker » n'y est pas. `GAP-ANALYSIS.md:59` répertorie
   l'absence, et `TECHNICAL-REALTIME-5D.md:87` décrit le canal.

   Ce qui n'est cadré **nulle part**, en revanche : la rétention de ces enveloppes,
   leur observabilité, et la procédure de reprise le jour où le worker existera.
   Elles peuvent donc s'accumuler indéfiniment en `pending`, sans que personne ne
   sache combien ni depuis quand.

**Le constat propre à ce complément**

Ni l'écart fonctionnel (NEW-14) ni l'absence de worker courriel ne sont des
découvertes : le premier contredit la 5D, la seconde est documentée et assumée.
Ce qui manque, c'est le **garde-fou opérationnel** autour du backlog qu'ils
produisent : aucune rétention, aucune alerte, aucune reprise, aucun plafond de
tentatives.

**DÉCISION REQUISE — rétention de l'outbox**

| Option | Conséquence |
|---|---|
| Index TTL sur `updatedAt`, filtré aux statuts terminaux | Simple, purge automatique. Perd l'historique de **livraison** — l'audit métier, lui, vit dans sa propre collection (`functional-audit-entry.schema.ts`) et n'est pas concerné. |
| Purge périodique par script, avec archivage | Garde l'historique de livraison. Ajoute un job à exploiter et à surveiller. |
| Aucune purge | Croissance illimitée d'une collection écrite à chaque mutation. |

**DÉCISION REQUISE — abandon après échec**

| Option | Conséquence |
|---|---|
| Compteur de tentatives + statut `failed` après N | Borne la boucle, mais **modifie le contrat de livraison** posé par la 5D (« une notification peut être livrée plusieurs fois »), qui suppose aujourd'hui des tentatives illimitées. Exige de définir N, une **alerte**, et une **procédure de reprise manuelle** des messages terminaux. |
| Backoff exponentiel sur `availableAt`, sans plafond | Amortit la charge d'un incident, préserve le contrat. Ne termine jamais. |
| Statu quo | Un message toxique consomme une place de lot toutes les 30 s, indéfiniment, sans que rien ne le signale. |

Dans les trois cas, une **observabilité minimale** des `pending` par canal et par
politique d'audience est le préalable : sans elle, aucune de ces décisions ne peut
s'appuyer sur un chiffre.

### [Moyen] NEW-05 — L'arrêt du relais n'est pas déclenché par les signaux système

**Preuve**

`main.ts:11-41` n'appelle pas `app.enableShutdownHooks()`. Or
`RealtimeOutboxRelay` implémente `OnApplicationShutdown`
(`realtime-outbox.relay.ts:75,93-95`) pour libérer son `setInterval`.

Le hook n'est pas mort : un `app.close()` explicite le déclenche — les tests s'en
servent. Ce qui manque, c'est son déclenchement sur **SIGTERM et SIGINT**, qui
suppose `enableShutdownHooks()` : les écouteurs de signaux sont désactivés par
défaut ([NestJS — lifecycle events](https://docs.nestjs.com/fundamentals/lifecycle-events)).
En production, un conteneur arrêté ne nettoie donc rien.

**Deux défauts, pas un**

1. Le hook n'est pas armé sur les signaux.
2. Même armé, `onApplicationShutdown` intervient **après** la fermeture des
   connexions. Un poll en cours à cet instant écrirait dans une connexion Mongo
   déjà fermée, et un message réclamé resterait `processing` jusqu'à expiration de
   son bail.

**Recommandation**

Activer les hooks dans `main.ts`, **et** déplacer l'arrêt du timer vers
`beforeApplicationShutdown` ou `onModuleDestroy` — avant la fermeture des
connexions — puis attendre la fin du poll en cours.

Le drapeau booléen `polling` (`realtime-outbox.relay.ts:79`) ne convient pas pour
cette attente : un booléen n'est pas attendable, et s'en servir imposerait une
boucle d'attente. La forme correcte est de conserver la promesse active —
`private activePoll: Promise<void> | null` — que le hook d'arrêt attend après avoir
supprimé le timer.

## Constats manquants — performance et appels à la base

### [Élevé] NEW-01 — N+1 sur la liste des personnages d'une campagne

**Preuves**

- `list-campaign-characters.use-case.ts:50-54` projette chaque personnage avec
  `Promise.all` sur `toCharacterListItem`.
- `character-list.mapper.ts:17` appelle `toCharacterDtoResolved`.
- `character.mapper.ts:75` appelle `directory.findById` — une requête **par
  personnage assigné**.

**Coût**

`GET /campaigns/:id/characters` : **3 + A requêtes MongoDB**, où `A` est le nombre
de personnages **assignés** — deux pour la campagne via `membership.execute`, une
pour les personnages, une par personnage assigné. Les fiches non assignées ne
déclenchent aucune lecture d'annuaire (`character.mapper.ts:74-75`), donc `A ≤ N`
et non `N`.

**Aggravant**

Le commentaire de `character.mapper.ts:20-21` affirme l'inverse : « le use-case fait
une lecture d'annuaire pour toute la liste, le mapper ne fait qu'y piocher — même
découpage que campaigns ». Le code ne le fait pas. Un commentaire qui décrit une
architecture absente coûte plus cher que pas de commentaire : il désamorce la
relecture qui aurait trouvé le défaut.

**Recommandation**

Plus courte qu'il n'y paraît : `GetUserProfileUseCase.identitiesByIds()` **existe
déjà** (`get-user-profile.use-case.ts:42-45`), adossé à
`MongoUserRepository.findManyByIds` (`mongo-user.repository.ts:28-35`). Il suffit
d'ajouter `findManyByIds` à `CharacterDirectoryPort`
(`characters/application/ports/character-directory.port.ts`) et de le déléguer dans
`UserCharacterDirectory`. Rien à écrire côté user.

Le use-case charge alors les assignés en une requête, les indexe par id sur le
modèle de `indexDirectoryUsers` (`friendship/application/directory-index.ts`), et
passe la `Map` au mapper — ce qui règle simultanément NEW-10.

Coût final : **4 requêtes, quels que soient `N` et `A`.**

### [Élevé] NEW-02 — La campagne est rechargée deux à quatre fois par commande

**Preuves**

- `get-campaign-membership.use-case.ts:39-49` appelle `loadCampaign`, donc
  `findById`, donc **2 requêtes** (racine puis adhésions, cf.
  `mongo-campaign-persistence.repository.ts:39-43,94-99`).
- `character.lookup.ts:48-51` (`resolveAccessContext`) appelle `membership.execute`
  **deux fois** en `Promise.all`, sur la même campagne, pour lire deux rôles
  présents dans le même agrégat.
- `assign-character.use-case.ts:86` puis `:104` : deux appels séparés, même
  campagne.

**Coût**

`resolveAccessContext` : **4 requêtes** pour une information contenue dans un seul
agrégat. Utilisé par `finalize-character.use-case.ts:58` et
`delete-character.use-case.ts:29`.

`assign-character` cumule : 4 requêtes d'adhésion, plus le reçu d'idempotence, plus
le personnage, plus l'annuaire par pseudo, plus `findAssignedTo`, plus l'annuaire à
nouveau dans `toAssignmentResult`. **Une dizaine d'allers-retours pour une
assignation.**

`Promise.all` réduit la latence perçue. Il ne réduit ni le nombre de requêtes, ni la
pression sur le pool de connexions — le même piège que celui déjà relevé en PERF-01.

**Pourquoi il n'y a pas de correctif évident**

Dans `resolveAccessContext`, les deux identités sont connues d'avance : l'acteur et
le créateur de la fiche. Une lecture groupée y suffit, sans effet de bord.

Dans `assign-character`, non — et c'est là que la correction devient un arbitrage.
L'ordre actuel est porteur : `assertActorIsGameMaster` (`:85-91`) s'exécute
**avant** `resolveActivePlayer` (`:101-107`), qui résout un pseudo dans l'annuaire.
`campaign.lookup.ts:26-30` documente explicitement la règle — résoudre un pseudo
avant le contrôle d'habilitation transforme la route en **oracle d'annuaire**.

Un `GetCampaignMemberships({ campaignId, userIds })` ne résout donc rien : pour
passer la cible en paramètre, il faut avoir résolu son pseudo, c'est-à-dire trop
tôt. Les deux exigences — charger la campagne une fois, contrôler l'acteur avant de
résoudre la cible — ne se concilient pas dans un use-case de lecture sans état.

**DÉCISION REQUISE — frontière `campaigns` / `characters`**

| Option | Conséquence |
|---|---|
| Statu quo | Ordre de sécurité préservé, frontière intacte. 4 requêtes d'adhésion par assignation. |
| Projection d'autorisation portée par `campaigns` — charge la campagne, vérifie l'acteur, résout ensuite le pseudo, qualifie la cible, rend une projection neutre | 4 → **2 requêtes**, ordre de sécurité préservé, ni l'agrégat ni le repository exposés à `characters`. En contrepartie, une séquence de forme « assignation » entre dans `campaigns` : acceptable si la projection reste réellement neutre, mais c'est un déplacement de responsabilité à assumer. |
| Lecture groupée naïve | Recrée l'oracle d'annuaire. À écarter. |

`resolveAccessContext` peut être corrigé indépendamment de cette décision :
4 → **2 requêtes**, sans arbitrage.

### [Faible] NEW-09 — Les adhésions sont intégralement réécrites à chaque mutation

`mongo-campaign-persistence.repository.ts:77-83` — `replaceMemberships` fait un
`deleteMany` sur toute la campagne puis un `insertMany` de la totalité, **à chaque
sauvegarde**, quelle que soit la mutation.

Deux appels seulement, donc ce n'est pas un N+1. Mais c'est `O(M)` documents et
autant d'entrées d'index réécrits pour une promotion qui ne concerne qu'un membre —
plus la charge de réplication correspondante.

Pour une table de jeu de quelques joueurs, ce n'est vraisemblablement pas urgent. Ce
qui manque, c'est la **cardinalité maximale** : aucun document ne dit combien de
membres une campagne peut avoir, ce qui rejoint PERF-03. À documenter d'abord, à
remplacer par une persistance différentielle seulement si le chiffre le justifie.

## Constats manquants — sécurité

### [Moyen, à confirmer] NEW-08 — `@Public()` exempte aussi du CSRF

**Preuve**

`csrf.guard.ts:43-49` — toute route portant `@Public()` sort du garde CSRF sans
autre condition. Cela couvre `register`, `login`, `verify-email` **et `refresh`**
(`auth.controller.ts:64,71,81,95`).

Le commentaire du garde (`csrf.guard.ts:28-31`) justifie l'exemption par
`SameSite=Lax`. C'est solide pour un site entièrement tiers. Ça l'est moins pour
les deux cas suivants :

- **`login`** — un formulaire intersite qui connecte silencieusement la victime au
  compte de l'attaquant (login-CSRF, ou *session swapping*). La suite de la
  navigation se fait alors dans une session que l'attaquant contrôle. Un formulaire
  HTML ne peut pas émettre d'`application/json` directement, ce qui rend
  l'exploitation dépendante du parseur de corps réellement monté : **à vérifier par
  un test navigateur réel avant de conclure.**
- **`refresh`** — `SameSite=Lax` ne protège pas d'un sous-domaine hostile capable
  d'écrire un cookie sur le domaine parent. Or c'est **exactement** le scénario que
  le commentaire de `csrf.guard.ts:20-22` invoque pour justifier l'existence du
  CSRF signé. L'exemption retire donc la défense précisément là où elle avait été
  jugée nécessaire.

  Le scénario à tester en priorité est un **CSRF de rotation ou de déconnexion
  depuis un sous-domaine same-site** : l'attaquant n'a pas besoin de lire la
  réponse — que CORS lui refuse de toute façon — il lui suffit de provoquer l'effet
  de bord, c'est-à-dire de faire tourner ou d'invalider la session de la victime.

**Le fond du problème**

« Public » et « exempté de CSRF » sont deux décisions distinctes que le garde
confond. `register` et `login` n'ont effectivement pas de jeton à présenter avant
authentification ; `refresh` en a un — le cookie CSRF survit à l'expiration de
l'access token, puisqu'il porte le TTL du refresh (`session-cookies.ts:47-50`).

**Recommandation**

Confirmer d'abord l'exploitabilité par un test navigateur, `refresh` en premier.
Séparer ensuite les deux décisions : une route publique qui possède déjà un jeton
CSRF valide n'a pas de raison d'en être dispensée.

### [Faible / informatif] NEW-06 — Oracle de temps sur `/auth/login`

**Preuve**

`login.use-case.ts:34-47` : email inconnu → `InvalidCredentialsError` levée
**avant** tout appel à bcrypt. Email connu → la réponse attend un `bcrypt.compare`
à coût 12, sur `bcryptjs`, du JavaScript pur donc lent à dessein
(`env.validation.ts:19-21`). L'écart de latence est structurel, et le message
d'erreur identique dans les deux cas ne le masque pas.

**Pourquoi ce n'est pas classé plus haut**

Parce que l'énumération de comptes est **déjà ouverte par une porte plus large** :
`/auth/register` renvoie un conflit d'unicité explicite sur l'email
(`user.schema.ts:9`, `RegisterUserUseCase`), et le commentaire
`auth.controller.ts:39-41` reconnaît d'ailleurs le risque d'énumération sur ces
routes. Un attaquant n'a aucun besoin de chronométrer `login` : il lui suffit de
tenter une inscription.

Payer un bcrypt factice sur la branche « utilisateur introuvable » **ne protège donc
rien** tant que l'inscription conserve ce comportement. C'est une correction à
faire, mais dans le même mouvement que la politique d'énumération de `register` —
seule, elle donne l'illusion d'une défense.

**Recommandation**

Traiter l'énumération comme **une seule question** portant sur `register` et
`login` ensemble, et décider du niveau de divulgation acceptable à l'inscription
avant de toucher au temps de réponse de la connexion.

### [Moyen] NEW-07 — Le throttler compte sur une IP qui peut être celle du proxy

**Preuve**

`ThrottlerGuard` est monté en `APP_GUARD` (`app.module.ts:54`) et retient par défaut
l'IP vue par Express comme clé de comptage. `main.ts` ne configure **pas**
`trust proxy`.

**Scénario**

Derrière un reverse-proxy ou un tunnel — et la configuration LAN/tunnel Cloudflare
est justement le motif invoqué pour justifier `appOrigin`
(`shared/src/user-schema.ts:68-69`) — `req.ip` vaut l'IP du proxy pour **tous** les
appelants. Les 10 requêtes/minute des routes d'authentification deviennent alors un
budget **partagé par l'ensemble des utilisateurs** : un seul client suffit à fermer
`/auth/login` à tout le monde. Le garde-fou de sécurité se retourne en déni de
service.

L'erreur symétrique est aussi coûteuse : faire confiance aveuglément à
`X-Forwarded-For` laisse un en-tête forgé contourner entièrement la limite.

Le constat est **conditionnel à la topologie réelle** : en accès direct, sans
proxy, la configuration actuelle est correcte et il n'y a rien à faire.

**DÉCISION REQUISE — topologie de déploiement**

Express propose plusieurs formes de confiance, et le nombre de sauts n'est que la
plus simple ([Express — behind proxies](https://expressjs.com/en/guide/behind-proxies/)) :

| Option | Conséquence |
|---|---|
| Nombre de sauts (`trust proxy: <n>`) | Simple. Suppose une chaîne de longueur fixe et unique ; à revoir à chaque changement d'infra. |
| Liste d'IP ou de sous-réseaux de confiance | Plus sûr quand plusieurs chemins réseau coexistent. Demande de connaître les plages du proxy. |
| Fonction de confiance dédiée | Le plus précis, notamment en multi-chemins. Code à écrire et à tester. |
| Clé de comptage dérivée d'autre chose que l'IP | Robuste au proxy. Ne protège plus l'inscription et la connexion, qui n'ont pas d'identité. |
| Statu quo | Correct en accès direct. Comptage global involontaire derrière tout proxy. |

`trust proxy: true` n'est pas une option : il fait confiance à un en-tête que
n'importe quel client écrit.

## Constats manquants — Clean Code

### [Moyen] NEW-10 — Les mappers font des I/O

**Preuves**

- `character.mapper.ts:69-78` — `toCharacterDtoResolved` reçoit un
  `CharacterDirectoryPort` et appelle `directory.findById`.
- `character-assignment.mapper.ts:9-34` — `toAssignmentResult` reçoit le même port
  et appelle l'annuaire **deux fois** (personnage entrant, personnage précédent).

**Portée exacte**

`.claude/rules/back-layer-application.md` définit un mapper comme « la traduction
agrégat vers DTO de sortie ». Une traduction ne lit pas la base. Dès qu'un mapper
prend un port, il peut être appelé dans une boucle sans que rien ne le signale.

C'est la cause directe de **NEW-01**, et de lui seul. Les deux autres N+1 ont une
cause distincte, dans une couche différente :

| N+1 | Où | Le mapper est-il en cause ? |
|---|---|---|
| NEW-01 | `list-campaign-characters.use-case.ts:50-54` → mapper | **oui** — le mapper appelle l'annuaire |
| PERF-01 | `mongo-campaign-persistence.repository.ts:86-99` — `findMany` appelle `hydrate` par campagne | non — c'est un N+1 **interne au repository** |
| PERF-02 | `list-campaign-invitations.use-case.ts:47-53` — `project` charge campagne et invitant par invitation | non — `toCampaignInvitation` (`campaign.mapper.ts:61-71`) est **déjà pur** |

Les trois partagent le même **remède** — chargement groupé puis indexation en
mémoire — mais ce sont bien **trois emplacements distincts** à corriger, dans trois
couches différentes. Rendre les mappers purs ne fait pas tomber PERF-01 ni PERF-02.

Le contre-exemple à suivre est dans le même dépôt : `GetCampaignDetailUseCase`
charge l'annuaire en un `findManyByIds` (`get-campaign-detail.use-case.ts:47-49`)
puis appelle un `toCampaignDetail` **pur**.

Effet de bord visible sur les signatures : `AssignCharacterUseCase.command()`
(`assign-character.use-case.ts:124-142`) est `async` **uniquement** parce que sa
dernière ligne cache une lecture externe. Une méthode nommée comme un constructeur
d'objet effectue une I/O, sans que son nom ne le laisse deviner.

**Recommandation**

Le découpage attendu, déjà appliqué côté friendship et campaigns : le use-case
charge, un index `Map` est construit, le mapper redevient **synchrone et pur**.

### [Faible] NEW-11 — Contrôleurs très au-delà de la règle des trois paramètres

Constructeurs mesurés :

| Contrôleur | Injections | Lignes |
|---|---:|---:|
| `campaign.controller.ts` | 12 | 223 |
| `character.controller.ts` | 9 | 165 |
| `friendship.controller.ts` | 9 | 133 |
| `auth.controller.ts` | 6 + `SessionCookies` | 142 |

À comparer à `campaign-character-lifecycle.controller.ts` : 3 injections, 83 lignes.
Le bon format existe donc déjà dans le projet.

`CLAUDE.md` impose **3 paramètres maximum**. Le commentaire
`campaign.controller.ts:57-58` reconnaît la tension et l'aménage — une injection par
ligne pour ne pas faire exploser la limite de corps de fonction — au lieu de la
résoudre.

Le découpage naturel suit les sous-ressources, sans rien remonter vers `shared` :
campagne / invitations / membres ; personnage / affectation / fiche ; session /
inscription et vérification. C'est un refactor structurel, à faire dans un commit
dédié.

### [Faible] NEW-12 — La limite de 20 lignes est contournée par compression

`mongo-character-assignment.repository.ts:147-181` — `receiptDocument`,
`auditDocument` et `outboxDocument` empilent plusieurs propriétés par ligne :

```
_id: receiptId, schemaVersion: SCHEMA_VERSION,
principalKey: command.principalId.value, idempotencyKey: command.idempotencyKey,
```

ESLint compte des lignes, pas des instructions : la règle passe, l'intention est
perdue. Or `CLAUDE.md` demande « un seul niveau d'abstraction par fonction » et
d'« extraire des sous-fonctions nommées par leur intention » — pas de retirer des
retours à la ligne. La lisibilité régresse pendant que la métrique s'améliore, ce
qui est le pire des deux mondes.

C'est aussi un signal à garder en tête pour MAINT-02 : les cinq fonctions à
découper ne doivent pas être « corrigées » de cette façon.

### [Moyen] NEW-13 — La traduction du code Mongo `11000` est dupliquée et parfois trop large

**Preuve**

Le même prédicat est réécrit dans **cinq** repositories :

- `mongo-campaign-invitation.repository.ts:18`
- `mongo-campaign-lifecycle.repository.ts:14`
- `mongo-campaign.repository.ts:17`
- `mongo-character-assignment.repository.ts:43`
- `mongo-friendship.repository.ts:254` (seul à écrire `11_000`)

**Le vrai risque, au-delà du DRY**

Certains `catch` traduisent **tout** `11000` en une erreur métier précise — par
exemple `FriendRequestAlreadyExistsError` dans
`mongo-friendship.repository.ts:58-61`. Or ces transactions écrivent plusieurs
collections : agrégat, reçu d'idempotence, entrée d'audit, message d'outbox, chacune
avec ses propres index uniques. Une collision sur un reçu ou sur un `_id` d'outbox
remonterait au client déguisée en « demande d'ami déjà existante ».

Un diagnostic faux est plus coûteux qu'une erreur brute : il envoie la correction
dans la mauvaise direction.

**Recommandation — deux responsabilités, pas une**

1. **Reconnaître** un `MongoServerError` de code `11000` : c'est mécanique et
   identique partout, donc factorisable.
2. **Traduire** vers une erreur métier : cela reste **local à chaque repository**,
   qui vérifie le `keyPattern` de l'index effectivement violé avant de conclure. Un
   helper partagé n'a pas à décider qu'une collision signifie « invitation déjà
   ouverte » ou « amitié existante » — cette connaissance appartient au module.

Toute violation d'unicité non reconnue doit remonter telle quelle plutôt que
d'emprunter le nom d'un invariant métier.

**Note de procédure :** placer le prédicat de reconnaissance dans
`kernel/infrastructure/` est une **remontée vers un périmètre partagé**. Le
protocole de déplacement de `CLAUDE.md` en fait une décision explicite, dans un
commit dédié — jamais un effet de bord de la correction fonctionnelle.

## Constats mineurs

- **`mongo-character.repository.ts:100-102`** — `mongoSession(handle as ClientSession)`
  force le typage depuis l'`unknown` déclaré au port
  (`character.repository.port.ts`). Le cast est **localisé dans l'adapter**,
  c'est-à-dire au seul endroit du projet où connaître Mongoose est légitime : ce
  n'est pas un équivalent d'`any`, et le constat reste mineur. Un type opaque ou
  brandé au port rendrait la frontière plus sûre sans changer la structure.
- **`mongo-friendship.repository.ts:133`** — `findOneAndUpdate({ id }, document)`
  sans révision attendue. Même famille que COR-01, que l'audit n'attribue qu'à
  `Character` et `User`. Trois agrégats sont donc concernés, pas deux.
- **`mongo-monster.repository.ts:32-35` et `mongo-item.repository.ts:28-30`** — les
  catalogues SRD, données immuables, sont relus intégralement depuis Mongo à chaque
  requête, sans projection ni pagination ni cache. `GetDndCatalogUseCase` montre le
  réflexe inverse pour des données de référence ; le bestiaire et les objets ne
  l'ont pas. Ampleur à mesurer avant d'agir : c'est une observation, pas un
  problème démontré.
- **`database.module.ts:8-15`** — ni `maxPoolSize`, ni `autoIndex` explicites. Ni
  l'un ni l'autre n'est un défaut démontré sans charge mesurée : le pool par défaut
  peut très bien convenir, et `autoIndex` demande la **création ou la vérification**
  des index au démarrage, ce qui n'est pas une reconstruction. À trancher au moment
  où une charge de référence existera.
- **Portée réelle d'une révocation de session** — `logout.use-case.ts:40-42` révoque
  la lignée de refresh et coupe les websockets, mais le JWT d'accès reste valable
  jusqu'à 15 minutes (`ACCESS_TOKEN_TTL`). Idem après `TokenReuseDetectedError`
  (`refresh-tokens.use-case.ts:76-77`). C'est le prix normal d'un JWT sans liste de
  révocation, et `TECHNICAL-REALTIME-5D.md:150-151` en fait déjà une **DÉCISION
  REQUISE** ouverte. À documenter comme limite assumée plutôt qu'à corriger de
  l'intérieur d'un audit.

## Le fil rouge

L'observation la plus utile de l'audit du 28/08 est enterrée dans « Points
positifs » :

> Les listes d'amis groupent déjà correctement l'hydratation des profils en une
> requête via `indexDirectoryUsers`.

C'est exact, et c'est le modèle. `friendship/application/directory-index.ts` est le
patron correct — écrit, testé, en service — et `identitiesByIds` comme
`findManyByIds` existent déjà pour l'alimenter.

Les trois N+1 du back (PERF-01, PERF-02, NEW-01) appellent tous **le même remède** :
charger en lot, indexer en mémoire, projeter sans I/O. Mais ils vivent dans **trois
couches différentes** — repository, use-case, mapper — et se corrigent donc en trois
endroits. NEW-10 explique pourquoi le troisième est passé inaperçu : tant qu'un
mapper accepte un port, rien n'oblige à charger en amont, et rien ne signale la
boucle.

## Priorisation consolidée

Les deux blocages de sécurité de l'audit du 28/08 restent en tête, SEC-01 en
Critique :

1. **SEC-01** — `appOrigin`. La politique d'origine se décide avant toute ligne.
2. **SEC-02** — rotation atomique du refresh. Transaction Mongo ou update
   conditionnel : décision de Charly, puis test d'intégration à deux rotations
   concurrentes.

Puis, dans cet ordre :

3. **Écart de spécification** — NEW-14 : les audiences de campagne doivent être
   résolues comme la 5D l'exige, ou l'écart doit être acté et rendu visible. Une
   fonctionnalité absente en silence coûte plus cher qu'un bug.
4. **Gardes au vert** — MAINT-02 : casser le cycle `validate-choices` ↔
   `validate-spell-choices` par un fichier de domaine neutre, découper les cinq
   fonctions **par intention** et non par compression (cf. NEW-12). Aucune décision
   requise.
5. **Les trois N+1, un remède, trois endroits** — NEW-10 pour rendre les mappers
   purs (règle NEW-01), chargement groupé des adhésions dans
   `MongoCampaignPersistenceRepository` (PERF-01), lots de campagnes et
   d'utilisateurs dans `ListCampaignInvitationsUseCase` (PERF-02).
6. **Rechargements de campagne** — NEW-02 : `resolveAccessContext` tout de suite,
   `assign-character` après arbitrage de frontière.
7. **Scinder les contrôleurs surchargés** — NEW-11, commit dédié.
8. **Cycle de vie et garde-fous du relais** — NEW-05 d'abord (hooks + arrêt avant
   fermeture des connexions, via `activePoll`), puis l'observabilité des `pending`,
   puis NEW-03 et NEW-04 une fois les décisions prises.
9. **Persistance et duplications Mongo** — NEW-09 (cardinalité d'abord), NEW-13,
   COR-01 étendu à `Friendship`, COR-02.
10. **Durcissement** — NEW-08 après test navigateur, NEW-07 après clarification de
    la topologie, NEW-06 avec la politique d'énumération de `register`, MAINT-01.

## Décisions en attente

| Réf | Sujet | Bloque |
|---|---|---|
| SEC-01 | Origine autorisée du lien de vérification | Correction du pré-hijacking de compte |
| SEC-02 | Transaction Mongo ou update conditionnel | Atomicité de la rotation de refresh |
| NEW-02 | Projection d'autorisation portée par `campaigns`, ou statu quo | Réduction des rechargements dans `assign-character` |
| NEW-03 | Protocole de réclamation par lot | Réduction des allers-retours du relais |
| NEW-04 | Rétention des messages outbox terminaux | Croissance illimitée de la collection |
| NEW-04 | Abandon après N échecs, alerte et reprise manuelle | Boucle de reprise sans fin, contrat de livraison |
| NEW-06 | Niveau de divulgation accepté à l'inscription | Toute correction sérieuse de l'énumération |
| NEW-07 | Topologie de proxy et forme de confiance retenue | Fiabilité du rate limiting |
| NEW-08 | Découplage `@Public()` / exemption CSRF | Portée réelle de la défense CSRF |
| NEW-09 | Cardinalité maximale d'une campagne | Choix entre réécriture complète et différentielle |
| NEW-13 | Promotion du prédicat `11000` vers `kernel/` | Protocole de déplacement, commit dédié |

## État des corrections au 29 août 2026

Douze lots ont été appliqués sur la branche `fix/audit-back-2026-08-29`, dans
l'ordre de la priorisation ci-dessus, restreints à ce qui ne demande **aucune
décision**. Chaque lot est un commit, et `pnpm --filter back typecheck`, `lint` et
`test` passent après chacun.

| Constat | État | Ce qui a été fait |
|---|---|---|
| MAINT-02 | **corrigé** | Cycle cassé par un fichier de domaine neutre ; les cinq fonctions découpées par intention, jamais par compression de lignes. `lint` et `lint:arch` au vert, hors warning assumé. |
| PERF-01 | **corrigé** | Une lecture d'adhésions groupée par `$in`, indexée en mémoire. `listForUser` : 3 requêtes au lieu de `2 + N`. |
| PERF-02 | **corrigé** | Campagnes et invitants chargés en lot. 3 requêtes au lieu de `1 + 2N`. |
| NEW-01, NEW-10 | **corrigé** | `findManyByIds` sur le port d'annuaire, index en mémoire, les trois mappers redeviennent purs et synchrones. La liste coûte 4 requêtes quels que soient `N` et `A`. Test de non-régression sur le compte d'appels. |
| NEW-02 | **partiel** | `resolveAccessContext` passe de 4 à 2 requêtes via une lecture d'adhésions plurielle. `assign-character` **inchangé** : sa correction reste suspendue à l'arbitrage de frontière. |
| NEW-05 | **corrigé** | `enableShutdownHooks()` dans `main.ts`, arrêt déplacé en `onModuleDestroy`, drapeau booléen remplacé par la promesse du poll en cours. |
| NEW-14 | **corrigé (résolveur)** | Voir l'addendum du constat. Le vocabulaire navigateur reste une décision. |
| MAINT-01 | **corrigé** | Les onze `@Param` passent par `ZodParam`. Un identifiant malformé rend 400. Aucun test back ne le couvre : le back n'a pas de test de niveau HTTP. |
| COR-02 | **corrigé** | `delete` devient `consume`, qui rend `true` au seul appelant ayant supprimé le document. Consommation **avant** vérification. |
| COR-01 (`Friendship`) | **corrigé** | Révision attendue au `findOneAndUpdate`, conflit levé au lieu d'un retour silencieux. Tolérance aux documents antérieurs au champ. |
| NEW-13 | **partiel** | Les deux `catch` qui traduisaient tout `11000` vérifient désormais le `keyPattern`. La promotion du prédicat vers `kernel/` reste une décision. |
| NEW-11 | non traité | Refactor structurel, commit dédié. |
| NEW-03, NEW-04, NEW-06, NEW-07, NEW-08, NEW-09 | non traités | Suspendus aux décisions listées ci-dessous. |
| SEC-01, SEC-02 | non traités | Les deux blocages de sécurité de l'audit du 28/08 restent en tête. |

Deux points à ne pas confondre avec un résultat :

- L'atomicité de COR-02 et le contrôle de révision de COR-01 sont vérifiés par des
  tests sur des doubles en mémoire. Les 7 tests d'intégration Mongo restent
  ignorés faute de `MONGODB_INTEGRATION_URI` : **aucun MongoDB réel** n'a validé
  ces comportements concurrents.
- `pnpm typecheck` échoue au front sur
  `character-build-detail.test.ts`, une erreur **antérieure** à ces lots et
  étrangère à eux : aucun fichier de `front/` n'a été modifié, et les deux ajouts
  à `shared/` n'y touchent pas.

## Limites de ce complément

- Aucun `explain('executionStats')`, aucun benchmark, faute de base représentative.
  Les plans de requête évoqués en NEW-03 sont des hypothèses à confirmer. Le
  désalignement index/filtre, lui, est une lecture directe du code.
- NEW-08 n'est pas démontré de bout en bout : l'exemption est certaine,
  l'exploitabilité demande un test navigateur réel avec le parseur de corps
  effectivement monté.
- Les écarts de temps de NEW-06 sont déduits de la lecture du code (`bcryptjs`,
  coût 12, branche de sortie anticipée), non chronométrés.
- NEW-14 compare le code à `TECHNICAL-REALTIME-5D.md`. Si cette spécification a
  évolué depuis sa rédaction, c'est elle qui fait foi, pas ce constat.
- Les 7 tests d'intégration Mongo restent ignorés sans `MONGODB_INTEGRATION_URI`.
  Les comportements transactionnels et les courses ne sont vérifiés contre aucun
  MongoDB réel, ici comme dans l'audit du 28/08.
- Porte sur le code présent au 29 août 2026. Ni la configuration de production, ni
  l'infrastructure réseau, ni les dépendances déployées.
