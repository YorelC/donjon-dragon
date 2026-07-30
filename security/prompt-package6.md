# Prompt Package 6: Frontend Security

Contexte: donjon-dragon, React 18 + Vite + Zustand + TanStack Query + React Router + Socket.IO client. L'auth back-end avec JWT est déjà en place.

1. Crée front/src/features/auth/:
   - auth.context.ts: AuthContext avec: user, login(email, password), register(email, username, password), logout(), refreshToken()
   - auth.store.ts: Zustand store: { user, accessToken, isAuthenticated, isLoading, error }
   - auth.service.ts: API calls: POST /auth/login, /auth/register, /auth/refresh, /auth/me, GET /auth/me
   - auth.types.ts: types partagés (LoginDto, RegisterDto, etc.)

2. Crée front/src/features/auth/hooks/:
   - use-auth.ts: hook principal: expose login, logout, register, user, isAuthenticated
   - use-login.ts: hook pour le login form (react-hook-form + Zod)
   - use-register.ts: hook pour le register form

3. Crée front/src/features/auth/components/:
   - login.view.tsx: formulaire email + password
   - login.container.tsx: connecte use-login → login.view
   - register.view.tsx: formulaire email + username + password
   - register.container.tsx: connecte use-register → register.view

4. Crée front/src/features/auth/guards/:
   - protected-route.tsx: wrapper React Router, redirige vers /login si pas auth
   - guest-route.tsx: wrapper React Router, redirige vers /dashboard si déjà auth

5. Crée front/src/lib/api.ts:
   - Axios instance avec baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
   - Interceptor request: attach JWT (Authorization: Bearer <token>)
   - Interceptor response: 401 → try refresh → retry, si refresh fail → logout
   - Token storage: httpOnly cookies (via back-end) + memory fallback

6. Modifie front/src/App.tsx:
   - Wrap with AuthProvider
   - Routes: /login (GuestRoute), /register (GuestRoute), /dashboard (ProtectedRoute), / (redirect)

7. CSP (Content-Security-Policy):
   - Déjà configuré côté serveur via helmet dans le Package 2
   - Vérifier que les directives sont correctes pour Vite dev: 'self', 'unsafe-inline' pour dev only

8. Tests:
   - use-auth.test.ts: login, logout, refresh
   - protected-route.test.ts: redirect si pas auth
   - api.test.ts: interceptor attach token, 401 → refresh

Contraintes:
- Fichiers ≤ 150 lignes, fonctions ≤ 20 lignes, any interdit
- Container/Presenter pattern: containers appellent hooks, views sont pures
- Kebab-case + role suffixes
- pnpm typecheck && pnpm test verts