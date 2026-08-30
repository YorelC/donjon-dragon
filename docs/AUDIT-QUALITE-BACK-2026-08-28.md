# Audit qualité du back — 28 août 2026

## Résumé exécutif

Périmètre : `back/src`, avec lecture des contrats partagés nécessaires à la validation des entrées. Audit statique en lecture seule du code applicatif, des repositories MongoDB, des schémas, des contrôleurs, de l'authentification, du temps réel et des tests. Aucun code source n'a été modifié.

Le back possède de bonnes fondations : architecture hexagonale réellement appliquée, authentification fermée par défaut, ownership vérifié dans le domaine, entrées principales validées par Zod, lectures Mongoose généralement faites avec `.lean()`, secrets opaques hashés, index métier explicites, transactions et contrôle de révision sur les agrégats récents. Les 776 tests exécutés passent.

Le niveau global reste **à corriger avant exposition publique** à cause de deux risques de sécurité/concurrence prioritaires et de plusieurs chemins de lecture coûteux :

1. l'origine du lien de vérification d'email est fournie par le client, ce qui permet de diriger le jeton de vérification vers un domaine tiers ;
2. la consommation d'un refresh token n'est ni atomique ni protégée par une révision, donc deux requêtes concurrentes peuvent toutes deux gagner ;
3. les listes de campagnes et d'invitations exécutent des requêtes N+1 ;
4. plusieurs listes ne sont pas paginées et certains index ne couvrent pas les requêtes réelles ;
5. le lint et le contrôle d'architecture sont actuellement rouges.

### Évaluation

| Dimension | Note | Synthèse |
|---|---:|---|
| Sécurité | 6/10 | Très bonnes défenses de session, mais origine de vérification non fiable et rotation non atomique. |
| Performance | 5/10 | `.lean()`, index et chargements groupés présents ; N+1 et listes non bornées sur des chemins utilisateur. |
| Correction / concurrence | 6/10 | Transactions et révisions sur les campagnes ; plusieurs écritures historiques restent sans contrôle de concurrence. |
| Maintenabilité | 7/10 | Architecture lisible et typage strict ; lint rouge, cycle de dépendances et incohérences de validation. |
| Tests | 8/10 | 776 tests passent ; 7 tests Mongo d'intégration sont ignorés et les courses critiques ne sont pas couvertes. |

## Constats prioritaires

### [Critique] SEC-01 — Le lien de vérification peut exfiltrer le jeton vers un domaine tiers

**Preuves**

- `shared/src/user-schema.ts:65-73` accepte `appOrigin` depuis le corps d'inscription et vérifie seulement qu'il s'agit d'une URL.
- `back/src/modules/auth/application/use-cases/register.use-case.ts:33-40` transmet directement cette valeur au générateur du lien.
- `back/src/modules/auth/application/use-cases/register.use-case.ts:49-58` concatène le secret en clair à cette origine.

**Scénario**

Un attaquant inscrit l'adresse email de la victime avec un mot de passe qu'il connaît et `appOrigin=https://attacker.example`. Le jeton reste bien envoyé à la victime, mais le lien pointe vers le domaine de l'attaquant. Si la victime clique, le jeton apparaît dans la query string reçue par ce domaine. L'attaquant peut alors appeler l'API de vérification, obtenir une session et prendre le contrôle du compte pré-créé.

**Impact**

Pré-hijacking de compte et divulgation d'un secret d'authentification. La limitation à 10 requêtes/minute réduit le volume, pas la faisabilité.

**Recommandation**

Construire le lien côté serveur à partir d'une origine configurée et autorisée. Si plusieurs origines sont nécessaires, sélectionner exclusivement dans la liste `security.corsOrigins` après comparaison exacte du protocole, hôte et port ; ne jamais utiliser une URL arbitraire fournie par le client. Cette politique doit être documentée avant implémentation, car elle conditionne les environnements LAN et tunnel.

### [Élevé] SEC-02 — La rotation des refresh tokens n'est pas atomique

**Preuves**

- `back/src/modules/auth/application/use-cases/refresh-tokens.use-case.ts:66-83` lit le token, vérifie son état en mémoire, puis le sauvegarde révoqué.
- `back/src/modules/auth/application/use-cases/refresh-tokens.use-case.ts:89-95` crée ensuite le successeur dans une deuxième écriture.
- `back/src/modules/auth/infrastructure/persistence/mongo-refresh-token.repository.ts:23-25` fait un upsert filtré uniquement par `id`, sans condition `revokedAt` absent, révision ou transaction.

