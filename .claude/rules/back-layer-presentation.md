---
paths:
  - "back/src/modules/*/presentation/*.controller.ts"
  - "back/src/modules/*/presentation/strategies/*.strategy.ts"
---

# Couche presentation

- Entrée HTTP uniquement : `*.controller.ts`, stratégies Passport (`strategies/`),
  helpers de cookie (`session-cookies.ts`).
- Un controller appelle un use-case et rien d'autre. Aucun `if` métier, aucun accès
  repository, aucune construction d'agrégat.
- **Aucun `@UseGuards`.** `JwtAuthGuard`, `CsrfGuard` et `ThrottlerGuard` sont montés
  en `APP_GUARD` dans `app.module.ts`. Ce qui protège une route, c'est donc
  l'ABSENCE de `@Public()` : poser ce décorateur est une décision de sécurité.
- Les erreurs de domaine remontent telles quelles. `DomainExceptionFilter`
  (`APP_FILTER`) les traduit en statut, par leur nature. Ne réintroduis pas une
  cascade de `instanceof` dans un controller : elle a déjà été retirée une fois.
- Validation d'entrée : un schéma Zod de `@donjon-dragon/shared`, via `@ZodBody` /
  `@ZodQuery` (`common/decorators/zod-validated.decorator.ts`). Pas de
  `class-validator` : la contrainte vit dans le schéma partagé avec le front.
- Ne renvoie jamais un agrégat : passe par un mapper vers un schéma partagé. Un
  secret de session ne figure jamais dans un corps de réponse, seulement en cookie.
- Une route devinable et non authentifiée porte un `@Throttle` resserré (les routes
  d'auth sont à 10 par minute, contre 300 pour le garde-fou global).
- La presentation d'un module est son entrée HTTP, pas une API interne : un autre
  module ne la traverse jamais.
