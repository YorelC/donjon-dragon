# Plan d'implémentation — Spec 003 (suppression ami + badge demandes)

**Spécification** : `specs/003-friends-list-modal-badge.md`
**ADR** : `docs/adr/001-friends-count-endpoint.md`
**Ticket** : t_749170f0
**UA couvertes** : UA-003 (DELETE), UA-008 (count)

---

## Pré-requis (déjà livrés par l'architecte)

- `shared/src/friendship-schema.ts` : `DeleteFriendParamsSchema`, `PendingReceivedCountSchema`
- `back/src/friendship/03-domain/friendship.repository.port.ts` : `countPendingReceived()`
- `back/src/friendship/04-infrastructure/mongo-friendship.repository.ts` : `countPendingReceived()` implémenté
- `back/src/friendship/04-infrastructure/in-memory-friendship.repository.ts` : `countPendingReceived()` implémenté

---

## Étapes d'implémentation

### E-001 — [FAIT] Implémenter `countPendingReceived` dans MongoFriendshipRepository
- **Statut** : ✅ Déjà livré par l'architecte (implémentation triviale pour faire passer le typecheck).
- **Fichier** : `back/src/friendship/04-infrastructure/mongo-friendship.repository.ts`
- **Action** : ~~Ajouter la méthode~~ Déjà fait.
- **INV** : INV-001
- **Contenu attendu** (~5 lignes) :
  ```ts
  async countPendingReceived(userId: string): Promise<number> {
    return this.model.countDocuments({
      status: 'pending',
      recipientId: userId,
    });
  }
  ```

### E-002 — [FAIT] Implémenter `countPendingReceived` dans InMemoryFriendshipRepository
- **Statut** : ✅ Déjà livré par l'architecte.
- **Fichier** : `back/src/friendship/04-infrastructure/in-memory-friendship.repository.ts`
- **Action** : ~~Ajouter la méthode~~ Déjà fait.
- **INV** : INV-001
- **Contenu attendu** (~5 lignes) :
  ```ts
  async countPendingReceived(userId: string): Promise<number> {
    return [...this.friendships.values()].filter(
      (f) => f.status === 'pending' && f.recipientId === userId,
    ).length;
  }
  ```

### E-003 — Créer le use case CountPendingReceivedUseCase
- **Fichier** : `back/src/friendship/02-application/count-pending-received.use-case.ts` (NOUVEAU)
- **Action** : Créer la classe avec `execute(dto: { userId: string }): Promise<{ count: number }>`.
- **INV** : INV-001
- **Contenu attendu** (~20 lignes) :
  ```ts
  import type { FriendshipRepositoryPort } from '../03-domain/friendship.repository.port';
  import type { PendingReceivedCount } from '@donjon-dragon/shared/friendship-schema';

  export interface CountPendingReceivedDto {
    userId: string;
  }

  export class CountPendingReceivedUseCase {
    constructor(private readonly friendshipRepo: FriendshipRepositoryPort) {}

    async execute(dto: CountPendingReceivedDto): Promise<PendingReceivedCount> {
      const count = await this.friendshipRepo.countPendingReceived(dto.userId);
      return { count };
    }
  }
  ```

### E-004 — Ajouter l'endpoint GET /api/friends/requests/incoming/count
- **Fichier** : `back/src/friendship/01-interface/friendship.controller.ts`
- **Action** : Ajouter une méthode `countPendingReceived()` avec `@Get('requests/incoming/count')`.
- **INV** : INV-001
- **Piège** : L'ordre des décorateurs `@Get()` compte. `@Get('requests/incoming/count')` doit être placé AVANT `@Get('requests/incoming')` sinon NestJS route `.../count` vers `listPendingReceived`.
- **Contenu attendu** (~12 lignes) :
  ```ts
  @Get('requests/incoming/count')
  async countPendingReceived(@CurrentUser() user: TokenPayload) {
    return this.countPendingReceivedUseCase.execute({ userId: user.userId });
  }
  ```
  + injection dans le constructeur :
  ```ts
  @Inject(CountPendingReceivedUseCase)
  private countPendingReceivedUseCase: CountPendingReceivedUseCase,
  ```
  + import de `CountPendingReceivedUseCase`.

