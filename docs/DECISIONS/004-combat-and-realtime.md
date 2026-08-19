# DEC-004 — Combat persistant et temps réel

- **Statut :** validée
- **Contexte :** le combat est le principal différenciateur du produit et doit survivre
  aux interruptions sans incohérence entre clients.

## Décision

Le combat suit les états préparation, en cours, pause, butin et terminé. Le MJ prépare
les participants, obstacles, positions et éléments cachés, puis décide du lancement et
de la fin. Un combat se restaure exactement après fermeture d'un navigateur ou
redémarrage du serveur.

La carte du MVP est blanche, 2D, horizontale, continue et mesurée en mètres. Les règles
de visibilité, couverture, ligne d'effet et chemin sont distinctes afin que les sorts,
téléportations et capacités puissent ignorer certains obstacles lorsque leurs règles le
prévoient.

Le serveur valide et persiste une action avant de diffuser son événement. MongoDB reste
la source de vérité. Socket.IO est la cible pour les échanges bidirectionnels en temps
réel ; un webhook n'est pas adapté au combat interactif.

Une créature invoquée suit sa règle propre. Un PNJ ou renfort ajouté après le lancement
effectue son initiative et rejoint l'ordre sans modifier l'ordre relatif existant. Si
sa place est déjà passée, il agit au round suivant.

En cas d'égalité d'initiative, seules les créatures concernées relancent un départage ;
le résultat change leur ordre relatif, pas leur position globale dans l'initiative.

## Conséquences

- Les commandes doivent être atomiques, idempotentes et versionnées.
- L'état mémoire d'une connexion ne suffit jamais à reprendre un combat.
- Le protocole précis et le recours éventuel à des transactions MongoDB exigent une
  décision technique avant implémentation.
