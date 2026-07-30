# Prompt Package 2: App Security Middleware

Contexte: donjon-dragon, NestJS 10. Les packages helmet, @nestjs/throttler, cookie-parser, @types/cookie-parser sont déjà installés dans back/. Le module auth (JwtAuthGuard, @Public(), @CurrentUser()) est déjà en place.

1. Modifie back/src/main.ts:
   - Ajoute helmet() middleware (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
   - CORS restreint: origin = process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true
   - Ajoute cookieParser() middleware
   - Ajoute ValidationPipe global: { whitelist: true, forbidNonWhitelisted: true, transform: true }
   - Ajoute un body-parser size limit: 1mb

2. Crée back/src/config/throttler.config.ts:
   - Configure @nestjs/throttler: limit=10, ttl=60000 (60s window)
   - Exporte le ThrottlerModule.forRoot avec ces options

3. Crée back/src/common/adapters/zod-validation.pipe.ts:
   - Pipe NestJS qui prend un Zod schema en paramètre
   - parse() avec le schema, transforme les erreurs Zod en HttpException 422
   - Utilisation: @Body(new ZodValidationPipe(loginSchema)) body: LoginDto

4. Modifie back/src/app.module.ts:
   - Importe ThrottlerModule.forRoot avec les options ci-dessus
   - Ajoute APP_PIPE provider pour le ValidationPipe global

5. Crée back/src/common/interface/filters/http-exception.filter.ts:
   - Global exception filter qui transforme toutes les erreurs en format standard: { statusCode, message, error, timestamp, path, tenantId }
   - Inclut le tenant context dans chaque réponse d'erreur

6. Crée back/src/common/interface/interceptors/tenant-context.interceptor.ts:
   - Extrait tenantId du JWT user (request.user)
   - Injecte tenantId dans le request (request.tenantId)
   - Log chaque requête avec tenant context

7. Tests:
   - zod-validation.pipe.test.ts: validation passes, validation fails, unknown fields stripped
   - http-exception.filter.test.ts: format standard, tenant context included

Contraintes:
- Fichiers ≤ 150 lignes, fonctions ≤ 20 lignes, any interdit
- Kebab-case + role suffixes
- pnpm typecheck && pnpm test verts