### E-005 — Enregistrer CountPendingReceivedUseCase dans le module
- **Fichier** : `back/src/friendship/01-interface/friendship.module.ts`
- **Action** : Ajouter un bloc provider pour `CountPendingReceivedUseCase`.
- **Contenu attendu** (~8 lignes) :
  ```ts
  {
    provide: CountPendingReceivedUseCase,
    useFactory: (friendshipRepo: FriendshipRepositoryPort) => {
      return new CountPendingReceivedUseCase(friendshipRepo);
    },
    inject: [FRIENDSHIP_REPOSITORY],
  },
  ```
  + import.

### E-006 — Ajouter la route API côté front
- **Fichier** : `front/src/shared/constants/api-routes.ts`
- **Action** : Ajouter `incomingCount` dans `API_ROUTES.friends`.
- **Contenu attendu** (~1 ligne) :
  ```ts
  incomingCount: "/api/friends/requests/incoming/count",
  ```

### E-007 — Créer le hook useReceivedCount
- **Fichier** : `front/src/pages/profile/friends/_internal/queries/use-received-count.ts` (NOUVEAU)
- **Action** : Créer un hook TanStack Query qui appelle `API_ROUTES.friends.incomingCount`.
- **INV** : INV-001
- **Contenu attendu** (~15 lignes) :
  ```ts
  import { useQuery } from "@tanstack/react-query";
  import { api } from "@/shared/api/api";
  import { API_ROUTES } from "@/shared/constants/api-routes";
  import type { PendingReceivedCount } from "@donjon-dragon/shared";

  export function useReceivedCount() {
    return useQuery({
      queryKey: ["friends", "received", "count"],
      queryFn: () => api.get<PendingReceivedCount>(API_ROUTES.friends.incomingCount),
      staleTime: 30_000, // 30s — badge n'a pas besoin de temps réel
      retry: false,
    });
  }
  ```

### E-008 — Modifier FriendsView pour afficher le badge
- **Fichier** : `front/src/pages/profile/friends/_internal/views/friends.view.tsx`
- **Action** : Ajouter une prop `receivedCount?: number` et afficher un badge dans le `TabsTrigger` "Reçues".
- **INV** : UA-006, UA-007, UA-010
- **Piège** : La view est PURE — pas de hook. Le container parent injecte `receivedCount`.
- **Contenu attendu** (~20 lignes) :
  - Props : `+ receivedCount?: number`
  - Passer `receivedCount` à `FriendsTabsList` (nouvelle prop)
  - Dans `FriendsTabsList` : si `receivedCount > 0`, afficher un badge (max "9+" si >9, rien si 0)

### E-009 — Modifier FriendsContainer pour injecter le count
- **Fichier** : `front/src/pages/profile/friends/_internal/containers/friends.container.tsx`
- **Action** : Utiliser `useReceivedCount()` et passer `receivedCount` à `FriendsView`.
- **Contenu attendu** (~5 lignes) :
  ```ts
  const { data: countData } = useReceivedCount();
  // ...
  <FriendsView
    // ...props existantes
    receivedCount={countData?.count}
  />
  ```

---

## Ordre d'exécution

```
E-001 → E-002 → E-003 → E-004 → E-005 → [pnpm typecheck back] → E-006 → E-007 → E-008 → E-009 → [pnpm typecheck all]
```

Les étapes E-001 et E-002 sont indépendantes (peuvent être parallélisées).
Les étapes E-006 à E-009 sont côté front, dépendent du back compilé (types partagés).

---

## Vérification

```bash
pnpm typecheck && pnpm lint && pnpm test
```

**Cas limites à tester (testeur)** :
- Count = 0 → badge caché (UA-010)
- Count = 1..9 → badge "{n}" (UA-006)
- Count ≥ 10 → badge "9+" (UA-007)
- Count après acceptation d'une demande → décrémenté
- Count après refus d'une demande → décrémenté
- DELETE avec friendshipId invalide (pas un UUID) → 400 Bad Request
- DELETE d'un friendshipId inexistant → 404 Not Found
- DELETE par un non-participant → 403 Forbidden

---

## Matrice UA → INV → Étapes

| UA | INV | Étapes |
|---|---|---|
| UA-003 (DELETE) | INV-002 | E-004 (le contrôleur existant reste inchangé ; seul le schéma Zod est ajouté au shared) |
| UA-008 (count query) | INV-001 | E-001 à E-007 |
| UA-006 (badge >0) | — | E-008, E-009 |
| UA-007 (badge 9+) | — | E-008 |
| UA-010 (badge caché si 0) | — | E-008 |