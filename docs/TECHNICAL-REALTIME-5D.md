# Phase 5D — contrat temps réel et diffusion après commit

## Statut et limite du document

- **Statut :** tranche temps réel validée par le propriétaire le 28 août 2026.
- **Prérequis :** DEC-004, DEC-006, DEC-015 et DEC-016.
- **Périmètre :** notifications d'invalidation, outbox, audience, authentification
  Socket.IO, cycle de vie d'une connexion et première trajectoire d'implémentation.
- **Hors périmètre :** contrats détaillés du combat, payloads secrets par audience,
  stockage binaire, observabilité générale et déploiement multi-instance.
- **Décision associée :**
  [DEC-018](DECISIONS/018-realtime-after-commit.md).

Cette tranche résout le contrat temps réel nécessaire aux amitiés et invitations sans
faire de Socket.IO une seconde API métier. Les commandes restent HTTP et MongoDB reste
la source de vérité.

## Invariants

1. Une mutation est validée et persistée avant toute diffusion.
2. Le diffuseur lit uniquement l'outbox après commit.
3. Une room est une adresse technique, jamais une preuve d'autorisation.
4. Toute audience dépendant d'un rôle ou d'une adhésion est recalculée depuis les
   données autoritaires à chaque émission.
5. Le module propriétaire construit la projection autorisée ; le kernel ne sérialise
   jamais un fait interne complet vers le navigateur.
6. Une politique d'audience inconnue ne diffuse rien et termine en quarantaine.
7. Une notification peut être livrée plusieurs fois ; son identité reste stable.
8. Une amitié concerne uniquement ses utilisateurs et ne porte aucun `campaignId`.

## Flux retenu

```text
commande HTTP
  -> transaction MongoDB
     -> état métier + outbox (+ reçu et audit pour les commandes migrées)
  -> commit
  -> diffuseur réclame l'outbox
  -> module propriétaire résout l'audience autorisée
  -> projection minimale par destinataire
  -> émission vers user:{userId}
  -> client déduplique messageId et invalide TanStack Query
```

Le diffuseur n'interprète pas `fact`. Il sélectionne un résolveur fermé à partir de
`ownerModule` et de la politique d'audience. Le résolveur du module propriétaire peut
lire les adhésions ou l'amitié nécessaires, puis retourne les destinataires et la
projection publique autorisée.

Le module d'amitié historique ne possède pas encore le reçu idempotent et l'audit de
la cible 5B. Cette tranche rend déjà atomiques son état et son outbox ; sa migration
vers l'enveloppe complète reste suivie séparément et ne doit pas être simulée par un
faux reçu.

## Périmètre métier et audience

Le périmètre métier indique à quoi appartient le fait. L'audience indique qui reçoit
une projection. Ces dimensions sont orthogonales : une invitation appartient à une
campagne, mais sa création vise un utilisateur qui n'en est pas encore membre.

`campaignId` n'est présent dans l'enveloppe technique que lorsque le fait appartient à
une campagne. Il est absent des reçus, audits et outbox propres à une amitié ou à un
compte. Il n'est jamais ajouté à l'agrégat `Friendship`.

Le vocabulaire interne initial est fermé :

| Politique | Résolution après commit |
|---|---|
| `target-user` | utilisateur explicitement adressé par l'enveloppe |
| `friendship-participants` | deux participants immuables portés par l'enveloppe de routage |
| `campaign-members` | adhésions actives relues depuis la campagne |
| `campaign-game-masters` | adhésions MJ actives relues depuis la campagne |

Les identifiants de `friendship-participants` sont nécessaires au fait
`friendship.removed`, puisque la relation est supprimée dans la même transaction.
Ils ne font pas partie du fait métier et ne sortent jamais dans le message public.
Les audiences de campagne restent recalculées à la diffusion.

Une politique de campagne exige le `campaignId` du message. Elle ne le répète pas dans
la description d'audience. `target-user` peut être utilisé par un fait de campagne ou
par un fait propre à un compte.

Le vocabulaire vit dans le kernel backend. Il ne fait pas partie de `shared`, car le
navigateur ne choisit et ne reçoit aucune politique interne.

