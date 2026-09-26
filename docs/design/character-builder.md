# Créateur de personnage — interaction et écarts à la maquette

> Maquette de référence :
> [`docs/ui-design/Page_menu_utilisateur_avec_profil/Createur de personnage.dc.html`](../ui-design/Page_menu_utilisateur_avec_profil/Createur%20de%20personnage.dc.html),
> sur la charte `docs/ui-design/Charte_graphique_v2.html`. Les valeurs visuelles
> passent par les tokens de [`tokens.md`](tokens.md).

## 1. Mise en page

| Largeur | Disposition |
|---|---|
| `xl` et plus | Trois panneaux à équerres : rail des étapes (268 px), scène, récapitulatif (372 px). L'écran est fixe, chaque panneau défile seul. |
| `md` à `xl` | Rail et scène côte à côte. Le récapitulatif s'ouvre dans un tiroir à droite, par le bouton « Récapitulatif » de la scène. |
| sous `md` | Rail puis scène empilés, la page défile. Le tiroir reste disponible. |

Dans la scène, dès `lg`, les choix occupent la colonne de gauche et la fiche
détaillée celle de droite, avec Précédent / Suivant en dessous. Sous `lg`, la
fiche passe sous les choix.

## 2. Rail des étapes

- Chaque étape montre sa pastille (✓ franchie, numéro sinon), son libellé et sa
  valeur : le nom retenu, le compteur `2/3`, ou « À choisir ».
- Le liseré doré marque l'étape ouverte. Une étape qui attend que les
  précédentes soient franchies est grisée et inactive.
- Le nom accessible d'une étape est son seul libellé ; la valeur la décrit.

## 3. Fiche détaillée au survol

- Survoler une option, ou lui donner le focus au clavier, affiche sa fiche à
  droite, sans la retenir. Quitter la zone de choix rend la fiche à ce qui est
  retenu. Changer d'étape oublie le survol.
- Sans survol ni sélection, la fiche présente l'étape : ce qu'il reste à
  choisir, et ce qui est déjà retenu.
- Une option désactivée ne reçoit pas le survol : la raison de son
  indisponibilité s'écrit sous la liste.
- Vignettes à losange (choix unique) : rôle `radio`, nommées par leur libellé.
  Lignes à case losange (choix multiples) : `aria-pressed`, nommées par leur
  nom, la sous-ligne en description.

## 4. Récapitulatif

Blason (initiales de la classe), nom, origine, « Niveau 1 Classe · Historique »,
alignement ; six caractéristiques, étoilées quand elles sont principales pour la
classe ; PV, Maîtrise, CA ; jetons à infobulle pour les sorts mineurs, les sorts
et les aptitudes ; maîtrises ; vitesse, taille, vision dans le noir. Les valeurs
calculées viennent de l'aperçu serveur ; avant lui, des choix bruts, et « — »
pour ce que seul le serveur calcule.

## 5. Sortie

« ← Retour aux personnages » ouvre une confirmation : la création n'est
enregistrée qu'à la dernière étape. « Quitter sans sauvegarder » ramène à la
liste, « Continuer la création » referme la modale. Les liens du bandeau
(Campagnes, Profil, Déconnexion) ne sont pas interceptés.

## 6. Écarts à la maquette

- Les boutons gardent « Précédent » / « Suivant », et non « Retour » /
  « Continuer ».
- La maquette montre une étape Sous-classe au niveau 3 ; le créateur n'en a
  pas, la sous-classe ne se choisit pas au niveau 1.
- Les dons, les invocations et la configuration d'Initié à la magie gardent
  leurs boutons et menus : ce sont des réglages dans une carte, pas une liste
  de choix.

## 7. DÉCISION REQUISE — données absentes du catalogue

La maquette affiche des textes que le catalogue servi par le back ne contient
pas. Ils ne sont pas inventés côté front : les blocs correspondants sont omis.

| Donnée manquante | Où la maquette l'affiche |
|---|---|
| Description d'une espèce | Chapeau de la fiche Espèce |
| Description d'une classe | Chapeau de la fiche Classe |
| Composantes d'un sort (V, S, M) | Pastille « Composantes » de la fiche Sort |
| « Aux niveaux supérieurs » d'un sort | Bloc de la fiche Sort |
| Catégorie d'un sort (Combat, Soin, Contrôle…) | Étiquette de droite d'une ligne de sort |
| Description d'une compétence | Infobulle d'une ligne de compétence |
| Description d'un alignement | Infobulle d'une vignette d'alignement |

Options :

1. **Enrichir le catalogue** (schéma `shared`, données de référence du back, spécification).
   La fiche devient complète comme la maquette. Coût : saisie et relecture des
   textes pour 9 espèces, 12 classes, tous les sorts de niveau 0 et 1, 18
   compétences et 9 alignements, plus un contrôle de conformité au PHB 2024.
2. **Rester en l'état**. Rien à maintenir de plus. Les fiches Espèce et Classe
   n'ont pas de chapeau, et une ligne de sort montre son niveau au lieu de sa
   catégorie.
