# ADR 002 — Stratégie de suppression optimiste avec rollback pour la liste d'amis

**Date** : 2026-08-03
**Statut** : Accepté
**Ticket** : t_68908c1c
**Spec** : 003-friends-list-modal-badge
**Parent** : ADR 001 (endpoint count)

## Contexte

La spec 003 introduit une modale de confirmation de suppression d'ami
(UA-001 à UA-005). La précédente implémentation a été rejetée par le revieweur
pour violation du dual-sandbox. On repart des contrats validés.

Deux décisions architecturales sont à prendre :

1. **Quel composant pour la modale ?** AlertDialog natif shadcn/Radix ou un
   composant sur mesure ?
2. **Quelle stratégie de mutation ?** Optimiste (retrait immédiat de l'UI puis
   rollback si échec) ou pessimiste (attendre la réponse API avant de retirer) ?

## Décision 1 : AlertDialog shadcn/ui natif

**On utilise `AlertDialog` de shadcn/ui (Radix), sans wrapper custom.**

Le `AlertDialog` shadcn fournit nativement :
- Focus trap (Tab/Shift+Tab entre les boutons)
- Fermeture par Escape
- Rôle ARIA `alertdialog` + `aria-modal="true"`
- Retour de focus au déclencheur après fermeture
- Animation fade-out/zoom-out (~200ms)
- `AlertDialogCancel` pour "Annuler" et `AlertDialogAction` pour "Supprimer"

Aucune customisation nécessaire — le composant standard satisfait tous les
critères a11y requis (rôle `alertdialog`, focus trap natif, retour de focus).

Les props critiques :
- `AlertDialogContent` en `size="sm"` (centré, compact)
- `AlertDialogAction` en `variant="destructive"` (bouton rouge "Supprimer")
- `AlertDialogCancel` en `variant="outline"` (bouton "Annuler")

## Décision 2 : Mutation optimiste avec rollback TanStack Query

**On utilise `useMutation` avec `onMutate` (retrait optimiste) + `onError`
(rollback) + `onSettled` (invalidation du cache).**

### Justification

| Approche | Perçu par l'utilisateur | Complexité |
|---|---|---|
| Pessimiste | Latence API (~100-300ms) avant retrait visuel → friction | Simple |
| Optimiste | Retrait immédiat → instantané, fluide | Rollback à gérer |

La spec UA-003 exige explicitement un comportement optimiste :
> « retirer l'ami de la liste affichée sans attendre la réponse API »

Le rollback (UA-005) est exigé en cas d'échec :
> « réinsérer l'ami dans la liste à sa position précédente »

### Mécanisme TanStack Query

```ts
useMutation({
  mutationFn: (friendshipId: string) =>
    api.delete(API_ROUTES.friends.remove(friendshipId)),
  onMutate: async (friendshipId) => {
    // Annuler les queries en cours pour éviter un écrasement du snapshot
    await queryClient.cancelQueries({ queryKey: ["friends", "list"] });
    // Snapshot de la liste avant retrait
    const previous = queryClient.getQueryData(["friends", "list"]);
    // Retrait optimiste
    queryClient.setQueryData(["friends", "list"], (old) =>
      old?.filter((f) => f.id !== friendshipId) ?? []
    );
    return { previous }; // contexte pour onError
  },
  onSuccess: () => {
    toast.success("Ami supprimé");
    queryClient.invalidateQueries({ queryKey: ["friends", "received", "count"] });
  },
  onError: (_err, _friendshipId, context) => {
    // Rollback : restaurer le snapshot
    if (context?.previous) {
      queryClient.setQueryData(["friends", "list"], context.previous);
    }
    toast.error("Erreur lors de la suppression. Veuillez réessayer.");
  },
  onSettled: () => {
    // Invalider pour resynchroniser avec le serveur
    queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
  },
});
```

### Gestion du double-clic

UA-003 exige : « désactiver le bouton "Supprimer" de cet ami (empêcher double-clic) ».
Utiliser `mutation.isPending` de TanStack Query pour désactiver le bouton
pendant la durée de la mutation.