Le canal de livraison est une dimension distincte, fermée initialement à `realtime` et
`email`. Une demande de courriel emploie donc le canal `email` avec l'audience
`target-user` ; `email-delivery` n'est pas une audience.

## États et reprise de l'outbox

Les états initiaux sont fermés : `pending`, `processing`, `delivered` et
`quarantined`. Le plan de réclamation ne sélectionne que les messages `pending`
disponibles et les baux `processing` expirés.

Une politique inconnue, une enveloppe incohérente ou une projection impossible place
le message en `quarantined`. Cet état est terminal et exclu du plan de réclamation. Il
conserve le diagnostic sans créer de boucle de reprise ni de diffusion par défaut.

Les pannes temporaires libèrent ou laissent expirer le bail pour une nouvelle
tentative. La livraison reste au moins une fois ; `messageId` ne change jamais entre
deux tentatives.

## Contrat navigateur initial

Le navigateur reçoit une notification, pas l'état autoritaire :

```ts
type RealtimeInvalidation = {
  messageId: string;
  resource: "friendships" | "campaign-invitations" | "campaigns";
};
```

Le schéma public appartient à `shared` et valide notamment l'UUID de `messageId` et le
vocabulaire fermé de `resource`. Le client conserve un ensemble borné d'identifiants
vus, ignore un doublon et invalide les familles de clés TanStack Query concernées.

Les événements de combat ne réutiliseront pas automatiquement cette invalidation.
Leurs révisions, projections publiques, privées et MJ seront spécifiées avant leur
implémentation.

## Rooms et autorisation

Chaque connexion authentifiée rejoint seulement `user:{userId}`. Les diffusions de
groupe ciblent la réunion des rooms personnelles calculées après relecture des données
autoritaires. Une exclusion ou rétrogradation retire donc le destinataire dès la
prochaine émission, même si sa socket est encore connectée.

Les rooms de campagne ne sont pas nécessaires à cette première tranche. Elles pourront
être ajoutées comme optimisation mesurée, sans remplacer la résolution d'audience.

## Sécurité du handshake et cycle de vie

- Socket.IO partage le serveur HTTP NestJS et accepte les cookies de session.
- Le handshake vérifie `Origin` contre la même liste blanche explicite que HTTP ; une
  origine absente ou inconnue est refusée en environnement navigateur.
- Le cookie d'accès est vérifié au handshake. Aucun rôle de campagne ne vient du JWT.
- Le serveur arme une déconnexion à l'instant `exp` du JWT. Le client renouvelle sa
  session par HTTP puis recrée une connexion authentifiée.
- Le logout déconnecte les sockets présentes dans `user:{userId}` et le client ferme sa
  connexion locale, sans registre parallèle de sockets pour le pilote mono-instance.
- Aucun événement entrant ne déclenche une commande métier dans cette tranche.
- Les limites de connexion et de débit échouent fermées et seront fixées avant
  exposition publique du tunnel.

La déconnexion au logout ne révoque pas rétroactivement un JWT d'accès copié. Avec le
modèle actuel, ce jeton reste utilisable au plus jusqu'à son expiration, comme pour
HTTP. Une révocation immédiate après reconnexion exigerait un identifiant de session
vérifiable ou une liste de révocation ; ce renforcement reste une **DÉCISION REQUISE**
avant d'élargir la menace couverte au vol d'un jeton déjà émis.

## Première tranche verticale

1. fermer le vocabulaire et la construction des messages d'outbox ;
2. rendre `campaignId` conditionnel sans l'introduire dans l'amitié ;
3. persister les faits d'amitié avec leur outbox dans la transaction métier ;
4. diffuser `friendships` vers les deux rooms personnelles autorisées ;
5. dédupliquer puis invalider listes et compteurs d'amitié côté front ;
6. étendre ensuite aux invitations et campagnes ;
7. spécifier séparément les événements de combat et de butin.

## Évolution au-delà du pilote

Le pilote reste mono-instance et sans Redis. Une seconde instance imposera un adapter
distribué, une réclamation d'outbox coordonnée et des tests de déconnexion multi-nœuds.
Ce changement ne modifiera ni les rooms personnelles, ni la résolution d'audience, ni
le contrat d'identité stable.
