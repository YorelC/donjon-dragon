---
paths:
  - "back/src/modules/*/infrastructure/persistence/*.schema.ts"
---

# Persistance Mongoose

- Un `*.schema.ts` par collection : `new Schema<XxxSnapshot>(…, { versionKey: false })`
  plus `export const XXX_MODEL = 'Xxx'`, consommé par `MongooseModule.forFeature`.
- Le schéma parle le **snapshot persisté**, pas l'agrégat. La traduction est dans
  `*.mapper.ts`, seul endroit qui connaît les deux formes.
- L'`_id` Mongo n'est pas l'identité métier. L'id de l'agrégat est un champ `id` à
  part, `required` et `unique`.
- Les index et les contraintes d'unicité sont déclarés dans le fichier de schéma, à
  côté du champ qu'ils servent, jamais dans un script à part.
- `.lean()` par défaut sur toute lecture qui ne réécrit rien : sans lui, Mongoose
  hydrate un document complet dont on ne garde que les champs.
- Un secret ne se persiste jamais en clair. On stocke son hash (`passwordHash`,
  `tokenHash`) et on recherche PAR le hash, pas par la valeur présentée.
- Doc : `/techniques/mongodb`.