### Toast feedback

UA-004 (succès) et UA-005 (échec) utilisent `sonner` (déjà câblé dans `App.tsx`) :
- Succès : `toast.success("Ami supprimé")` dans `onSuccess`
- Échec : `toast.error("Erreur lors de la suppression. Veuillez réessayer.")`
  dans `onError`

Pas de `onSuccess` toast explicite nécessaire si le succès est implicite
(l'ami a déjà disparu). Mais la spec l'exige → on le met.

## Contre-indications écartées

- **Dialog natif au lieu d'AlertDialog** : le pattern est une confirmation
  destructive → `alertdialog` est le rôle ARIA correct. `Dialog` serait
  sémantiquement incorrect.
- **Mutation pessimiste** : rejetée car la spec exige explicitement l'optimiste
  (UA-003). Le pattern optimiste est standard pour les suppressions dans les
  listes (pas de conséquence grave en cas d'échec).
- **Composant modal custom** : rejeté car Radix fournit déjà l'a11y complète
  (focus trap, Escape, rôles ARIA, retour de focus).

## Conséquences

### Fichiers à créer ou modifier (front uniquement)

| Fichier | Action | UA |
|---|---|---|
| `front/src/pages/profile/friends/_internal/queries/use-remove-friend.ts` | MODIFIÉ : mutation TanStack Query avec onMutate/onError/onSuccess/onSettled | UA-003, UA-004, UA-005 |
| `front/src/pages/profile/friends/_internal/containers/friends-list.container.tsx` | MODIFIÉ : remplacer le bouton "Supprimer" direct par ouverture d'AlertDialog + état `selectedFriend` | UA-001, UA-002, UA-003 |
| `front/src/pages/profile/friends/_internal/views/friends-list.view.tsx` | MODIFIÉ : wrapper AlertDialog autour du bouton Supprimer, passer `onDeleteConfirm` | UA-001, UA-002 |
| `front/src/pages/profile/friends/_internal/views/friends.view.tsx` | MODIFIÉ : prop `receivedCount` + badge dans TabsTrigger | UA-006, UA-007, UA-010 |
| `front/src/pages/profile/friends/_internal/containers/friends.container.tsx` | MODIFIÉ : `useReceivedCount()`, refetch au clic onglet, injection props | UA-008, UA-009 |
| `front/src/pages/profile/friends/_internal/queries/use-received-count.ts` | NOUVEAU : TanStack Query pour `GET .../count` | UA-008 |

### Aucun changement back-end nécessaire pour cette ADR

Le endpoint `DELETE /api/friends/:friendshipId` existe déjà (UA-003).
Le endpoint `GET .../count` manque → couvert par ADR 001 et le plan d'implémentation.

## Invariants front (documentés ici, pas de Zod)

- **INV-003** [UA-003] : le bouton "Supprimer" est désactivé (`disabled`) quand
  `mutation.isPending === true` pour l'amitié concernée. Aucun double-clic possible.
- **INV-004** [UA-005] : en cas d'échec API, l'ami est réinséré à sa position
  d'origine dans la liste (le snapshot `previous` est restauré intégralement,
  pas un simple `prepend`).
- **INV-005** [UA-002] : cliquer "Annuler" ou presser Escape ferme la modale
  sans appeler l'API. L'état `selectedFriendId` est remis à `null`.
- **INV-006** [UA-001] : la modale affiche `"Voulez-vous vraiment supprimer {displayName} ?"`
  où `displayName` est celui de l'ami sélectionné. Pas de fallback sur un UUID.
- **INV-007** [UA-006, UA-010] : le badge n'est rendu dans le DOM que si
  `receivedCount > 0`. Pas de `0` affiché, pas de badge invisible en CSS.
- **INV-008** [UA-007] : si `receivedCount > 9`, le badge affiche `"9+"` et
  l'`aria-label` est `"Plus de 9 demandes en attente"`.
