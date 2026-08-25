# Tokens de design — Donjon & Dragon SaaS

> Fichier source des tokens. Toute nouvelle couleur/taille doit entrer ici
> avec justification avant usage dans un composant.
>
> **Source normative de la direction artistique :**
> [`docs/ui-design/Charte graphique.html`](../ui-design/Charte%20graphique.html) —
> encre nuit et or. Ce fichier ne fait qu'en traduire les valeurs en tokens
> Tailwind v4. En cas de désaccord, la charte gagne.

## Principe

Une seule ambiance : **il n'y a ni mode clair ni mode sombre**. L'encre nuit est
le mode de base, ses variantes se font par l'opacité de l'or. `@variant dark` a
été retiré de `front/src/index.css` ; aucun utilitaire `dark:` ne subsiste dans
`front/src`.

Une seule teinte d'accent, l'or `#c9a961`, déclinée par le modificateur
d'opacité Tailwind (`border-gold/22`, `bg-gold/5`, `text-gold/72`). Les paliers
de la charte :

| α | Emploi |
|---|--------|
| `.05` | Fond de pastille |
| `.14` | Bordure au repos |
| `.20` – `.28` | Cadres et anneaux |
| `.45` – `.60` | Ornements, focus |
| `.75` | Bordure sélectionnée |

## Palette (Tailwind v4 — `front/src/index.css`, bloc `@theme`)

### Encre — fonds et surfaces

| Token CSS | Usage | Valeur |
|---|---|---|
| `--color-background` | Fond de page | `#070a10` |
| `--color-foreground` | Texte courant, saisie utilisateur | `#e4dccd` |
| `--color-surface` | Carte au repos, fond neutre | `rgba(255,255,255,.015)` |
| `--color-card` / `--color-popover` | Panneau, surface flottante | `#121926` |
| `--color-secondary` | Fond secondaire | `#0f1520` |
| `--color-muted` | Fond atténué | `#0d131d` |
| `--color-accent` | Survol de menu, élément actif | `#1b202b` |
| `--color-sidebar` | Panneau de navigation | `#131a26` |

Les dégradés de panneau ne sont pas des tokens de couleur : ils vivent dans les
classes `.panel`, `.panel-inset` et `.panel-surface` (`@layer components`).

### Or — accent unique

| Token CSS | Usage | Valeur |
|---|---|---|
| `--color-gold` | Or de référence, toutes les opacités | `#c9a961` |
| `--color-gold-link` | Liens, compteurs, jauge | `#d9bd7c` |
| `--color-gold-link-hover` | Lien survolé | `#f1dfb2` |
| `--color-gold-value` | Valeurs, noms mis en avant | `#e6d3a5` |
| `--color-gold-title` | Titres | `#f0e6d2` |
| `--color-gold-selected` | Élément sélectionné | `#f4ead6` |
| `--color-gold-dim` | Valeur de l'étape en cours (or sourd) | `#b09a68` |
| `--color-primary` | Alias shadcn de l'or | `#c9a961` |

### Texte — hiérarchie de gris

| Token CSS | Usage | Valeur |
|---|---|---|
| `--color-ink-lede` | Chapeau d'une fiche | `#c3bdb0` |
| `--color-ink-prose` | Paragraphe dans un bloc | `#b9b3a6` |
| `--color-ink-idle` | Libellé d'option non sélectionnée | `#b8b2a5` |
| `--color-ink-value` | Valeur secondaire d'une liste | `#a9a396` |
| `--color-ink-help` | Aide sous un titre, libellé de pastille | `#8a93a4` |
| `--color-ink-meta` / `--color-muted-foreground` | Métadonnée, sous-ligne | `#8f97a6` |
| `--color-ink-faint` | Mention discrète, placeholder | `#78808f` |
| `--color-ink-disabled` | Bouton principal inactif | `#5a6270` |
| `--color-ink-disabled-soft` | Bouton secondaire indisponible | `#4d5462` |

### Bordures et focus

| Token CSS | Usage | Valeur |
|---|---|---|
| `--color-border` | Bordure de composant | `rgba(201,169,97,.22)` |
| `--color-input` | Bordure de champ | `rgba(201,169,97,.24)` |
| `--color-ring` | Focus visible (a11y) | `rgba(201,169,97,.6)` |

### Retour d'état — écart assumé à la charte

La charte n'admet **qu'une** teinte d'accent. L'application a néanmoins besoin
de distinguer une action irréversible d'une confirmation. Décision de Charly :

- **Danger** — un rouge brique sourd, accordé à l'encre. Une suppression doit
  alerter : la fidélité graphique ne prime pas sur la lisibilité du risque.
- **Succès** — pas de vert, l'or suffit.

