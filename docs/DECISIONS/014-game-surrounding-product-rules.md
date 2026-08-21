# DEC-014 — Règles produit autour de la partie

- **Statut :** validée
- **Date :** 20 août 2026
- **Contexte :** le bloc B09 doit relier les règles D&D aux parcours de validation,
  jets libres, repos collectif, butin, investigation, réserve MJ, corrections et audit
  sans décider leur représentation technique.

## Décision

Un jet libre de joueur est public par défaut. Avant le tirage, le joueur peut le rendre
privé entre lui et les MJ. Le MJ choisit public ou secret, avec le secret par défaut.
Une règle imposant une audience plus restrictive prévaut toujours. L'audience ne change
jamais selon le résultat.

Pendant un repos collectif, un MJ peut répondre à la place d'un joueur inclus, qu'il
soit connecté ou non. Le MJ choisit alors explicitement les dés de vie, activités
d'objet et autres options du personnage ; l'audit distingue toujours le choix du joueur
du choix effectué par le MJ à sa place. Le MJ peut aussi exclure explicitement un
personnage, qui reste alors inchangé.

Lorsqu'un repos long est interrompu après au moins 1 heure, il devient une étape de
repos court à finaliser. Les joueurs ou le MJ agissant à leur place effectuent les choix
admissibles, puis le MJ valide ces bénéfices. Une éventuelle reprise du repos long est
une étape distincte et ajoute l'heure exigée par l'interruption.

Les objets que le MJ impose à une créature et ses possessions réellement récupérables
sont figés avec l'instance au lancement du combat. Tables, paramètres, visibilité et
mode moyenne ou dés des sources aléatoires sont aussi préparés, sans être résolus. À la
première ouverture autorisée du contenant, le serveur réunit les éléments figés et
résout toutes les sources aléatoires, visibles ou cachées, exactement une fois. Le
résultat est persisté avant projection ; l'investigation consulte ce même contenu et ne
génère rien séparément.

Chaque dénomination monétaire — cuivre, argent, électrum, or et platine — forme une pile
récupérable partiellement comme un objet. La première prise serveur valide gagne. Le
produit ne crée ni bourse de groupe, ni partage égal, ni conversion automatique.

La recherche ciblée de butin sur une dépouille emploie Intelligence (Investigation).
Cette règle produit déroge volontairement à la distinction générale du PHB et du DMG ;
elle reste limitée à ce parcours. Les recherches génériques et l'étude d'autres objets
conservent leurs compétences D&D normales.

Les conflits et refus de règle utiles à l'arbitrage des MJ sont conservés dans l'audit
fonctionnel sans TTL, hors étapes détaillées d'un combat supprimées après clôture du
butin. Les refus d'autorisation et traces de sécurité appartiennent à un journal
technique distinct, minimisé et conservé douze mois selon DEC-016.

## Conséquences

- Toute substitution du MJ pendant un repos est une action attribuée au MJ, jamais une
  usurpation silencieuse du joueur.
- La première ouverture concurrente d'un butin exige une résolution serveur unique et
  persistée ; le choix de transaction reste reporté à la Phase 5.
- Les objets imposés par le MJ ne disparaissent pas lorsqu'une table aléatoire ne donne
  aucun résultat, sous réserve que la créature laisse une source récupérable.
- Un objet caché appartient au contenant généré, mais sa projection reste privée
  jusqu'à une investigation réussie.
- Les règles détaillées et leurs critères sont inventoriés dans la
  [`matrice B09`](../rules/dnd-2024/B09-GAME-SURROUNDING-PRODUCT-RULES.md), validée
  explicitement comme bloc complet le 20 août 2026.
