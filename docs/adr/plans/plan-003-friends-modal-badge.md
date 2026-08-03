# Plan d'implémentation — Spec 003 (suppression ami + badge demandes)

**Spécification** : `specs/003-friends-list-modal-badge.md`
**ADR** : `docs/adr/001-friends-count-endpoint.md`, `docs/adr/002-friends-modal-optimistic-delete.md`
**Ticket** : t_68908c1c
**UA couvertes** : UA-001 à UA-010

---

## Pré-requis (déjà livrés par l'architecte précédent)

- `shared/src/friendship-schema.ts` : `DeleteFriendParamsSchema`, `PendingReceivedCountSchema` + matrice UA→INV
- `back/src/friendship/03-domain/friendship.repository.port.ts` : `countPendingReceived()` (INV-001)
- `back/src/friendship/04-infrastructure/mongo-friendship.repository.ts` : `countPendingReceived()` implémenté
- `back/src/friendship/04-infrastructure/in-memory-friendship.repository.ts` : `countPendingReceived()` implémenté
- `back/src/friendship/02-application/remove-friend.use-case.ts` : use case DELETE existant
- `back/src/friendship/01-interface/friendship.controller.ts` : endpoint `DELETE :friendshipId` existant (UA-003)
- `back/src/friendship/01-interface/friendship.module.ts` : module câblé avec tous les use cases sauf `CountPendingReceivedUseCase`

---

## Phase 1 — Back-end : endpoint count (UA-008)

### E-001 — [FAIT] Implémenter `countPendingReceived` dans MongoFriendshipRepository
- **Statut** : ✅ Déjà livré.
- **Fichier** : `back/src/friendship/04-infrastructure/mongo-friendship.repository.ts`
- **INV** : INV-001

### E-002 — [FAIT] Implémenter `countPendingReceived` dans InMemoryFriendshipRepository
- **Statut** : ✅ Déjà livré.
- **Fichier** : `back/src/friendship/04-infrastructure/in-memory-friendship.repository.ts`
- **INV** : INV-001

### E-003 — Créer le use case CountPendingReceivedUseCase
- **Fichier** : `back/src/friendship/02-application/count-pending-received.use-case.ts` (NOUVEAU)
- **Action** : Créer la classe avec `execute(dto: { userId: string }): Promise<PendingReceivedCount>`.
- **INV** : INV-001
- **Contenu attendu** (~15 lignes) :
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
- **Contenu attendu** (~15 lignes) : ajouter dans la classe :
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
- **Contenu attendu** (~10 lignes) :
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

### E-005b — Ajouter l'index MongoDB { recipientId: 1, status: 1 }
- **Fichier** : `back/src/friendship/04-infrastructure/friendship.schema.ts`
- **Action** : Ajouter `FriendshipSchema.index({ recipientId: 1, status: 1 });` après les index existants.
- **Justification** : ADR 001 — optimise `countPendingReceived` (countDocuments sur `{ status: 'pending', recipientId: userId }`). Index-only query, pas de fetch de documents.
- **INV** : INV-001
- **Contenu attendu** (~1 ligne) :

---

## Phase 2 — Front : hook de compteur + badge (UA-006, UA-007, UA-008, UA-010)

### E-006 — Ajouter la route API côté front
- **Fichier** : `front/src/shared/constants/api-routes.ts` (MODIFIER si existe, sinon NOUVEAU dans `_internal/`)
- **Action** : Ajouter `incomingCount` dans l'objet `friends` de `API_ROUTES`.
- **Contenu attendu** (~1 ligne) :
```ts
incomingCount: "/api/friends/requests/incoming/count",
```

### E-007 — Créer le hook useReceivedCount
- **Fichier** : `front/src/pages/profile/friends/_internal/queries/use-received-count.ts` (NOUVEAU)
- **Action** : Créer un hook TanStack Query qui appelle `API_ROUTES.friends.incomingCount`.
- **INV** : INV-001
- **Contenu attendu** (~20 lignes) :
```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { PendingReceivedCount } from "@donjon-dragon/shared";

export function useReceivedCount() {
  return useQuery({
    queryKey: ["friends", "received", "count"],
    queryFn: () => api.get<PendingReceivedCount>(API_ROUTES.friends.incomingCount),
    staleTime: 30_000,
    retry: false,
  });
}
```

