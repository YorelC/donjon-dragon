# Tokens de design — Donjon & Dragon SaaS

> Fichier source des tokens. Toute nouvelle couleur/taille doit entrer ici
> avec justification avant usage dans un composant.

## Palette (Tailwind v4 — `index.css`)

Les tokens ci-dessous sont déclarés dans `front/src/index.css` via `@theme {}`
et utilisables directement en classes Tailwind (ex: `bg-destructive`, `text-success-foreground`).

| Token CSS             | Usage                                       | Valeur OKLCH                    |
|-----------------------|---------------------------------------------|----------------------------------|
| `--color-background`  | Fond de page principal                      | `oklch(1 0 0)`                  |
| `--color-foreground`  | Texte principal                             | `oklch(0.145 0 0)`              |
| `--color-primary`     | Actions principales, liens                  | `oklch(0.205 0.042 265.755)`    |
| `--color-primary-foreground` | Texte sur fond primary               | `oklch(0.985 0 0)`              |
| `--color-secondary`   | Fond secondaire (tabs, listes)              | `oklch(0.965 0.021 266.286)`    |
| `--color-muted`       | Texte atténué, placeholder                  | `oklch(0.708 0.049 264.777)`    |
| `--color-destructive` | Suppression, danger, erreur                 | `oklch(0.577 0.245 27.325)`     |
| `--color-success`     | Confirmation, succès                        | `oklch(0.6 0.177 142.476)`      |
| `--color-success-foreground` | Texte sur fond success               | `oklch(0.985 0 0)`              |
| `--color-error`       | Erreur, toast rouge                         | `oklch(0.577 0.245 27.325)`     |
| `--color-border`      | Bordures des composants                     | `oklch(0.922 0.024 270.291)`    |
| `--color-ring`        | Focus visible (a11y)                        | `oklch(0.708 0.049 264.777)`    |

### Badge compteur (nouveau pour cette feature)

Aucune nouvelle couleur nécessaire. Le badge utilise `variant="default"` du
composant shadcn `Badge` (fond `--color-primary`, texte `--color-primary-foreground`).

## Rayons (`border-radius`)

| Token        | Valeur     | Usage                              |
|--------------|------------|------------------------------------|
| `--radius-sm`  | `0.25rem`  | AlertDialog size="sm"              |
| `--radius-md`  | `0.375rem` | Badge par défaut                   |
| `--radius-lg`  | `0.5rem`   | Cards, AlertDialog size="default"  |
| `--radius-xl`  | `0.75rem`  | —                                  |
| `--radius-2xl` | `1rem`     | Toasts (sonner)                    |

## Échelle typographique

| Classe CSS        | Usage                                  | Valeur         |
|-------------------|----------------------------------------|----------------|
| `.page-title`     | Titre de page (h1)                     | `text-3xl font-bold` |
| `.section-title`  | Titre de section (h2)                  | `text-lg font-semibold` |
| `text-sm`         | Corps de texte secondaire, badges      | `0.875rem`     |
| `text-xs`         | Badge compteur, métadonnées            | `0.75rem`      |
| `.empty-state-text` | Message vide, chargement, erreur     | `text-sm italic` |

## Espacements

| Échelle           | Usage                                      |
|-------------------|--------------------------------------------|
| `gap-2` (0.5rem)  | Entre boutons dans AlertDialogFooter       |
| `gap-4` (1rem)    | Entre contenu et bord dans AlertDialog     |
| `p-6` (1.5rem)    | Padding du contenu AlertDialog             |
| `p-4` (1rem)      | Padding des Cards (amis, demandes)         |
| `space-y-2`       | Liste verticale d'amis/demandes            |

## Composants shadcn/ui utilisés (inventaire)

| Composant        | Fichier source                          | Usage dans cette feature        |
|------------------|-----------------------------------------|----------------------------------|
| `AlertDialog`    | `atoms/alert-dialog.tsx`                | Modale de confirmation suppression |
| `Badge`          | `atoms/badge.tsx`                       | Badge compteur onglet "Reçues"   |
| `sonner/Toaster` | `atoms/sonner.tsx`                      | Toasts succès/erreur (déjà dans App.tsx) |
| `Tabs`           | `atoms/tabs.tsx`                        | Conteneur des onglets Amis       |
| `Button`         | `atoms/button.tsx`                      | Boutons Annuler/Supprimer        |
| `Card`           | `atoms/card.tsx`                        | Liste d'amis / demandes          |

## Justification des choix

- **AlertDialog** plutôt que Dialog : pattern standard de confirmation
  destructive. Radix gère le focus trap, la fermeture par Escape, les rôles ARIA
  (`alertdialog`). Pas besoin d'un composant sur-mesure.
- **Badge** dans le TabsTrigger : intégré directement dans le label via
  `children`, pas de composant wrapper. Le `TabsTrigger` accepte du JSX dans
  son children.
- **sonner** déjà câblé dans `App.tsx` : `toast.success()` et `toast.error()`
  suffisent. Pas de customisation de durée (3s = défaut sonner).
- **Pas de nouvelle couleur** : `success`/`error`/`destructive` existent déjà.