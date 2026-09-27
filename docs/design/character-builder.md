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

- L'en-tête nomme la campagne où naît le personnage, sous « Création de
  personnage », puis la progression.
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
- La fiche s'ouvre sur la description de ce qu'elle montre (espèce, classe,
  historique, lignage, compétence, sort…), puis ses pastilles, puis ses blocs.
  Elle repart du haut à chaque nouvelle option.
- Les choix qui en commandent d'autres gardent leur explication : à quoi sert le
  lignage et sa caractéristique d'incantation, ce qu'est le Style de combat ou
  l'Ordre (même une fois l'option retenue), ce qu'est l'alignement.
- Une option désactivée ne reçoit pas le survol : la raison de son
  indisponibilité s'écrit sous la liste.
- Vignettes à losange (choix unique) : rôle `radio`, nommées par leur libellé.
  Lignes à case losange (choix multiples) : `aria-pressed`, nommées par leur
  nom, la sous-ligne en description.

## 4. Étapes particulières

- **Historique** : le bloc « Bonus de caractéristiques » liste une par ligne les
  trois caractéristiques éligibles au +2 / +1.
- **Compétences** : chaque ligne rappelle en sous-ligne la caractéristique de la
  compétence ; survolée, la compétence montre sa description, sa caractéristique
  et, dès l'aperçu serveur, son modificateur.
- **Caractéristiques** : le nom de chaque caractéristique, souligné en pointillé
  doré, ouvre au survol ou au focus une infobulle — ce qu'elle mesure, les
  compétences qu'elle gouverne. La fiche place en tête les bonus posés : « +2 »,
  « +1 » ou « aucun bonus posé » pour chaque caractéristique éligible.
- **Sorts** : pour toutes les classes sauf le Magicien, les sorts de niveau 1
  choisis sont les sorts préparés. Le Magicien remplit son grimoire (6 sorts) et
  choisit ses préparés plus tard, sur la fiche, parmi ses sorts (B01-SOR-005).
  Le remplacement des sorts préparés au fil du jeu dépend de la classe (le
  Rôdeur en remplace un par Repos long) : l'aide n'en promet rien de général.
- **Équipement** : on porte une armure au plus **et** un bouclier. Une armure
  unique se porte par un interrupteur, comme le bouclier ; entre plusieurs, on
  en choisit une (ou « Sans armure »). Le bouclier n'est jamais proposé à la
  place d'une armure.

## 5. Récapitulatif

Blason (initiales de la classe), nom, origine, « Niveau 1 Classe · Historique »,
alignement ; six caractéristiques, étoilées quand elles sont principales pour la
classe ; PV, Maîtrise, CA, Initiative ; jetons à infobulle pour les sorts mineurs, les sorts
et les aptitudes ; maîtrises ; vitesse, taille, vision dans le noir. Les valeurs
calculées viennent de l'aperçu serveur ; avant lui, des choix bruts, et « — »
pour ce que seul le serveur calcule.

## 6. Sortie

« ← Retour aux personnages » ouvre une confirmation : la création n'est
enregistrée qu'à la dernière étape. « Quitter sans sauvegarder » ramène à la
liste, « Continuer la création » referme la modale. Les liens du bandeau
(Campagnes, Profil, Déconnexion) ne sont pas interceptés.

## 7. Écarts à la maquette

- Les boutons gardent « Précédent » / « Suivant », et non « Retour » /
  « Continuer ».
- La maquette montre une étape Sous-classe au niveau 3 ; le créateur n'en a
  pas, la sous-classe ne se choisit pas au niveau 1.
- Les dons, les invocations et la configuration d'Initié à la magie gardent
  leurs boutons et menus : ce sont des réglages dans une carte, pas une liste
  de choix.
- La maquette propose une « Répartition recommandée » des caractéristiques ; le
  créateur offre les valeurs standard, l'achat par points, les dés et, pour le
  MJ, la saisie manuelle.
- L'infobulle des caractéristiques n'existe pas dans la maquette : ajoutée à la
  demande de Charly (27/09/2026).
- Le récapitulatif ajoute l'initiative aux trois pastilles de la maquette.

## 8. Textes du catalogue

Le catalogue publie la description des espèces, des classes, des compétences,
des caractéristiques et des alignements
(`back/src/modules/characters/domain/reference/descriptions.ts`).

- Espèces, classes, compétences et alignements : textes de la maquette.
- Caractéristiques : SRD 2024 (`docs/characteres/srd-2024/`, CC-BY-4.0), traduit.
- **Aasimar** : absent de la maquette, texte rédigé par Claude le 27/09/2026 —
  **à relire par Charly**.

## 9. DÉCISION REQUISE — données encore absentes

La maquette affiche des données que le projet n'a pas. Elles ne sont pas
inventées côté front : les blocs correspondants sont omis.

| Donnée manquante | Où la maquette l'affiche | État dans le projet |
|---|---|---|
| Composantes d'un sort (V, S, M + matériau) | Pastille « Composantes » de la fiche Sort | Absente |
| « Aux niveaux supérieurs » d'un sort | Bloc de la fiche Sort | Absent |
| Catégorie d'un sort (Dégâts, Soin, Contrôle, Utilitaire, Zone…) | Étiquette de droite d'une ligne de sort | Absente ; la ligne montre « Mineur » ou « Niv. 1 » |
| Vitesse et vision propres à un lignage (Drow 36 m, Elfe des bois 10,50 m) | Pastilles de la fiche Lignage | Connues du back, non publiées dans le catalogue |
| Sorts de lignage des niveaux 3 et 5 | Bloc « Sorts de lignage » | Absents ; seul le sort mineur de niveau 1 existe |
| Sous-classes (liste et descriptions) | Étape Sous-classe | Absentes (choix du niveau 3) |
| Répartition recommandée par classe | Mode « Répartition recommandée » | Absente (fonctionnalité et donnée) |

Options :

1. **Compléter le catalogue** (schéma `shared`, données de référence du back,
   spécification si une règle en découle). Coût principal : les sorts de niveau
   0 et 1 (composantes, niveaux supérieurs, catégorie) et un contrôle de
   conformité au PHB 2024. La vitesse et la vision de lignage ne demandent que
   de publier ce que le back connaît déjà.
2. **Rester en l'état**. Rien à maintenir de plus ; la fiche Sort n'a ni
   composantes ni niveaux supérieurs, et la fiche Lignage renvoie à ses traits
   pour la vitesse et la vision.
