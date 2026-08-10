---
paths:
  - "back/src/common/decorators/*.ts"
  - "back/src/common/filters/*.ts"
  - "back/src/common/pipes/*.ts"
  - "back/src/config/*.ts"
  - "back/src/scripts/*.script.ts"
---

# Plomberie, configuration et scripts

- `common/` et `config/` ne connaissent AUCUN module métier. C'est ce qui permet au
  filtre d'exception de mapper une erreur par sa NATURE (`DomainErrorKind`) et non
  par sa classe concrète : une nouvelle erreur métier est bien traduite sans qu'on
  touche à `common/`.
- Toute variable d'environnement passe par `env.validation.ts` (schéma Zod, validé au
  démarrage) puis par les namespaces de `configuration.ts`, lus avec
  `config.getOrThrow('jwt.secret')`. Un `process.env` ailleurs est un bug.
- Aucun défaut pour un secret : un `JWT_SECRET` absent doit faire échouer le boot, pas
  retomber sur une valeur connue publiquement.
- `scripts/` est un composition root assumé : il a le droit d'assembler des adapters
  et de posséder son horloge réelle. Ce qui lui reste interdit, c'est d'appeler un
  controller — le métier passe par les use-cases, sinon le script réimplémente le
  transport.
- Un script est rejouable : il réutilise l'id existant plutôt que d'en générer un
  nouveau à chaque exécution.
- Suffixe `.script.ts`.
