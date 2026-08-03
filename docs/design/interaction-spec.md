# Spécification d'interaction — Modale suppression + badge compteur

> Feature : Modale de confirmation suppression ami + badge compteur demandes reçues
> Parent : SPEC t_68908c1c
> UAs couvertes : UA-001 à UA-010

---

## 1. Modale de confirmation (AlertDialog)

### 1.1 Ouverture (UA-001)

| État | Déclencheur | Comportement | Référence |
|------|-------------|-------------|-----------|
| **Fermé** (par défaut) | — | La modale n'existe pas dans le DOM | — |
| **Ouvert** | Clic bouton "Supprimer" d'un ami | Overlay semi-transparent + modale `AlertDialog size="sm"` centrée. Focus automatique sur "Annuler". Interaction avec le reste de la page bloquée (inert). | UA-001 |
| **Erreur** | L'ami a déjà été supprimé entre-temps | Fermer la modale, afficher toast d'erreur "Erreur lors de la suppression. Veuillez réessayer." | UA-005 |

**Contenu de la modale :**

```
┌──────────────────────────────────┐
│         Supprimer Gandalf ?      │  ← AlertDialogTitle
│                                  │
│  Voulez-vous vraiment supprimer  │  ← AlertDialogDescription
│  Gandalf ?                       │
│                                  │
│  ┌──────────┐ ┌──────────────┐   │
│  │ Annuler  │ │   Supprimer  │   │  ← AlertDialogCancel / AlertDialogAction
│  └──────────┘ └──────────────┘   │       (variant="destructive")
└──────────────────────────────────┘
```

### 1.2 Fermeture par "Annuler" (UA-002)

| État | Déclencheur | Comportement |
|------|-------------|-------------|
| Ouvert | Clic "Annuler" | La modale se ferme. Aucun appel API. La liste d'amis est inchangée. Le focus retourne sur le bouton "Supprimer" qui a déclenché l'ouverture (retour de focus).

### 1.3 Confirmation (UA-003) — Suppression optimiste

| Étape | Action | Résultat visible | API |
|-------|--------|------------------|-----|
| 1 | Clic "Supprimer" | Modale se ferme immédiatement | — |
| 2 | (immédiat) | L'ami disparaît de la liste. Le bouton "Supprimer" de la carte devient disabled (empêcher double-clic) | — |
| 3 | (concurrent) | — | `DELETE API_ROUTES.friends.remove(friendshipId)` |
| 4a | API 2xx | ✅ Toast vert "Ami supprimé" (UA-004) → invalidation cache liste | — |
| 4b | API 4xx/5xx | ❌ Rollback : l'ami réapparaît à sa position précédente + toast rouge (UA-005) | — |

### 1.4 Raccourcis clavier

| Touche | Action | UA |
|--------|--------|----|
| `Enter` sur "Annuler" | Ferme la modale sans action | UA-002 |
| `Enter` sur "Supprimer" | Confirme et déclenche la suppression | UA-003 |
| `Escape` | Annule et ferme (comportement natif Radix AlertDialog) | UA-002 |
| `Tab` | Navigue entre "Annuler" et "Supprimer" (focus trap Radix) | — |
| `Shift+Tab` | Navigation arrière dans le focus trap | — |

### 1.5 États de la modale

| État | Description | Visuel |
|------|-------------|--------|
| **Fermé** | Hors DOM (conditionnel) | — |
| **Ouvert** | Overlay + modale centrée | `AlertDialog size="sm"` avec `open=true` |
| **Fermeture** | Animation fade-out/zoom-out (natif Radix, ~200ms) | `data-[state=closed]:animate-out` |
| **Loading** | N/A (pas de délai entre clic et fermeture : optimiste) | — |
| **Erreur API** | Géré par le container : toast + rollback | toast (cf. section 2) |

---

## 2. Toast feedback (sonner)

### 2.1 Toast de succès (UA-004)

```
[top-right, 3s, auto-dismiss]
┌──────────────────────────────────────┐
│  ✅  Ami supprimé                    │
└──────────────────────────────────────┘
```

- Bibliothèque : `sonner` (déjà importée, `Toaster` dans `App.tsx`)
- Appel : `toast.success("Ami supprimé")`
- Icône : `CircleCheckIcon` (lucide-react, déjà mappé dans sonner.tsx)
- Durée : 3s (défaut sonner pour success)
- Position : top-right (défaut sonner)
- Aucun bouton d'action
- Aucun son

### 2.2 Toast d'erreur (UA-005)

