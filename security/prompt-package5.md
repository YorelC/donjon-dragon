# Prompt Package 5: Audit & Monitoring

Contexte: donjon-dragon, NestJS 10. Le module auth, multi-tenant, et les guards sont déjà en place.

1. Crée back/src/common/interface/interceptors/audit-log.interceptor.ts:
   - Intercepte toutes les requêtes POST/PUT/PATCH/DELETE
   - Log: { action, resource, resourceId, tenantId, userId, ip, userAgent, timestamp, body (sanitized, sans password/token) }
   - Store dans MongoDB collection 'audit_logs' (via un repository)

2. Crée back/src/audit/domain/:
   - audit-log.entity.ts: type AuditLogEntry { id, action, resource, resourceId, tenantId, userId, metadata, ip, timestamp }
   - audit.repository.port.ts: interface { log(entry), findByTenant(tenantId, filters), findByUser(userId, filters) }

3. Crée back/src/audit/infrastructure/:
   - audit-mongo.repository.ts: Mongoose implementation
   - audit-log.schema.ts: Mongoose schema avec index sur tenantId+timestamp, userId

4. Crée back/src/audit/interface/:
   - audit.controller.ts: GET /audit (admin only, filtré par tenantId), GET /audit/:userId
   - audit.module.ts: importe tout

5. Crée back/src/common/interface/filters/security-event.filter.ts:
   - Capture les événements de sécurité: login failed, access denied (403/401), rate limit exceeded, invalid token
   - Log dans audit_logs avec type: 'security_event'
   - Alert level: LOW (login failed), MEDIUM (repeated failures), HIGH (suspicious activity)

6. Modifie back/src/main.ts:
   - Ajoute un health check endpoint: GET /health → { status: 'ok', uptime, timestamp, version }
   - Protégé par JwtAuthGuard (admin only)

7. Tests:
   - audit-log.interceptor.test.ts: log entry format, sensitive data stripped
   - security-event.filter.test.ts: event capture, alert levels

Contraintes:
- Fichiers ≤ 150 lignes, fonctions ≤ 20 lignes, any interdit
- Kebab-case + role suffixes
- pnpm typecheck && pnpm test verts