| Token CSS | Usage | Valeur |
|---|---|---|
| `--color-destructive` / `--color-error` | Suppression, danger, erreur | `#c2705c` |
| `--color-success` | Confirmation | `#c9a961` (l'or) |

## Rayons (`border-radius`)

**Zéro partout.** `--radius-xs` à `--radius-4xl` valent `0px` : les `rounded-*`
hérités de shadcn tombent d'eux-mêmes, sans réécriture des composants.

Deux exceptions, elles aussi dans la charte :

| Élément | Rayon |
|---|---|
| Pastilleur d'étape (`journey-step`), jeton (`stat-token`) | `rounded-full` |
| Poignée d'ascenseur (`scroll-area`) | `4px` |

## Ombres

Aucune ombre portée. La profondeur vient de l'intérieur.

| Token CSS | Usage | Valeur |
|---|---|---|
| `--shadow-xs` … `--shadow-2xl` | Neutralisés | `0 0 #0000` |
| `--shadow-panel` | Panneau, carte, fiche | `inset 0 0 70px rgba(0,0,0,.55)` |
| `--shadow-tooltip` | Infobulle et surfaces flottantes (menu, modale) | `0 14px 34px rgba(0,0,0,.55)` |

## Polices

Auto-hébergées via `@fontsource` — aucune requête vers un service externe.

| Token CSS | Police | Emploi |
|---|---|---|
| `--font-display` | `Cinzel` 400/500/600 | Titres, intitulés, libellés, boutons, valeurs chiffrées. Toujours avec un interlettrage ouvert, souvent en capitales. **Jamais un paragraphe.** |
| `--font-sans` | `Source Sans 3 Variable` + italique | Tout le texte courant, descriptions, sous-lignes, champs de saisie. Interligne 1,6 à 1,7. |

## Échelle typographique

Les tailles de la charte sont nommées par leur **rôle**. Les tailles Tailwind par
défaut (`text-sm`, `text-base`…) ne sont pas écrasées : trop de pages en
dépendent.

| Token CSS | Valeur | Usage |
|---|---|---|
| `--text-meta` | `10.5px` | Sous-ligne d'option : école · portée · temps |
| `--text-overline` | `11px` | Surtitre de fiche |
| `--text-label` | `11.5px` | Libellé de liste et de champ |
| `--text-note` | `12.5px` | Étiquette, commentaire de composant |
| `--text-body` | `13.5px` | Paire nom / valeur |
| `--text-lede` | `14.5px` | Chapeau d'une fiche |
| `--text-title-record` | `22px` | Titre de fiche |
| `--text-title-step` | `25px` | Titre d'étape |
| `--text-title-page` | `30px` | Titre de page |

Interlettrages : `--tracking-name` `.03em`, `--tracking-meta` `.04em`,
`--tracking-value` `.06em`, `--tracking-title` `.1em`, `--tracking-label`
`.14em`, `--tracking-section` `.16em`, `--tracking-overline` `.2em`.

## Classes globales (`@layer components` de `front/src/index.css`)

Une chaîne d'utilitaires répétée dans 2 fichiers ou plus devient **une** classe
globale — jamais un `const className` par fichier, jamais une entrée CVA qui
sert à contourner la règle (voir `/design-system`).

| Classe | Rôle |
|---|---|
| `.page-title` / `.hero-title` / `.section-title` | Les trois niveaux de titre |
| `.overline` / `.section-label` / `.field-label` | Surtitre, intitulé de section, libellé de champ |
| `.lede` / `.prose-block` / `.meta-line` | Chapeau, paragraphe, métadonnée |
| `.muted-text` / `.muted-text-xs` / `.empty-state-text` | Textes atténués |
| `.panel` / `.panel-surface` / `.panel-inset` / `.panel-flat` | Les quatre surfaces |
| `.rule-line` / `.rule-line-reverse` | Filets dégradés |
| `.diamond` / `.diamond-content` | Losange et son contenu contre-rotaté |
| `.selectable` / `.selectable-on` | Les deux états de tout élément qui se choisit |
| `.name-value` | Paire nom / valeur à liseré gauche |
| `.pill` / `.stat-token` | Pastille, jeton de récapitulatif |
| `.alert-success` / `.alert-error` | Encarts de retour |
| `.auth-container` / `.auth-footer` / `.auth-links` | Mise en page d'authentification |

`gold-fill` est déclaré en `@utility` et non en composant : il doit rester
combinable avec un variant (`data-[state=active]:gold-fill`).

## Composants (inventaire)

`front/src/shared/components/atoms/` — primitives shadcn « new-york », éditées
sur place, jamais emballées.

`front/src/shared/components/molecules/` — les composites de la charte :

| Fichier | Rôle |
|---|---|
| `diamond.tsx` | Losange 5 / 12 / 34 px, la seule icône du système |
| `gold-rule.tsx` | Filet dégradé, filet à losange |
| `ornate-corners.tsx` | Les quatre équerres d'un panneau de premier plan |
| `section-heading.tsx` | Intitulé Cinzel + filet, variante encadrée |
| `panel.tsx` | Panneau principal et encart interne |
| `choice-tile.tsx` | Vignette de choix |
| `selectable-row.tsx` | Ligne sélectionnable à trois colonnes |
| `journey-step.tsx` | Étape de parcours (franchie, en cours, à venir) |
| `stat-token.tsx` | Jeton de récapitulatif + infobulle |
| `name-value-row.tsx` | Paire nom / valeur |
| `record-block.tsx` | Bloc de fiche |
| `form-text-input.tsx` / `field-error.tsx` | Champ de formulaire et son erreur |

## Justification des choix

- **Polices auto-hébergées** (`@fontsource`) plutôt qu'un `<link>` Google Fonts :
  aucune requête sortante au chargement, polices dans le bundle.
- **Tokens shadcn conservés, valeurs remappées** : les 29 primitives vendues
  continuent de fonctionner sans réécriture de leur `className`, et le reste de
  l'application bascule sans être touché.
- **Rayons à zéro par les tokens** plutôt que par une reprise fichier par
  fichier : un seul endroit à relire, aucune régression possible ailleurs.
- **Rouge de danger conservé** : voir l'écart assumé plus haut.
