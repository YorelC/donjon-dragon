# DEC-005 — Dés, repos et butin

- **Statut :** validée
- **Contexte :** les jets doivent rester excitants visuellement sans sacrifier la
  fiabilité des règles ou la confidentialité du MJ.

## Décision

Tous les jets qui ont une conséquence de partie sont générés au backend. Les jets de
caractéristiques de la création constituent la seule exception provisoire. Animation,
son et suspense représentent un résultat déjà déterminé et ne peuvent le modifier.

Les tests hors combat sont lancés depuis la fiche, avec bonus automatique et choix
normal, avantage ou désavantage. Cela conserve l'action du joueur sans lui imposer une
addition manuelle source d'erreurs.

Un repos est collectif, proposé et finalement validé par le MJ. Les joueurs indiquent
qu'ils sont prêts et effectuent leurs choix ; un déconnecté ne bloque pas le groupe. Le
repos long ouvre la fenêtre de préparation des sorts jusqu'au prochain combat, sous
réserve des exceptions de règles.

Le butin d'un monstre vaincu est généré et persisté une fois. Un seul participant à la
fois fouille le contenant depuis son portrait. Le premier accès serveur valide acquiert
un verrou temporaire ; les autres voient l'identité du fouilleur et ne peuvent ni
ouvrir ni prendre jusqu'à libération ou expiration du verrou. Une investigation réussie
reste privée entre l'investigateur et les MJ. À la fermeture décidée par le MJ, les
objets non pris rejoignent une réserve MJ avec la provenance combat, monstre et objet.

## Conséquences

Le verrou n'est pas une transaction maintenue pendant l'interaction utilisateur : il
est un bail persistant acquis et renouvelé atomiquement, afin qu'une déconnexion ne
bloque pas le contenant. Une information cachée ne doit jamais être incluse dans les
événements envoyés aux clients non autorisés.
