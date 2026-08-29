---
paths:
  - "back/src/modules/realtime/**/*.ts"
  - "back/src/modules/*/application/realtime-projection.ts"
---

# Temps réel — diffusion après commit

Le document normatif est `docs/TECHNICAL-REALTIME-5D.md`. Ce qui suit en est la
traduction dans le code ; en cas de divergence, c'est la 5D qui fait foi.

- **Rien ne se diffuse avant le commit.** Une mutation écrit son état métier ET son
  message d'outbox dans la même transaction. Le relais ne lit que l'outbox, jamais
  l'agrégat, et jamais depuis le use-case.
- **Le relais route, il n'interprète pas.** Il ne connaît aucun fait métier : il
  sélectionne une table de projection par `ownerModule`, puis y cherche le fait.
- **Chaque module possède son vocabulaire de faits et sa projection**, dans
  `application/realtime-projection.ts`. Le `Record` est TOTAL sur ce vocabulaire :
  ajouter un fait sans dire ce qu'il invalide ne compile pas. C'est ce qui empêche
  un fait connu de partir en quarantaine par oubli — la quarantaine est terminale,
  elle ne se rejoue pas. Ne remonte pas ce vocabulaire dans `kernel/` : le socle
  partagé ne connaît aucun métier.
- **Une audience qui dépend d'un rôle ou d'une adhésion se relit à chaque émission**,
  depuis les données autoritaires. Un membre exclu disparaît ainsi de la diffusion
  suivante, même si sa socket est encore ouverte. Une audience figée dans le message
  ferait l'inverse. Seuls `target-user` et `friendship-participants` portent leurs
  destinataires dans l'enveloppe, parce qu'ils sont immuables.
- **Tables fermées, et lues par propriété propre.** `ownerModule` et `factType`
  viennent de la base : `constructor` ou `__proto__` rendraient une propriété
  héritée si on interrogeait l'objet naïvement, et le message boucleraient au lieu
  de terminer en quarantaine. `Object.hasOwn`, ou une `Map`.
- **Une politique inconnue, une enveloppe incohérente ou une projection absente ne
  diffuse rien et termine en `quarantined`.** Jamais de diffusion par défaut : une
  faute de frappe ne doit pas devenir un message envoyé à tout le monde.
- **Une room est une adresse technique, pas une preuve d'autorisation.** Chaque
  connexion ne rejoint que `user:{userId}` ; une diffusion de groupe est la réunion
  de rooms personnelles calculée après relecture.
- Le navigateur reçoit une invalidation, jamais l'état autoritaire. Le vocabulaire
  de `resource` est fermé et vit dans `shared` : l'élargir est une décision.
- Le relais libère son timer sur `onModuleDestroy`, AVANT la fermeture des
  connexions, et attend le poll en cours. `onApplicationShutdown` s'exécute trop
  tard : un message réclamé y resterait `processing` jusqu'à expiration du bail.
