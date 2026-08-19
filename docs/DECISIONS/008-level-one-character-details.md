# DEC-008 — Détails de création niveau 1

- **Statut :** validée
- **Contexte :** la matrice de conformité a fait apparaître des champs et options de
  création absents de la spécification détaillée.

## Décision

L'alignement est obligatoire à la création et devient immuable après validation de la
fiche par le MJ.

L'âge est un entier positif. Le système ne bloque pas automatiquement une valeur selon
une longévité d'espèce ; le MJ en valide la cohérence. La taille physique est exprimée
en centimètres et le poids en kilogrammes. La catégorie de taille D&D reste distincte
et ne propose que les valeurs permises par l'espèce. La description physique est
facultative.

Une babiole de départ est facultative et possède une valeur déterminée. Sa sélection
ajoute la babiole au personnage et soustrait automatiquement sa valeur de l'or de
départ. Le solde ne peut pas devenir négatif. Le parcours ne propose aucun magasin,
catalogue ni autre achat d'équipement pendant la création.

## Conséquences

- L'alignement rejoint les champs immuables de la fiche validée.
- Taille physique et catégorie de taille ne doivent pas partager le même champ.
- La validation fonctionnelle des données physiques appartient au backend ; le MJ
  reste l'arbitre de leur vraisemblance narrative.
- La valeur de la babiole appartient aux données de référence et le backend garantit
  la déduction correspondante.
- Aucun catalogue d'achat ni calcul de panier n'entre dans le bloc B01.