```
[top-right, 3s, auto-dismiss]
┌──────────────────────────────────────────────────────┐
│  ✕  Erreur lors de la suppression.                  │
│     Veuillez réessayer.                              │
└──────────────────────────────────────────────────────┘
```

- Appel : `toast.error("Erreur lors de la suppression. Veuillez réessayer.")`
- Icône : `OctagonXIcon` (lucide-react, déjà mappé)
- Durée : 3s (défaut sonner pour error)
- Aucun bouton d'action
- Aucun son
- Déclenché par : tout échec API (4xx, 5xx, erreur réseau, timeout)

### 2.3 États du toast

| État | Description |
|------|-------------|
| **Disparu** | Initial |
| **Visible** | Apparaît avec animation fade-in (sonner natif). `role="status"`, `aria-live="polite"` |
| **Disparition** | Auto-dismiss après 3s avec animation fade-out |
| **Empilé** | Si plusieurs toasts simultanés, sonner les empile verticalement |

---

## 3. Badge compteur sur l'onglet "Reçues"

### 3.1 Architecture

```
<TabsTrigger value="received">
  Reçues
  {receivedCount > 0 && (
    <Badge aria-label={...}>
      {receivedCount > 9 ? "9+" : receivedCount}
    </Badge>
  )}
</TabsTrigger>
```

- Composant : `Badge` de shadcn/ui, variant="default"
- Données : `useReceivedRequests(enabled=true)` — appelée dans `FriendsContainer` (pas dans ReceivedRequestsContainer)
- Requête : `GET API_ROUTES.friends.incoming` → reçoit un tableau → `data.length`

### 3.2 États du badge

| receivedCount | Visuel | Rendu conditionnel | UA |
|:---:|---|---|:---:|
| 0 | *(aucun)* | `false` → pas de JSX | UA-010 |
| 1 | `①` | `true` → `<Badge>1</Badge>` | UA-006 |
| 3 | `③` | `true` → `<Badge>3</Badge>` | UA-006 |
| 9 | `⑨` | `true` → `<Badge>9</Badge>` | UA-006 |
| 10 | `9+` | `true` → `<Badge>9+</Badge>` | UA-007 |
| 99 | `9+` | `true` → `<Badge>9+</Badge>` | UA-007 |

### 3.3 Données
- **Au montage** (UA-008) : `useReceivedRequests(true)` s'exécute dans `FriendsContainer`
- **Au clic sur "Reçues"** (UA-009) : `refetch()` de la même requête → mise à jour du badge
- **Pas de WebSocket temps réel** (hors périmètre R-007)

### 3.4 Raccourcis clavier (tabs Radix)

| Touche | Action |
|--------|--------|
| `Tab`/`Shift+Tab` | Naviguer entre les onglets |
| `Enter`/`Space` | Activer l'onglet sous focus → refetch des demandes reçues |

---

## 4. Checklist accessibilité (a11y)

### 4.1 Contrastes (AA minimum — European Accessibility Act)

