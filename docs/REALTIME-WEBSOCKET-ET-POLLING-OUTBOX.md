# WebSocket et polling de l'outbox

## Réponse courte

Le navigateur reçoit bien les notifications en temps réel par WebSocket avec
Socket.IO. Il ne sonde pas régulièrement l'API.

Le polling existe à un autre endroit : le back interroge périodiquement MongoDB
pour détecter les nouveaux messages persistés dans l'outbox. Une fois un message
réclamé, il le diffuse au navigateur par WebSocket.

```text
mutation HTTP
  -> transaction MongoDB
     -> état métier + message d'outbox
  -> commit
  -> polling MongoDB par RealtimeOutboxRelay
  -> diffusion Socket.IO
  -> navigateur
```

Les deux mécanismes ne s'opposent donc pas : le polling relie MongoDB au relais,
le WebSocket relie le relais au navigateur.

## Où se trouve le polling

`back/src/modules/realtime/infrastructure/realtime-outbox.relay.ts` déclare :

```ts
const POLL_INTERVAL_MS = 500;
```

Au démarrage de l'application, le relais arme un intervalle et effectue aussi une
première lecture immédiate :

```ts
onApplicationBootstrap(): void {
  this.timer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
  void this.poll();
}
```

Chaque poll appelle finalement `claimOne()`. Cette méthode utilise
`findOneAndUpdate()` pour réclamer atomiquement le prochain message disponible et
poser un bail de traitement.

Le drapeau `polling` empêche deux drainages de la même instance de s'exécuter en
parallèle. Un cycle traite au maximum vingt messages, un par un.

## Où se trouve le WebSocket

`back/src/modules/realtime/presentation/realtime.gateway.ts` expose le gateway
Socket.IO. Une connexion authentifiée rejoint uniquement la room personnelle de
l'utilisateur :

```text
user:{userId}
```

Après avoir réclamé et validé un message d'outbox, le relais appelle le port
`RealtimeNotifierPort`. Son adapter Socket.IO diffuse alors une notification
minimale aux rooms autorisées.

Le navigateur déduplique les notifications avec leur `messageId`, puis invalide
les données TanStack Query concernées. MongoDB et les routes HTTP restent la source
de vérité ; le message WebSocket demande seulement au client de relire cette
source.

## Pourquoi une outbox est utilisée

Diffuser directement dans le WebSocket pendant une mutation créerait une course :
le client pourrait recevoir une notification alors que la transaction MongoDB
n'est pas encore validée, ou recevoir une notification pour une transaction qui
échoue ensuite.

L'outbox garantit l'ordre suivant :

1. l'état métier et le message sont écrits dans la même transaction ;
2. la transaction est validée ;
3. le relais lit ensuite le message ;
4. la notification est diffusée.

La livraison est au moins une fois : un message peut être diffusé plusieurs fois,
mais son identité reste stable et le client sait ignorer un doublon.

Ce contrat est défini dans
[`TECHNICAL-REALTIME-5D.md`](./TECHNICAL-REALTIME-5D.md) et
[`DEC-018`](./DECISIONS/018-realtime-after-commit.md). Ces documents imposent la
diffusion après commit et l'identité stable ; ils n'imposent pas que le réveil du
relais utilise nécessairement du polling.

## Conséquences de l'implémentation actuelle

Avec un intervalle de 500 ms :

- une instance interroge l'outbox deux fois par seconde lorsqu'elle est vide ;
- une notification attend normalement au plus un intervalle avant d'être réclamée,
  hors temps de traitement et contention ;
- chaque message traité provoque actuellement une requête de réclamation puis une
  requête de changement de statut ;
- augmenter le nombre d'instances multiplierait le polling, même si la réclamation
  atomique empêche normalement deux instances de posséder simultanément le même
  message.

Le pilote validé est mono-instance. Le coût réel doit être mesuré sur une base
représentative avant de modifier le mécanisme.

## Alternatives possibles

Supprimer le polling MongoDB demanderait un autre mécanisme de réveil :

| Option | Avantage | Limite |
|---|---|---|
| MongoDB Change Streams | Réveil proche de l'événement sans broker séparé | Dépend du mode de déploiement MongoDB et exige une stratégie de reprise du flux |
| Signal local après commit | Très simple en mono-instance | Un signal perdu ou un redémarrage exige toujours un balayage de reprise de l'outbox |
| Signal local + polling de secours | Réduit la latence et conserve la reprise | Deux mécanismes à maintenir et tester |
| Redis Streams ou broker de messages | Adapté à plusieurs instances et à une charge élevée | Nouvelle dépendance et exploitation supplémentaire |
| Polling avec backoff | Conserve l'architecture actuelle et réduit les lectures à vide | Augmente la latence après une longue période inactive |

Ces options sont des recommandations possibles, pas des décisions validées. Un
changement doit préserver les invariants de l'outbox : diffusion après commit,
reprise après panne, réclamation coordonnée et livraison au moins une fois.

