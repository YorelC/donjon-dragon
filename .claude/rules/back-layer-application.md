---
paths:
  - "back/src/modules/*/application/use-cases/*.use-case.ts"
  - "back/src/modules/*/application/ports/*.port.ts"
  - "back/src/modules/*/application/*.ts"
  - "back/src/kernel/application/*.port.ts"
---

# Couche application

- Un fichier = un use-case, une seule méthode publique : `execute()`. Nom du
  fichier : `<verbe>-<objet>.use-case.ts`, dans `use-cases/`.
- Les dépendances arrivent par un port de `application/ports/`, injecté par un token
  `Symbol` déclaré dans le MÊME fichier que l'interface :
  `export const USER_REPOSITORY = Symbol('USER_REPOSITORY')`.
- Un port exprime le besoin de CE module, il ne miroite pas l'API d'un voisin. Si le
  port serait un 1:1 d'un autre module, appelle son use-case (exporté par son
  `.module.ts`) au lieu d'en recréer un. Ne jamais injecter le repository d'autrui.
- Un use-case ignore le transport : pas de `Request`, pas de statut HTTP, pas de
  cookie. Il doit rester appelable depuis un script.
- **Un seul `clock.now()` par opération**, stocké dans une variable et passé partout.
  Deux appels dans un même `execute()` datent la même opération de deux instants
  différents, et une règle à fenêtre (grâce du refresh) devient fausse en silence.
- Corps ≤ 20 lignes (ESLint le casse). Au-delà, extrais des méthodes privées nommées
  par leur intention, comme `consumePresentedToken` / `rotate`.
- La traduction agrégat vers DTO de sortie est un `*.mapper.ts` à la racine de la
  couche, pas un objet littéral construit dans le use-case.