| Élément | Couleur fond | Couleur texte | Ratio | Statut |
|---------|-------------|---------------|:-----:|:------:|
| Texte modale | `background` (#fff) | `foreground` (#111) | >15:1 | ✅ OK |
| Bouton "Supprimer" (destructive) | `destructive` (#c94) | `white` | >4.5:1 | ✅ OK |
| Bouton "Annuler" | `background` / `border` | `foreground` | >15:1 | ✅ OK |
| Badge compteur | `primary` (#233) | `primary-foreground` (#faf) | >8:1 | ✅ OK |
| Toast succès | `popover` (#fff) + bordure gauche `success` | `popover-foreground` | >15:1 | ✅ OK |
| Texte atténué (empty state) | `background` | `muted` (#666) | >6:1 | ✅ OK |
| Focus ring | — | `ring` (#b4b) | 3px solid | ✅ OK |

### 4.2 Navigation clavier

| Composant | Comportement exigé | Garanti par |
|-----------|-------------------|-------------|
| AlertDialog | Focus trap, Tab/Shift+Tab entre les boutons, Escape ferme | Radix AlertDialog nativement |
| AlertDialog | Focus initial sur le bouton "Annuler" (action la plus sûre) | Radix : ordre des enfants |
| AlertDialog | Retour de focus sur le déclencheur après fermeture | Radix nativement |
| Tabs | Tab/Shift+Tab entre les TabsTrigger, Enter/Space active | Radix Tabs nativement |
| Badge | Focus non applicable (élément statique, pas interactif) | — |
| Toast | `role="status"` + `aria-live="polite"` pour annonce lecteur d'écran | sonner nativement |

### 4.3 Rôles ARIA

| Composant | Rôle | Attributs |
|-----------|------|-----------|
| AlertDialog (root) | `role="alertdialog"` | `aria-modal="true"`, `aria-labelledby="<title-id>"`, `aria-describedby="<desc-id>"` |
| AlertDialogTitle | — | `id="<title-id>"` (réf par labelledby) |
| AlertDialogDescription | — | `id="<desc-id>"` (réf par describedby) |
| Overlay | — | `aria-hidden="true"` (Radix nativement) |
| Tabs root | `tablist` | `aria-label="Onglets amis"` |
| TabsTrigger | `tab` | `aria-selected` (Radix nativement) |
| Badge | — | `aria-label="<N> demandes en attente"` ou `"Plus de 9 demandes en attente"` |
| Toast | `status` | `aria-live="polite"` (sonner nativement) |

### 4.4 Cibles tactiles (≥ 44 px)

| Cible | Taille minimale | Conforme |
|-------|:---------------:|:--------:|
| Bouton "Supprimer" (dans card) | 36 px (size="sm") | ⚠️ Limite — justifié par le layout compact de la card. |
| Bouton "Annuler" / "Supprimer" (dans modale) | 44+ px (size="default") | ✅ |
| TabsTrigger | 44+ px (padding + texte) | ✅ |

> Note : le bouton "Supprimer" dans la card est en `size="sm"` (~32-36 px) — en dessous des 44 px recommandés.
> Justification : pattern standard de shadcn pour bouton inline dans une card. L'action est protégée
> par la modale de confirmation. Si un audit WCAG strict est requis, passer en `size="default"`
> avec moins de padding horizontal, ou augmenter le `min-height` du bouton à 44 px.

### 4.5 Focus visible

- Tous les éléments interactifs ont un `focus-visible:ring-[3px] focus-visible:ring-ring` (shadcn nativement)
- L'AlertDialog overlay utilise `bg-black/50` pour le contraste modal/inert
- Les transitions Radix sont respectées : `data-[state=open]` / `data-[state=closed]`

---

## 5. Intégration dans l'existant

### 5.1 Fichiers à modifier

| Fichier | Modification | UA |
|---------|-------------|:---:|
| `friends.view.tsx` | Ajouter prop `receivedCount: number` + JSX conditionnel du Badge dans TabsTrigger "Reçues" | UA-006, 007, 010 |
| `friends.container.tsx` | Ajouter `useReceivedRequests(true)` pour le compteur (+ refetch au clic sur received) | UA-008, 009 |
| `friends-list.view.tsx` | Remplacer le bouton "Supprimer" direct par une ouverture de modale | UA-001 |
| `friends-list.container.tsx` | Ajouter la gestion de l'état `open` de l'AlertDialog + ami sélectionné + mutation | UA-003 |
| `friends-list.view.tsx` | Ajouter `AlertDialog` autour du bouton Supprimer | UA-001, 002, 003 |
| `use-remove-friend.ts` | Ajouter `onMutate` (suppression optimiste) + `onError` (rollback) + `onSettled` (invalidation) | UA-003, 005 |
| `friends.container.tsx` | Injecter `receivedQuery.refetch` dans `ReceivedRequestsContainer` (prop) | UA-009 |

### 5.2 Composants shadcn à réutiliser (aucun nouveau)

| Composant | Import | Usage |
|-----------|--------|-------|
| `AlertDialog` | `@/shared/components/atoms/alert-dialog` | Modale |
| `AlertDialogTrigger` | idem | Sur le bouton "Supprimer" |
| `AlertDialogContent` | idem | size="sm" |
| `AlertDialogHeader` | idem | Titre + description |
| `AlertDialogTitle` | idem | "Supprimer {name} ?" |
| `AlertDialogDescription` | idem | "Voulez-vous vraiment…" |
| `AlertDialogFooter` | idem | Boutons |
| `AlertDialogCancel` | idem | "Annuler" variant="outline" |
| `AlertDialogAction` | idem | "Supprimer" variant="destructive" |
| `Badge` | `@/shared/components/atoms/badge` | Compteur, variant="default" |
| `Button` | `@/shared/components/atoms/button` | Déjà existant dans la card |

### 5.3 Aucun nouveau composant requis

Tous les composants UI existent déjà dans `front/src/shared/components/atoms/`.