**Scénario**

Deux requêtes présentant le même refresh token lisent simultanément l'état non révoqué. Les deux le révoquent, puis chacune crée un successeur différent. Elles reçoivent toutes deux une session valide. Le contrat « secret opaque à usage unique » et l'hypothèse « une rotation gagne, l'autre voit un rejeu » ne sont donc pas garantis par la persistance.

**Impact**

Multiplication de descendants valides dans une même lignée, détection de rejeu retardée, comportement non déterministe entre onglets et fenêtre exploitable par un token volé. Une panne entre la révocation et la création du successeur peut aussi déconnecter définitivement la session.

**Recommandation**

Faire porter au port une opération atomique de rotation. Deux options à décider explicitement :

- transaction Mongo couvrant consommation conditionnelle et insertion du successeur ;
- mise à jour atomique conditionnée par `revokedAt` absent, avec résultat `matchedCount`, complétée par l'insertion du successeur dans une transaction.

Ajouter un test d'intégration lançant deux rotations concurrentes et prouvant qu'un seul successeur utilisable est émis.

### [Élevé] PERF-01 — N+1 lors de la liste des campagnes

**Preuves**

- `back/src/modules/campaigns/infrastructure/persistence/mongo-campaign-persistence.repository.ts:46-50` charge les adhésions puis les racines en une seconde requête.
- `back/src/modules/campaigns/infrastructure/persistence/mongo-campaign-persistence.repository.ts:86-98` appelle ensuite `hydrate` avec `Promise.all`, et `hydrate` exécute une requête `memberships.find` pour chaque campagne.

**Coût**

Pour `N` campagnes : **2 + N requêtes MongoDB**. `Promise.all` réduit la latence séquentielle mais ne réduit ni le nombre de requêtes, ni la pression sur le pool de connexions.

**Recommandation**

Charger toutes les adhésions avec `{ campaignId: { $in: campaignIds } }`, les indexer en mémoire par `campaignId`, puis hydrater les racines sans I/O supplémentaire. Le coût devient constant : trois requêtes au maximum, indépendamment de `N`.

### [Élevé] PERF-02 — N+1 amplifié lors de la liste des invitations

**Preuves**

- `back/src/modules/campaigns/application/use-cases/list-campaign-invitations.use-case.ts:39-44` projette chaque invitation avec `Promise.all`.
- `back/src/modules/campaigns/application/use-cases/list-campaign-invitations.use-case.ts:46-58` charge, pour chaque ligne, la campagne puis l'invitant.
- Chaque `campaignRepo.findById` hydrate aussi les adhésions dans `mongo-campaign-persistence.repository.ts:39-43,94-98`.

**Coût**

Pour `N` invitations : **1 + 3N requêtes MongoDB** dans l'adapter réel (une liste, puis racine de campagne + adhésions + utilisateur pour chaque invitation).

**Recommandation**

Ajouter aux ports des lectures groupées (`findManyByIds`) adaptées au besoin du module, charger les campagnes et utilisateurs uniques en lots, puis projeter en mémoire. Dédupliquer les identifiants avant les requêtes.

## Constats importants

### [Moyen] COR-01 — Plusieurs écritures d'agrégats peuvent perdre une mise à jour concurrente

`back/src/modules/characters/infrastructure/persistence/mongo-character.repository.ts:20-23` sauvegarde un personnage par upsert sur son seul identifiant. Ce chemin est utilisé par la création et l'édition classiques, alors que `saveInTransaction` aux lignes 79-90 applique correctement une révision attendue.

Deux éditions concurrentes peuvent donc réussir et la dernière écriture écrase silencieusement la première. Le même pattern existe pour `MongoUserRepository.save`, mais les transitions utilisateur actuelles sont plus limitées et idempotentes.

**Recommandation :** appliquer une politique unique d'optimistic concurrency à toutes les mutations de `Character`, avec distinction explicite entre insertion initiale et remplacement sur révision attendue. Ajouter un test de conflit concurrent.

### [Moyen] COR-02 — La consommation du jeton de vérification n'est pas atomique

