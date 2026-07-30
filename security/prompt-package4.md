# Prompt Package 4: Multi-Tenant Isolation

Contexte: donjon-dragon, NestJS 10 + MongoDB. Le module auth (JWT, guards, @CurrentUser()) est déjà en place. Architecture hexagonale.

1. Crée back/src/common/domain/tenant-aware.repository.port.ts:
   - Interface générique avec méthodes tenant-scopées: findAll(tenantId), findById(id, tenantId), create(data, tenantId), update(id, data, tenantId), delete(id, tenantId)
   - Toutes les méthodes prennent tenantId en paramètre, jamais trusté du client

2. Crée back/src/common/infrastructure/tenant-mongo.repository.ts:
   - Implémentation générique pour Mongoose
   - Chaque query ajoute { tenantId } au filtre
   - Empêche les queries sans filtre tenantId (throw si absent)

3. Crée back/src/common/interface/interceptors/tenant-context.interceptor.ts:
   - Extrait tenantId de request.user (JWT payload)
   - Set request.tenantId pour usage dans les contrôleurs
   - Log chaque requête avec le tenant context

4. Crée back/src/common/interface/guards/tenant-ownership.guard.ts:
   - Vérifie que la resource demandée appartient au tenant du user
   - Utilise le repository pour check: resource.tenantId === user.tenantId
   - Throw 403 Forbidden si mismatch

5. Modifie les repositories existants (character, combat):
   - CharacterRepository: ajoute tenantId dans tous les queries
   - CombatRepository: ajoute tenantId dans tous les queries
   - Les fakes in-memory aussi

6. Cache (Redis) isolation:
   - Crée un service de cache qui préfixe toutes les clés avec tenantId
   - back/src/common/infrastructure/tenant-cache.service.ts

7. Tests:
   - tenant-ownership.guard.test.ts: ownership ok, mismatch, pas de user
   - tenant-cache.service.test.ts: key prefixing, isolation

Contraintes:
- Fichiers ≤ 150 lignes, fonctions ≤ 20 lignes, any interdit
- Kebab-case + role suffixes
- pnpm typecheck && pnpm test verts