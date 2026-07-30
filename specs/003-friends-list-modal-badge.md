# Spec 003 — Modale de suppression et badge compteur sur la liste d'amis (t_68908c1c)

## Problème utilisateur (une phrase testable)
Un utilisateur peut supprimer un ami sans confirmation et ne voit pas combien de demandes d'ami en attente il a sans cliquer sur l'onglet "Reçues".

## Personas concernés
- Joueur connecté avec des amis (suppression)
- Joueur connecté avec des demandes d'ami reçues (badge)

## Parcours nominal (Gherkin)

### Feature: Suppression d'un ami avec confirmation
```
Étant donné un utilisateur connecté sur la page "Amis" avec un onglet "Amis" actif
Et une liste d'amis affichée
Quand l'utilisateur clique "Supprimer" sur un ami nommé "Gandalf"
Alors une modale de confirmation s'ouvre avec le texte "Voulez-vous vraiment supprimer Gandalf ?"
Et les boutons "Annuler" et "Supprimer"

Quand l'utilisateur clique "Supprimer" dans la modale
Alors la modale se ferme
Et "Gandalf" disparaît immédiatement de la liste
Et un toast vert "Ami supprimé" apparaît en haut à droite pendant 3 secondes

Quand l'API échoue lors de la suppression
Alors un toast rouge "Erreur lors de la suppression. Veuillez réessayer." apparaît en haut à droite pendant 3 secondes
Et "Gandalf" réapparaît dans la liste à sa position précédente
```

### Feature: Badge de demandes en attente
```
Étant donné un utilisateur connecté sur la page "Amis"
Quand la page se charge
Alors le nombre de demandes reçues est récupéré
Et un badge s'affiche à côté du label "Reçues" dans la barre d'onglets

Quand l'utilisateur clique sur l'onglet "Reçues"
Alors la liste des demandes est rafraîchie
Et le badge est mis à jour

Étant donné 0 demande en attente
Quand la page se charge
Alors aucun badge n'est affiché à côté du label "Reçues"
```

## Unités atomiques

### UA-001 — Ouverture de la modale de confirmation de suppression   [source: R-001]
QUAND l'utilisateur clique sur le bouton "Supprimer" d'un ami dans la liste,
SI la connexion est active et la liste est affichée,
le système DOIT ouvrir une modale affichant le message "Voulez-vous vraiment supprimer {displayName} ?"
avec les boutons "Annuler" et "Supprimer", et empêcher toute interaction avec le reste de la page.

| displayName de l'ami | Message affiché dans la modale |
|---|---|
| "Gandalf" | "Voulez-vous vraiment supprimer Gandalf ?" |
| "Frodon Sacquet" | "Voulez-vous vraiment supprimer Frodon Sacquet ?" |
| "Aragorn" | "Voulez-vous vraiment supprimer Aragorn ?" |

### UA-002 — Fermeture par "Annuler"   [source: R-001] [dépend de: UA-001]
QUAND la modale de suppression est ouverte,
SI l'utilisateur clique sur le bouton "Annuler",
le système DOIT fermer la modale sans modifier la liste d'amis ni lancer d'appel API.

### UA-003 — Confirmation de suppression avec comportement optimiste   [source: R-003, R-005] [dépend de: UA-001]
QUAND la modale de suppression est ouverte,
SI l'utilisateur clique sur le bouton "Supprimer",
le système DOIT :
1. fermer la modale immédiatement
2. retirer l'ami de la liste affichée sans attendre la réponse API (optimiste)
3. lancer l'appel API DELETE `API_ROUTES.friends.remove(friendshipId)`
4. désactiver le bouton "Supprimer" de cet ami (empêcher double-clic)

### UA-004 — Toast de succès après suppression   [source: R-002, R-006] [dépend de: UA-003]
QUAND l'appel API DELETE de suppression réussit (status 2xx),
le système DOIT afficher un toast de succès avec les caractéristiques suivantes :