`back/src/modules/auth/application/use-cases/verify-email.use-case.ts:42-48` lit le token, modifie l'utilisateur, supprime le token, puis émet un refresh token dans des écritures distinctes. Deux requêtes concurrentes peuvent lire le même token avant sa suppression et toutes deux émettre une session. Une panne après modification de l'utilisateur mais avant émission de session consomme aussi le parcours sans garantie de réponse exploitable.

**Recommandation :** consommer le token avec une suppression atomique qui retourne le document (`findOneAndDelete`) et ne poursuivre que pour le gagnant. Documenter séparément la stratégie de cohérence entre les collections `user`, `email-verification-token` et `refresh-token`.

### [Moyen] PERF-03 — Listes non bornées et absence de pagination

Les ports et repositories retournent des tableaux complets pour :

- campagnes d'un utilisateur : `mongo-campaign-persistence.repository.ts:46-50` ;
- invitations reçues ou d'une campagne : `mongo-campaign-invitation-persistence.repository.ts:66-78` ;
- amitiés et demandes : `mongo-friendship.repository.ts:73-91,171-178` ;
- personnages d'une campagne : `mongo-character.repository.ts:45-51`.

Ces requêtes sont indexées pour la plupart, mais leur mémoire, leur sérialisation et leur coût réseau restent proportionnels à une cardinalité non bornée. Elles aggravent directement les N+1 précédents.

**Recommandation :** fixer des limites métier documentées, puis introduire une pagination stable par curseur ou clé composée. Ne pas ajouter arbitrairement une limite silencieuse qui tronquerait le comportement fonctionnel.

### [Moyen] PERF-04 — Index friendship incomplets pour les requêtes sortantes

`back/src/modules/friendship/infrastructure/persistence/friendship.schema.ts:26-34` définit `{ recipientId, status }`, `{ status }` et l'unicité de `pairKey`. Or `mongo-friendship.repository.ts:73-91` recherche aussi sur `{ requesterId, status }`, notamment pour les demandes envoyées. La branche `requesterId` des amitiés acceptées et la liste des demandes sortantes ne disposent pas d'un index composé adapté.

**Recommandation :** confirmer avec `explain('executionStats')` sur un volume représentatif, puis ajouter l'index `{ requesterId: 1, status: 1 }` si le plan confirme un scan. Réévaluer ensuite l'utilité de l'index `{ status: 1 }` seul.

### [Moyen] PERF-05 — Recherche de pseudo coûteuse à grande échelle

`back/src/modules/user/infrastructure/persistence/mongo-user.repository.ts:44-56` utilise une regex de sous-chaîne, insensible à la casse, avec pagination `skip`. L'échappement empêche l'injection regex et la taille de requête est bornée, ce qui est positif. En revanche, une regex non ancrée ne bénéficie généralement pas de l'index B-tree `displayName`, et `skip` devient de plus en plus coûteux sur les pages profondes.

**Recommandation :** conserver l'implémentation tant que le volume est faible, mais définir un seuil de bascule et mesurer avec `explain`. À volume élevé, décider entre recherche préfixée normalisée + curseur ou index de recherche dédié. Une bibliothèque ou un service tiers exige une décision explicite.

### [Moyen] COR-03 — L'inscription peut laisser un compte bloqué après une panne email

`register.use-case.ts:33-40` persiste d'abord l'utilisateur, puis `register.use-case.ts:49-58` persiste le jeton et appelle le fournisseur email. Si l'envoi échoue, l'API retourne une erreur alors que l'email et le pseudo sont déjà réservés. Une nouvelle inscription échoue sur l'unicité, sans route visible de renvoi du lien.

**Recommandation :** spécifier le comportement attendu avant correction : outbox email transactionnelle, état d'inscription reprenable, ou route de renvoi idempotente et limitée. Ne pas englober naïvement l'envoi réseau dans une transaction Mongo longue.

### [Faible] MAINT-01 — Validation HTTP incohérente sur 11 paramètres

Onze paramètres utilisent encore `@Param` directement, notamment :

- `friendship.controller.ts:63,74,85,129` ;
- `campaign.controller.ts:106,118,135,150,165,219` ;
- `bestiary.controller.ts:30`.

Les value objects revalident ensuite les UUID ou clés, ce qui évite actuellement une injection Mongo. Cela reste contraire au contrat « toute entrée externe validée par Zod » et produit des frontières HTTP hétérogènes. Le schéma `DeleteFriendParamsSchema` existe déjà mais n'est pas utilisé par le contrôleur.

