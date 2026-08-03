# Plan d'implémentation — Spec 003 (suppression ami + badge demandes)

**Spécification** : `specs/003-friends-list-modal-badge.md`
**ADR** : `docs/adr/001-friends-count-endpoint.md`, `docs/adr/002-friends-modal-optimistic-delete.md`
**Ticket** : t_68908c1c
**UA couvertes** : UA-001 à UA-010
**Statut global** : ✅ TERMINÉ — `pnpm typecheck && pnpm lint && pnpm test` passent (330 tests)

---

## Pré-requis (livrés par l'architecte)

- `shared/src/friendship-schema.ts` : `DeleteFriendParamsSchema`, `PendingReceivedCountSchema` + matrice UA→INV
- `back/src/friendship/03-domain/friendship.repository.port.ts` : `countPendingReceived()` (INV-001)
- ADR 001 + ADR 002 acceptés

---

## Phase 1 — Back-end : endpoint count (UA-008) ✅

| Étape | Fichier | Statut |
|---|---|---|
| E-001 | `back/src/friendship/04-infrastructure/mongo-friendship.repository.ts` | ✅ FAIT |
| E-002 | `back/src/friendship/04-infrastructure/in-memory-friendship.repository.ts` | ✅ FAIT |
| E-003 | `back/src/friendship/02-application/count-pending-received.use-case.ts` | ✅ FAIT |
| E-004 | `back/src/friendship/01-interface/friendship.controller.ts` (+`GET .../count`) | ✅ FAIT |
| E-005 | `back/src/friendship/01-interface/friendship.module.ts` (provider CountPendingReceivedUseCase) | ✅ FAIT |
| E-005b | `back/src/friendship/04-infrastructure/friendship.schema.ts` (index `{recipientId:1,status:1}`) | ✅ FAIT |

**INV couverts** : INV-001, INV-002

---

## Phase 2 — Front : hook de compteur + badge (UA-006, UA-007, UA-008, UA-010) ✅

| Étape | Fichier | Statut |
|---|---|---|
| E-006 | `front/src/shared/constants/api-routes.ts` (+`incomingCount`) | ✅ FAIT |
| E-007 | `front/src/pages/profile/friends/_internal/queries/use-received-count.ts` | ✅ FAIT |
| E-008 | `front/src/pages/profile/friends/_internal/views/friends.view.tsx` (+badge) | ✅ FAIT |
| E-009 | `front/src/pages/profile/friends/_internal/containers/friends.container.tsx` (+count, refetch) | ✅ FAIT |

**INV couverts** : INV-001, INV-007, INV-008

---

## Phase 3 — Front : modale de suppression + mutation optimiste (UA-001 à UA-005) ✅

| Étape | Fichier | Statut |
|---|---|---|
| E-010 | `front/src/pages/profile/friends/_internal/queries/use-remove-friend.ts` | ✅ FAIT |
| E-011 | `front/src/pages/profile/friends/_internal/views/friends-list.view.tsx` (+AlertDialog) | ✅ FAIT |
| E-012 | `front/src/pages/profile/friends/_internal/containers/friends-list.container.tsx` (+état modale) | ✅ FAIT |

**INV couverts** : INV-002, INV-003, INV-004, INV-005, INV-006

---

## Phase 4 — AUDIT de clôture 🔍

### A-001 — Vérifier la matrice UA → test
Vérifier que chaque UA de la spec a au moins un test qui la couvre.
- **Fichier** : tous les `*.test.*` du module friendship (back + front + shared)
- **INV** : tous (INV-001 à INV-008)

### A-002 — Vérifier les cas limites
Checklist issue de la spec :

| Cas limite | UA | Attendu |
|---|---|---|
| Count = 0 → badge caché | UA-010 | Pas de `<Badge>` dans le DOM |
| Count = 1..9 → badge "{n}" | UA-006 | Badge avec le chiffre exact |
| Count ≥ 10 → badge "9+" | UA-007 | Badge "9+" + aria-label "Plus de 9 demandes" |
| DELETE friendshipId invalide | UA-003 | 400 Bad Request |
| DELETE friendshipId inexistant | UA-003 | 404 Not Found |
| DELETE non-participant | UA-003 | 403 Forbidden |
| Bouton Supprimer disabled pendant mutation | UA-003 | Pas de double-clic |
| Escape ferme modale sans API | UA-002 | Aucun appel DELETE |
| Clic Annuler ferme sans API | UA-002 | Aucun appel DELETE |
| Échec API → rollback + toast erreur | UA-005 | Ami réapparaît, toast rouge |
| Succès API → toast succès | UA-004 | "Ami supprimé", vert, 3s |

### A-003 — Vérifier les frontières hexagonales
- Aucun import Mongoose dans `02-application/`
- Aucun import croisé `02-application/` ↔ `04-infrastructure/`
- Front n'importe que `@donjon-dragon/shared`, jamais les types back

### A-004 — Vérifier `pnpm typecheck && pnpm lint && pnpm test`
Doit passer au vert. Actuellement : ✅ 330 tests, 0 échec.

---

## Ordre d'exécution (linéaire strict)

```
Phase 1 (back)  →  Phase 2 (front)  →  Phase 3 (front)  →  Phase 4 (AUDIT)
      ✅                 ✅                    ✅                 🔍 restant
```

**Rappel chaîne linéaire** (Charly) :
> Un ticket par parent, TEST avant les FEAT, [AUDIT] en clôture. Pas de parallélisme.

Pour les features futures, l'ordre canonique est :
1. `[TEST]` — testeur écrit les tests (lecture `shared/` + `03-domain/` uniquement)
2. `[FEAT]` — dev implémente (lecture contrats + tests)
3. `[INTEG]` — revieweur fusionne tests + code
4. `[AUDIT]` — vérification finale de conformité à la spec

---

## Matrice UA → INV → Étapes

| UA | INV | Étapes | Tests |
|---|---|---|---|
| UA-001 (ouverture modale) | INV-006 | E-011, E-012 | `friends-list.view.test.tsx`, `friends-list.container.test.tsx` |
| UA-002 (fermeture annuler) | INV-005 | E-011, E-012 | `friends-list.view.test.tsx`, `friends-list.container.test.tsx` |
| UA-003 (DELETE optimiste) | INV-002, INV-003 | E-010, E-012 | `use-remove-friend.test.tsx`, `remove-friend.use-case.test.ts` |
| UA-004 (toast succès) | — | E-010 | `use-remove-friend.test.tsx` |
| UA-005 (toast échec + rollback) | INV-004 | E-010 | `use-remove-friend.test.tsx` |
| UA-006 (badge >0) | INV-001, INV-007 | E-006..E-009 | `friends.view.test.tsx`, `use-received-count.test.tsx` |
| UA-007 (badge 9+) | INV-008 | E-008 | `friends.view.test.tsx` |
| UA-008 (query count) | INV-001 | E-003..E-007 | `count-pending-received.use-case.test.ts`, `use-received-count.test.tsx` |
| UA-009 (refetch onglet) | — | E-009 | `friends.container.test.tsx` |
| UA-010 (badge caché si 0) | INV-007 | E-008 | `friends.view.test.tsx` |

---

## Vérification finale

```bash
pnpm typecheck && pnpm lint && pnpm test
# Résultat 2026-08-03 : ✅ 33 fichiers, 330 tests passent
```