### E-008 — Modifier FriendsView pour afficher le badge
- **Fichier** : `front/src/pages/profile/friends/_internal/views/friends.view.tsx`
- **Action** : Ajouter une prop `receivedCount?: number` et afficher un `Badge` dans le `TabsTrigger` "Reçues".
- **INV** : INV-007, INV-008
- **Piège** : La view est PURE — pas de hook. Le container parent injecte `receivedCount`. Le badge est conditionnel : `{receivedCount > 0 && <Badge>...</Badge>}`.
- **Contenu attendu** (~20 lignes) :
  - Props : `+ receivedCount?: number`
  - Dans le `TabsTrigger value="received"` :
```tsx
Reçues
{receivedCount !== undefined && receivedCount > 0 && (
  <Badge
    variant="default"
    aria-label={
      receivedCount > 9
        ? "Plus de 9 demandes en attente"
        : `${receivedCount} demandes en attente`
    }
  >
    {receivedCount > 9 ? "9+" : receivedCount}
  </Badge>
)}
```

### E-009 — Modifier FriendsContainer pour injecter le count et le refetch
- **Fichier** : `front/src/pages/profile/friends/_internal/containers/friends.container.tsx`
- **Action** : Utiliser `useReceivedCount()` + passer `receivedCount` à `FriendsView`. Gérer le refetch au clic sur l'onglet "Reçues" (UA-009).
- **INV** : UA-008, UA-009
- **Contenu attendu** (~10 lignes) :
```ts
const { data: countData, refetch: refetchCount } = useReceivedCount();
// ...
const handleTabChange = (value: string) => {
  if (value === "received") refetchCount();
};
// ...
<FriendsView
  receivedCount={countData?.count}
  onTabChange={handleTabChange}
  // ...props existantes
/>
```

---

## Phase 3 — Front : modale de suppression + mutation optimiste (UA-001 à UA-005)