**Recommandation :** migrer vers `ZodParam` avec les schémas partagés existants et compléter les schémas manquants. Ce point relève de cohérence et défense en profondeur, pas d'une vulnérabilité exploitable démontrée.

### [Faible] MAINT-02 — Les garde-fous automatiques sont rouges

Contrôles exécutés directement avec les binaires locaux :

- typecheck : **réussi** ;
- tests : **78 fichiers réussis, 2 ignorés ; 776 tests réussis, 7 ignorés** ;
- dependency-cruiser : **échec**, avec un cycle `validate-choices.ts → validate-spell-choices.ts → validate-choices.ts` et la dette connue `access-token-payload.ts → shared/auth-schema.ts` ;
- ESLint : **échec**, cinq fonctions dépassent la limite de 20 lignes : `toCharacterBuildDetailDto`, `creationInputFor`, `FinalizeCharacterUseCase.execute`, `buildFrom`, `resolveStartingEquipment`.

Le cycle vient de `validate-spell-choices.ts:8`, qui importe `InvalidCharacterChoiceError` et `ChoicesToValidate` depuis le module orchestrateur, tandis que celui-ci appelle la validation des sorts. Cela fragilise l'ordre d'initialisation et viole une fitness function explicite.

**Recommandation :** extraire les types/erreurs communs dans un fichier de domaine neutre au même niveau, puis remettre le contrôle d'architecture au vert. Découper les cinq fonctions par intention, sans modifier leur comportement.

## Points positifs vérifiés

- Les contrôleurs sont protégés par défaut via `APP_GUARD`, avec `JwtAuthGuard` avant `CsrfGuard` et `ThrottlerGuard`.
- Les routes publiques d'authentification sont limitées à 10 requêtes/minute.
- Les cookies d'accès et de refresh sont `httpOnly`, `SameSite=Lax`, `secure` en production ; le refresh cookie a un chemin restreint.
- Le JWT impose `HS256`, l'expiration est vérifiée et le payload est validé par Zod avant création de l'acteur.
- Le CSRF signé lie le jeton à l'utilisateur et compare les signatures en temps constant.
- Les origines HTTP et WebSocket sont comparées à une liste explicite ; aucune origine joker avec credentials.
- Les secrets de refresh et de vérification sont générés avec 32 octets aléatoires et seuls leurs SHA-256 sont persistés.
- Les mots de passe utilisent bcrypt avec un coût validé entre 10 et 15.
- Aucun document Mongoose ne sort des adapters ; les lectures pures inspectées utilisent `.lean()`.
- Les requêtes regex échappent les métacaractères et bornent l'entrée à 25 caractères.
- Les agrégats campagnes et les mutations transactionnelles de personnages utilisent un contrôle de révision.
- Les écritures campagnes/invitations/personnages récentes associent transaction, receipt d'idempotence, audit et outbox.
- Les listes d'amis groupent déjà correctement l'hydratation des profils en une requête via `indexDirectoryUsers` : c'est le modèle à réutiliser pour campagnes et invitations.
- Les index couvrent correctement les identités, secrets, TTL, adhésions de campagne, invitations ouvertes et affectations de personnages.

## Priorisation recommandée

1. **Bloquant sécurité :** supprimer `appOrigin` comme source de confiance du lien de vérification.
2. **Bloquant concurrence/session :** rendre la rotation du refresh token atomique et tester deux consommateurs concurrents.
3. **Performance immédiate :** supprimer les N+1 de listes de campagnes et d'invitations.
4. **Correction :** uniformiser l'optimistic concurrency de `Character` et la consommation du token email.
5. **Scalabilité :** décider les limites/paginations et vérifier les index avec `explain` sur données représentatives.
6. **Qualité :** remettre dependency-cruiser et ESLint au vert, puis homogénéiser les `ZodParam`.

## Limites de l'audit

- Aucun test de charge, benchmark HTTP ou `explain('executionStats')` n'a été exécuté faute de base représentative.
- Les 7 tests d'intégration Mongo sont ignorés sans `MONGODB_INTEGRATION_URI` ; les comportements transactionnels et courses ne sont donc pas validés ici contre MongoDB réel.
- Aucune couverture instrumentée n'a été générée afin de ne pas créer d'artefacts supplémentaires dans le dépôt.
- L'audit porte sur le code présent au 28 août 2026, pas sur la configuration de production, l'infrastructure réseau ni les dépendances déployées.
