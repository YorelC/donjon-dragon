# Parcours Playwright

Tests de bout en bout contre l'application réelle : vrai navigateur, vrai back,
vraie base.

## Lancer

```bash
pnpm seed                        # une fois : crée les comptes utilisés ici
pnpm --filter front test:e2e     # build du back + vite + chromium, automatique
pnpm --filter front test:e2e:ui  # mode inspecteur, pour écrire un nouveau test
```

Prérequis : MongoDB démarré, et `back/.env` renseigné. Le reste — build du back,
serveur d'API, serveur vite — est démarré par `playwright.config.ts`.

Ces tests **ne font pas partie de `pnpm test`** : ils sont lents, demandent Mongo et
un navigateur. Les garder séparés, c'est garder la suite unitaire utilisable en
boucle serrée.

## Ce que cet étage a le droit de tester

Une règle, pour éviter qu'il gonfle jusqu'à devenir intenable : **on n'écrit ici que
ce qui est intestable ailleurs.**

Ce qui appartient à cet étage :

- **La sémantique du navigateur.** jsdom n'implémente pas `HttpOnly` : dans un test
  unitaire, `document.cookie` rend ce qu'on y a mis. « Aucun script de la page ne
  peut lire les tokens » n'est donc démontrable qu'ici.
- **Les contrats réels entre front et back.** Le bug qui faisait échouer la
  suppression d'un ami à l'écran venait d'un `200` là où le front n'accepte que
  `204`. Les tests unitaires mockaient `204` — ils ne pouvaient pas le voir.
- **Ce qui traverse un rechargement de page.** La reprise de session par `/me`, la
  persistance réelle d'une suppression.
- **Ce qui s'affiche vraiment.** Qu'un email ne soit pas dans le HTML, même par
  accident.

Ce qui n'appartient PAS à cet étage : la logique de domaine (tests back), le rendu
d'un composant (vitest + testing-library), le mapping d'un message d'erreur
(fonction pure). Un test qu'on peut écrire en vitest doit l'être en vitest.

## Structure

```
e2e/
├── fixtures/
│   ├── accounts.ts   comptes du seed — source unique
│   ├── api.ts        préparation et nettoyage de l'état, par l'API
│   └── test.ts       le `test` étendu : c'est lui qu'on importe, jamais @playwright/test
├── pages/            page objects — tous les sélecteurs vivent ici
└── *.spec.ts         un fichier par domaine fonctionnel
```

## L'état partagé, et pourquoi il y a du nettoyage partout

Ces tests ne peuvent pas créer leurs propres comptes : l'inscription exige une
vérification par email, et il n'y a pas de boîte mail à cliquer. Ils travaillent
donc sur les comptes du seed, **et une demande d'ami créée par un test survit au
test** — au second passage, le serveur répond 409.

D'où `clearAllRelations(page)` dans les `beforeEach` : chaque scénario ramène la base
à un état connu, puis pose sa propre précondition. Les préconditions passent par
l'API (rapide, et ce n'est pas ce qu'on teste) ; les assertions passent par
l'interface (c'est ce qu'on teste).

Conséquence directe : `workers: 1` et `fullyParallel: false`. Deux tests concurrents
sur le même compte se détruiraient mutuellement. C'est le prix d'une vraie base, et
il est assumé.

## Le budget de connexions

`login` est plafonné à **10 requêtes par minute** côté back, et c'est une limite qu'on
veut garder serrée. La première version de cette suite se connectait par l'interface
dans chaque test : elle épuisait son propre throttle, et quatre tests tombaient en 429
déguisés en timeouts.

D'où l'état partagé (`auth.setup.ts` + `storageState`). Les seules connexions réelles
restantes sont celles du describe « Ce que la connexion établit », qui teste
précisément ce que `POST /login` pose. **Avant d'ajouter un test qui se connecte,
compte** : setup (2) + ce describe (5) laisse peu de marge.

Un test qui a seulement besoin d'être connecté prend `storageState`. Un test qui a
besoin d'observer la connexion fait une vraie connexion.

## Ajouter un use case

1. Les sélecteurs vont dans un page object sous `pages/` — **jamais en dur dans un
   spec**. C'est ce qui fait qu'un renommage de libellé coûte une ligne.
2. Cibler par rôle et libellé accessibles (`getByRole`, `getByLabel`), pas par
   classe CSS : un test qui casse quand on retouche du Tailwind ne teste pas le
   produit.
3. Si le scénario a besoin d'un état de départ, l'obtenir par l'API dans
   `fixtures/api.ts`, et nettoyer avant — pas après. Un test qui échoue en cours de
   route ne nettoie pas ; seul le nettoyage en entrée est fiable.
4. Un nouveau page object ou une nouvelle précondition partagée s'enregistre dans
   `fixtures/test.ts` et devient disponible partout.
