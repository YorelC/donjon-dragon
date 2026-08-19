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

Le butin d'un monstre vaincu est généré et persisté une fois. Les participants ouvrent
le même contenant en cliquant sur son portrait et voient les prises visibles en temps
réel. Une investigation réussie reste privée entre l'investigateur et les MJ. À la
fermeture décidée par le MJ, les objets non pris rejoignent une réserve MJ avec la
provenance combat, monstre et objet.

## Conséquences

Les récupérations concurrentes doivent être arbitrées atomiquement par le serveur. Une
information cachée ne doit jamais être incluse dans les événements envoyés aux clients
non autorisés.
