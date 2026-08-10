---
paths:
  - "back/src/modules/*/infrastructure/**/*.repository.ts"
  - "back/src/modules/*/infrastructure/persistence/*.mapper.ts"
  - "back/src/modules/*/infrastructure/{crypto,mail,token,acl}/*.ts"
  - "back/src/kernel/infrastructure/*.ts"
---

# Couche infrastructure

- Adapters sortants uniquement, rangés par nature : `persistence/`, `crypto/`,
  `mail/`, `token/`, `acl/`.
- Le nom dit la techno qu'on remplacerait : `mongo-user.repository.ts`,
  `bcrypt-password-hasher.ts`, `nodemailer-email-sender.ts`, `jwt-token.service.ts`.
- Chaque adapter écrit `implements XxxPort` explicitement. C'est ce qui casse au
  typecheck le jour où le port bouge, au lieu de diverger en silence.
- Un mapper traduit snapshot vers agrégat et retour. **Aucun document Mongoose ne
  franchit cette couche** : ce qui sort, c'est l'agrégat.
- Un adapter est bête : pas de règle métier, pas de décision. Un `if` métier ici est
  au mauvais endroit, remonte-le dans le domaine ou le use-case.
- L'infrastructure d'un module est privée. Personne ne l'importe depuis un autre
  module, pas même pour du câblage DI.