| Propriété | Valeur |
|---|---|
| Message | "Ami supprimé" |
| Position | haut à droite |
| Durée | 3 secondes |
| Style | vert (succès) |
| Action | aucun bouton d'action |
| Son | aucun |

Codes d'erreur : aucun (cas nominal).

### UA-005 — Toast d'échec et rollback de la suppression   [source: R-002, R-005] [dépend de: UA-003]
QUAND l'appel API DELETE de suppression échoue (status 4xx ou 5xx ou erreur réseau),
le système DOIT :
1. réinsérer l'ami dans la liste à sa position précédente
2. afficher un toast d'erreur avec les caractéristiques suivantes

| Propriété | Valeur |
|---|---|
| Message | "Erreur lors de la suppression. Veuillez réessayer." |
| Position | haut à droite |
| Durée | 3 secondes |
| Style | rouge (erreur) |
| Action | aucun bouton d'action |
| Son | aucun |

### UA-006 — Affichage du badge de demandes sur l'onglet "Reçues"   [source: R-004]
QUAND la page "Amis" est chargée,
SI le nombre de demandes d'ami reçues est > 0,
le système DOIT afficher un badge numérique à côté du label "Reçues" dans le `TabsTrigger`.

| Demandes reçues | État du badge | Affichage |
|---|---|---|
| 1 | visible | badge "1" à côté de "Reçues" |
| 3 | visible | badge "3" à côté de "Reçues" |
| 9 | visible | badge "9" à côté de "Reçues" |

### UA-007 — Truncation du badge à "9+"   [source: R-004] [dépend de: UA-006]
QUAND le badge est affiché,
SI le nombre de demandes reçues est > 9,
le système DOIT afficher "9+" au lieu du nombre exact.

| Demandes reçues | Affichage du badge |
|---|---|
| 10 | "9+" |
| 15 | "9+" |
| 99 | "9+" |

### UA-008 — Rechargement des demandes au chargement de la page   [source: R-007]
QUAND la page "Amis" est montée (premier rendu),
le système DOIT exécuter la requête de récupération des demandes reçues (`useReceivedRequests`) indépendamment de l'onglet actif,
afin d'alimenter le badge.

### UA-009 — Rafraîchissement des demandes au clic sur l'onglet "Reçues"   [source: R-007] [dépend de: UA-008]
QUAND l'utilisateur clique sur l'onglet "Reçues",
le système DOIT rafraîchir la requête des demandes reçues (refetch)
et mettre à jour le badge en conséquence.

### UA-010 — Masquage du badge à zéro demande   [source: R-004] [dépend de: UA-006]
QUAND le nombre de demandes reçues est de 0,
le système DOIT masquer le badge (ne pas l'afficher).

| Demandes reçues | État du badge |
|---|---|
| 0 | caché (aucun badge visible) |

## Matrice de traçabilité

| R-NNN | UA couvrantes |
|---|---|
| R-001 | UA-001, UA-002 |
| R-002 | UA-004, UA-005 |
| R-003 | UA-003 |
| R-004 | UA-006, UA-007, UA-010 |
| R-005 | UA-003, UA-005 |
| R-006 | UA-004, UA-005 |
| R-007 | UA-008, UA-009 |
| R-008 | (priorité) |
| R-009 | (hors périmètre) |

## Hors périmètre (Won't)
- Son ou animation sur le badge ou la modale
- Historique des suppressions
- Undo après suppression
- Compteur temps réel via WebSocket (R-007)
- Avatar ou niveau dans la modale de suppression
- Badge sur les onglets "Envoyées" ou "Amis"
- Animation de badge (pulse, transition)

## Métriques de succès observables
- Testable via RTL : la modale de confirmation n'existe pas dans le DOM tant que l'utilisateur n'a pas cliqué "Supprimer"
- Testable via RTL : le badge affiche `9+` pour `count > 9` et masqué pour `count === 0`
- Testable via RTL/mock : après un échec API, l'ami réapparaît dans la liste au même index
- Testable via RTL/mock : `useReceivedRequests` est appelée au montage, puis refetch au clic sur l'onglet