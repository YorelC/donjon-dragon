# SPEC-SECURITY.md — donjon-dragon Security Hardening Plan

## Overview
Security hardening for donjon-dragon SaaS (NestJS + MongoDB + React + Socket.IO)
following OWASP best practices for multi-tenant AI-powered applications.

## Package 1: Auth & Guards ✅ [IN PROGRESS]
- [ ] JWT access+refresh with Passport strategy
- [ ] Global JwtAuthGuard
- [ ] RolesGuard (@Roles decorator)
- [ ] @Public() decorator
- [ ] @CurrentUser() decorator
- [ ] Login/register/refresh/me endpoints
- [ ] Auth entity + repository port
- [ ] TDD tests

## Package 2: App Security Middleware [PENDING]
- [ ] Helmet (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] CORS restreint à l'origine frontend
- [ ] Global Zod validation pipe (transform + whitelist)
- [ ] Rate limiting (@nestjs/throttler) per-tenant
- [ ] Request body size limiter
- [ ] Cookie-parser for refresh tokens (httpOnly)

## Package 3: Socket.IO Security [PENDING]
- [ ] JWT auth at handshake
- [ ] Room isolation per game session
- [ ] Gateway guards (verify sender permissions)
- [ ] Message validation against Zod schemas
- [ ] Rate limiting per socket connection
- [ ] Disconnect policy on abuse

## Package 4: Multi-Tenant Isolation [PENDING]
- [ ] Tenant context extractor middleware (from JWT)
- [ ] Tenant-scoped repositories (tenantId filter in all queries)
- [ ] Redis key prefixing per tenant
- [ ] IDOR prevention guard (resource ownership check)
- [ ] Tenant-aware rate limiting

## Package 5: Audit & Monitoring [PENDING]
- [ ] Structured logging with tenant context
- [ ] Audit trail for state-changing operations
- [ ] Security event logging
- [ ] Health check endpoint

## Package 6: Frontend Security [PENDING]
- [ ] Axios interceptors (attach JWT, 401 → refresh)
- [ ] Auth context + token storage
- [ ] ProtectedRoute / GuestRoute guards
- [ ] CSP headers via Helmet (server-side)
- [ ] Sanitized display of user-generated content