### E-010 — Créer le hook useRemoveFriend (mutation optimiste)
- **Fichier** : `front/src/pages/profile/friends/_internal/hooks/use-remove-friend.ts` (NOUVEAU)
- **Action** : Mutation TanStack Query avec `onMutate` (retrait optimiste), `onError` (rollback + toast), `onSuccess` (toast succès + invalidation count).
- **INV** : INV-002, INV-003, INV-004
- **Pièges** :
  - Le snapshot `previous` doit capturer TOUTE la liste (pas juste l'élément supprimé) — pour le rollback intégral.
  - `cancelQueries` avant le `setQueryData` pour éviter une race condition.
  - Le toast d'erreur utilise le message exact de la spec : `"Erreur lors de la suppression. Veuillez réessayer."`
  - Invalider aussi `["friends", "received", "count"]` au `onSettled` (un ami supprimé ne génère pas de demande, mais par hygiène).
- **Contenu attendu** (~30 lignes) :
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import type { Friendship } from "@donjon-dragon/shared";

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.delete(API_ROUTES.friends.remove(friendshipId)),
    onMutate: async (friendshipId) => {
      await queryClient.cancelQueries({ queryKey: ["friends"] });
      const previous = queryClient.getQueryData<Friendship[]>(["friends"]);
      queryClient.setQueryData<Friendship[]>(["friends"], (old) =>
        old?.filter((f) => f.id !== friendshipId) ?? []
      );
      return { previous };
    },
    onError: (_err, _friendshipId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["friends"], context.previous);
      }
      toast.error("Erreur lors de la suppression. Veuillez réessayer.");
    },
    onSuccess: () => {
      toast.success("Ami supprimé");
      queryClient.invalidateQueries({ queryKey: ["friends", "received", "count"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}
```

### E-011 — Modifier FriendsListView pour wrapper AlertDialog
- **Fichier** : `front/src/pages/profile/friends/_internal/views/friends-list.view.tsx`
- **Action** : Wrapper le bouton "Supprimer" dans un `AlertDialog`. Ajouter les props `selectedFriendDisplayName`, `isDeletePending`, `onDeleteClick`, `onDeleteConfirm`, `onDeleteCancel`.
- **INV** : INV-005, INV-006
- **Piège** : Le `AlertDialogTrigger` est sur le bouton "Supprimer" de chaque carte. L'état `open` est contrôlé par le container via une prop `selectedFriendId` — on utilise `AlertDialog` en mode contrôlé (`open` + `onOpenChange`).
- **Contenu attendu** (~35 lignes) :
  - Ajouter aux props : `selectedFriendId: string | null`, `friendDisplayName: (id: string) => string`, `isDeletePending: boolean`, `onDeleteClick: (id: string) => void`, `onDeleteConfirm: () => void`, `onOpenChange: (open: boolean) => void`
  - Remplacer le bouton "Supprimer" dans chaque carte par :
```tsx
<AlertDialog open={selectedFriendId === friend.id} onOpenChange={(open) => {
  if (!open) onDeleteCancel();
  else onDeleteClick(friend.id);
}}>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm" disabled={isDeletePending}>
      Supprimer
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogTitle>Supprimer {friendDisplayName(friend.id)} ?</AlertDialogTitle>
      <AlertDialogDescription>
        Voulez-vous vraiment supprimer {friendDisplayName(friend.id)} ?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={onDeleteCancel}>Annuler</AlertDialogCancel>
      <AlertDialogAction variant="destructive" onClick={onDeleteConfirm} disabled={isDeletePending}>
        Supprimer
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### E-012 — Modifier FriendsListContainer pour gérer l'état de la modale
- **Fichier** : `front/src/pages/profile/friends/_internal/containers/friends-list.container.tsx`
- **Action** : Ajouter l'état `selectedFriendId`, appeler `useRemoveFriend()`, connecter les callbacks aux props de la view.
- **INV** : INV-003, INV-005
- **Contenu attendu** (~25 lignes) :
```ts
const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
const { mutate: removeFriend, isPending: isDeletePending } = useRemoveFriend();

const handleDeleteClick = (id: string) => setSelectedFriendId(id);
const handleDeleteConfirm = () => {
  if (selectedFriendId) {
    removeFriend(selectedFriendId);
    setSelectedFriendId(null);
  }
};
const handleDeleteCancel = () => setSelectedFriendId(null);

// ...
<FriendsListView
  selectedFriendId={selectedFriendId}
  isDeletePending={isDeletePending}
  onDeleteClick={handleDeleteClick}
  onDeleteConfirm={handleDeleteConfirm}
  onDeleteCancel={handleDeleteCancel}
  friendDisplayName={(id) => /* lookup displayName from data */ }
  // ...props existantes
/>
```

---

## Ordre d'exécution

```
Phase 1 (back) :  E-003 → E-004 → E-005 → [pnpm typecheck back]
Phase 2 (front) : E-006 → E-007 → E-008 → E-009 → [pnpm typecheck front]
Phase 3 (front) : E-010 → E-011 → E-012 → [pnpm typecheck all]
```

Les phases 1 et 2 sont indépendantes (peuvent être parallélisées).
La phase 3 dépend conceptuellement de la phase 2 (le badge est un prérequis visuel de la page amis) mais techniquement indépendante.

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
- Modale : le bouton "Supprimer" est disabled pendant la mutation (pas de double-clic)
- Modale : Escape ferme sans appel API
- Modale : clic "Annuler" ferme sans appel API
- Modale : après échec API, l'ami réapparaît à sa position d'origine
- Toast succès : message exact "Ami supprimé", vert, 3 secondes
- Toast erreur : message exact "Erreur lors de la suppression. Veuillez réessayer.", rouge, 3 secondes
- Badge : aria-label correct pour count ≤ 9 et count > 9

---

## Matrice UA → INV → Étapes

| UA | INV | Étapes |
|---|---|---|
| UA-001 (ouverture modale) | INV-006 | E-011, E-012 |
| UA-002 (fermeture annuler) | INV-005 | E-011, E-012 |
| UA-003 (DELETE optimiste) | INV-002, INV-003 | E-010, E-012 |
| UA-004 (toast succès) | — | E-010 |
| UA-005 (toast échec + rollback) | INV-004 | E-010 |
| UA-006 (badge >0) | INV-001, INV-007 | E-006, E-007, E-008, E-009 |
| UA-007 (badge 9+) | INV-008 | E-008 |
| UA-008 (query count) | INV-001 | E-003, E-004, E-005, E-006, E-007 |
| UA-009 (refetch onglet) | — | E-009 |
| UA-010 (badge caché si 0) | INV-007 | E-008 |