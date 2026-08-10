---
paths:
  - "back/src/modules/*/*.module.ts"
  - "back/src/app.module.ts"
  - "back/src/kernel/infrastructure/*.module.ts"
---

# Modules NestJS et câblage

- Le `.module.ts` est le seul composition root d'un module : c'est là, et nulle part
  ailleurs, qu'un port est lié à un adapter concret.
  `{ provide: TOKEN, useClass: MongoXxxRepository }`, ou `useFactory` quand l'adapter
  prend une valeur de configuration (voir `PASSWORD_HASHER` et ses `bcryptRounds`).
- Ce qu'un module exporte, ce sont ses use-cases. **Un token de repository ne
  s'exporte jamais** : avec le repository en main, un autre module écrirait dans
  l'agrégat sans passer par ses invariants d'unicité.
- `MongooseModule.forFeature` se déclare ici : c'est du câblage DI, pas de l'accès
  aux données.
- L'ordre des `APP_GUARD` dans `app.module.ts` est porteur : `JwtAuthGuard` AVANT
  `CsrfGuard`, parce que la vérification du jeton CSRF a besoin de `request.user`
  pour confirmer qu'il appartient à cette session. Ne réordonne pas.
- Jamais de `forwardRef()`. Un cycle est une frontière à redécouper.
- `ClockModule` n'est volontairement pas `@Global()` : chaque module qui a besoin du
  temps l'importe, ce qui rend la dépendance visible dans son en-tête.
- Doc : `/modules`, `/fundamentals/custom-providers`.
