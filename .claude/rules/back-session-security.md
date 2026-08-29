---
paths:
  - "back/src/modules/auth/presentation/session-cookies.ts"
  - "back/src/modules/auth/presentation/strategies/*.strategy.ts"
  - "back/src/modules/auth/domain/token/**/*.ts"
  - "back/src/modules/auth/application/use-cases/{login,logout,refresh-tokens,verify-email}.use-case.ts"
  - "back/src/common/guards/*.guard.ts"
  - "back/src/common/security/*.ts"
  - "back/src/main.ts"
  - "back/src/typed-express.d.ts"
---

# Session et sécurité

**Tout ce qui suit est tranché et implémenté. Le rouvrir demande l'accord de Charly,
pas une initiative.** Les raisons détaillées sont dans les commentaires des fichiers
cités : lis-les avant de proposer un changement.

- La session vit en cookies : `access_token` et `refresh_token` en `httpOnly`, donc
  illisibles par un script et non exfiltrables par XSS. Aucun secret de session en
  en-tête, en corps de réponse, ni en `localStorage`. Le jeton CSRF est le seul
  cookie lisible, à dessein : le front doit le relire pour le renvoyer.
- `presentation/session-cookies.ts` décrit les cookies de session, seul et en entier.
  Un nouveau cookie s'ajoute là, avec ses options, ou nulle part.
- L'access token s'extrait du cookie (`ExtractJwt.fromExtractors`), et le payload
  passe par `TokenPayloadSchema.safeParse` : on ne caste pas un token signé mais
  malformé.
- CSRF : double-submit **signé** (HMAC liant le jeton à l'utilisateur, clé dérivée de
  `JWT_SECRET` par séparation de domaine, comparaison à durée constante). Ne le
  remplace pas par la version naïve : elle tombe dès qu'un sous-domaine hostile peut
  écrire un cookie sur le domaine parent.
- Refresh : secret opaque à usage unique rattaché à une lignée (`familyId`). Une
  réutilisation révoque toute la lignée, SAUF dans la fenêtre `REFRESH_GRACE_MS` où
  c'est une course entre onglets. `rotated` et `compromised` ne se confondent pas.
  TTL, fenêtre et politique de révocation sont des arbitrages, pas des réglages.
- CORS : liste explicite d'origines. `origin: '*'` est incompatible avec
  `credentials: true`, donc rendrait les cookies inexploitables.
- Aucun secret en dur, aucun `process.env` : `@config/configuration` + `env.validation.ts`.
- Un hash de mot de passe ne sort pas d'un use-case et ne se sérialise jamais.
- Doc : `/security/authentication`, `/recipes/passport`, `/guards`.
