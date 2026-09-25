# DEC-008 — Détails de création niveau 1

- **Statut :** validée
- **Contexte :** la matrice de conformité a fait apparaître des champs et options de
  création absents de la spécification détaillée.

## Décision

L'alignement est obligatoire à la création et devient immuable après validation de la
fiche par le MJ.

L'âge est un entier positif. Le système ne bloque pas automatiquement une valeur selon
une longévité d'espèce ; le MJ en valide la cohérence. La taille physique est exprimée
en centimètres et le poids en kilogrammes. Le joueur choisit ces deux mesures sur une
échelle bornée par l'espèce. Dès qu'une espèce est retenue, chaque mesure vaut par
défaut le milieu de sa plage, arrondi à l'entier inférieur ; le joueur l'ajuste. La
catégorie de taille D&D reste une donnée mécanique distincte, mais elle est déduite de
la taille physique plutôt que demandée au joueur.
La description physique est facultative.

Une babiole de départ est facultative et gratuite, conformément au *Player's Handbook
2024*. Sa sélection ajoute la babiole au personnage sans modifier l'or de départ. Le
parcours ne propose aucun magasin, catalogue ni autre achat d'équipement pendant la
création.

## Conséquences

- L'alignement rejoint les champs immuables de la fiche validée.
- Taille physique et catégorie de taille ne partagent pas le même champ ; la seconde
  est calculée par le backend depuis la première et persistée pour le moteur de
  règles. Elle ne figure pas dans les requêtes de création, d'édition ni d'aperçu :
  le client ne la fournit jamais. Tant que la taille physique manque, l'aperçu
  retient la catégorie par défaut de l'espèce.
- Les plages de taille reprennent les indications approximatives du PHB 2024,
  converties en centimètres et rendues contraignantes par le produit.
- Le PHB 2024 ne donnant aucune plage de poids, les bornes produit reprennent les
  extrêmes des dernières tables officielles 2014 et de *Volo's Guide to Monsters*.
  Pour l'Aasimar, l'Humain et le Tieffelin désormais jouables en Petite taille, la
  borne basse est élargie à 17 kg, borne historique des petites espèces. Le Goliath
  reprend la table de *Volo's Guide to Monsters* : 93 à 200 kg.
- Les personnages persistés avant ces bornes ou dont la catégorie contredit la
  taille physique sont mis en conformité par une migration de données, à la charge
  du responsable produit ; le domaine ne prévoit aucune tolérance pour eux.
- La validation fonctionnelle des données physiques appartient au backend ; le MJ
  reste l'arbitre de leur vraisemblance narrative.
- Les données de référence identifient les cent babioles du PHB sans prix ; le backend
  garantit que leur sélection ne modifie pas l'or.
- Aucun catalogue d'achat ni calcul de panier n'entre dans le bloc B01.
