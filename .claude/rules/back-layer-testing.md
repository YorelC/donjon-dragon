---
paths:
  - "back/src/**/*.test.ts"
  - "back/src/modules/*/testing/*.ts"
  - "back/src/kernel/testing/*.ts"
---

# Tests back

- Vitest. Le test vit à côté du fichier testé, extension `.test.ts`. Pas de dossier
  `__tests__/`, pas de `.spec.ts` au back : `.spec.ts` désigne Playwright, côté front.
- Les doubles vivent dans `<module>/testing/` : `in-memory-*.repository.ts`,
  `stub-*.ts`, `*.fixture.ts`. Un double implémente le port ; il ne s'appuie jamais
  sur l'adapter réel, sinon le test valide ce qu'il prétend remplacer.
- Un use-case se teste en instanciant ses doubles à la main. On ne monte un module
  Nest (`@nestjs/testing`) que pour tester un CONTROLLER, et c'est le seul usage dans
  tout le back : `friendship.controller.test.ts`.
- Le temps se contrôle par `FixedClock` (`kernel/testing/fixed-clock.ts`), jamais en
  moquant `Date`. Une règle à fenêtre se teste en faisant avancer l'horloge.
- Un paramètre imposé par un port et volontairement ignoré se préfixe `_` : c'est la
  façon documentée de le dire, et ESLint l'accepte à cette condition.
- `max-lines-per-function` est désactivé sur les tests : un `describe` est un
  conteneur, pas une unité de logique.
- Aucun e2e au back. Les parcours de bout en bout sont couverts par Playwright dans
  `front/e2e/`.
