# Exigences fonctionnelles cibles

## Statut du document

Ce document consolide les comportements validés pendant les phases de compréhension,
d'analyse des écarts et de spécification fonctionnelle. Il décrit la **cible produit** :
il ne prétend pas que le code actuel implémente déjà ces exigences.

Les écarts avec l'existant sont recensés dans [GAP-ANALYSIS.md](GAP-ANALYSIS.md).

## Principes transverses

- Le système de règles initial est exclusivement D&D 5e 2024, sur le périmètre des
  trois livres de base 2024 fournis par le propriétaire du produit.
- La création, la progression et le combat doivent respecter toutes les règles de ce
  périmètre, y compris leurs exceptions de classe, don, sort, capacité ou effet.
- Les distances sont calculées et affichées en mètres, jamais en pieds.
- L'interface ne donne pas de cours de règles : elle doit être autosuffisante.
- Les actions disponibles sont immédiatement visibles. Une action impossible est
  masquée ou désactivée avec une raison courte et contextuelle.
- Le détail d'un calcul est consultable sans ralentir l'action principale.
- Le serveur est la source d'autorité pour les règles, permissions et jets ayant une
  conséquence sur la partie.
- Le mode distanciel sur ordinateur est prioritaire. Les modes présentiel et hybride
  sur téléphone appartiennent à une évolution ultérieure.

## SF-001 — Campagnes, rôles et permissions

### Objectif

Permettre à plusieurs utilisateurs de participer à une campagne sans exposer les
données privées ni confondre propriété, maîtrise du jeu et contrôle d'un personnage.

### Acteurs

- utilisateur de la plateforme ;
- joueur d'une campagne ;
- maître du jeu (MJ) ou co-MJ ;
- propriétaire de la campagne ;
- administrateur de la plateforme.

### Règles métier

1. Les rôles joueur et MJ sont propres à chaque campagne.
2. Le créateur d'une campagne en devient le propriétaire et le premier MJ.
3. Une campagne possède exactement un propriétaire actif et au moins un MJ actif.
4. Une campagne peut posséder plusieurs co-MJ.
5. Le propriétaire peut nommer un joueur MJ ou faire repasser un co-MJ joueur.
6. Le propriétaire est une responsabilité distincte du rôle actif : il peut jouer,
   mais la campagne doit conserver au moins un MJ.
7. Un propriétaire qui quitte doit d'abord transférer la propriété à un MJ actif ;
   transfert et départ forment une opération indivisible.
8. Un utilisateur non invité ne peut ni découvrir ni consulter une campagne.
9. Toutes les autorisations sont vérifiées côté serveur et toutes les ressources
   chargées doivent appartenir à la campagne présente dans la requête.

### Personnages et attribution

- Un joueur possède au maximum un personnage assigné dans une campagne.
- Un MJ peut créer plusieurs personnages et les attribuer aux joueurs actifs de la
  même campagne.
- Un joueur ne peut pas céder directement son personnage ; seul un MJ peut modifier
  une attribution.
- Lorsqu'un joueur devient MJ, son personnage est automatiquement désassigné et reste
  disponible dans le vivier de la campagne.
- Lorsqu'un MJ redevient joueur, ses privilèges sont retirés immédiatement. Il entre
  dans l'état transitoire « joueur sans personnage » et doit choisir un personnage
  disponible ou en créer un avant d'accéder au reste de la campagne.
- Seul un MJ peut supprimer définitivement un personnage. Lorsqu'une suppression
  ferait perdre un historique utile, l'archivage est privilégié.

### Visibilité

- Un joueur consulte la fiche complète et le détail de construction de son seul
  personnage assigné.
- Il ne consulte pas la fiche complète des autres joueurs.
- Tous les MJ consultent toutes les fiches de la campagne.
- En combat, les participants peuvent voir pour un allié : nom, portrait, classe,
  niveau, PV actuels et PV maximaux.
- L'administrateur de plateforme n'obtient pas automatiquement accès au contenu des
  campagnes dans le MVP.

### Critères d'acceptation essentiels

- Une ressource d'une campagne A est inaccessible par un membre de la campagne B,
  même si son identifiant est connu.
- Une attribution vers un utilisateur extérieur à la campagne est rejetée.
- Le départ du propriétaire sans transfert valide est rejeté.
- Il est impossible de retirer le dernier MJ actif.
- Les changements de rôle prennent effet immédiatement sur les API déjà ouvertes.

## SF-002 — Création, validation et évolution d'un personnage

### Objectif

Permettre de créer n'importe quel personnage de niveau 1 valide dans D&D 5e 2024,
puis de le faire évoluer sans masquer les implications des choix du joueur.

### Création de niveau 1

La création couvre au minimum :

- nom ;
- alignement ;
- espèce et lignée lorsque les règles l'exigent ;
- catégorie de taille lorsque l'espèce laisse un choix ;
- classe ;
- historique ;
- deux langues standards, en plus du commun et des langues accordées par les règles ;
- méthode de caractéristiques, valeurs de base et bonus ;
- compétences, maîtrises et choix ;
- dons et capacités qui demandent une sélection ;
- équipement ;
- sorts connus ou préparés ;
- âge, taille et poids, tous obligatoires ;
- description physique, facultative ;
- portrait téléversé, facultatif.

L'alignement est obligatoire. Après validation par le MJ, il ne peut plus être
modifié.

L'âge est un entier positif. Le système n'impose pas automatiquement de longévité
maximale par espèce ; le MJ contrôle la cohérence. La taille physique est exprimée en
centimètres et le poids en kilogrammes. La catégorie de taille D&D est une donnée
distincte, limitée aux options autorisées par l'espèce.

Le joueur peut sélectionner une babiole facultative, dotée d'une valeur déterminée.
Sa sélection ajoute la babiole au personnage et soustrait automatiquement sa valeur de
l'or de départ. Le solde d'or ne peut pas devenir négatif. Aucun magasin, catalogue ni
autre achat d'équipement n'est proposé pendant la création.

Sans portrait téléversé, l'application emploie un portrait générique : fond blanc et
silhouette de tête grise. Le même portrait est utilisé sur la fiche et en combat.

Toutes les combinaisons valides de classes et d'espèces doivent être possibles. Les
choix invalides sont empêchés et leur indisponibilité est brièvement justifiée.

### Validation

1. Le joueur soumet sa fiche au MJ.
2. La fiche reste inutilisable en combat tant qu'elle n'est pas acceptée.
3. Un refus du MJ comporte un motif.
4. Une fiche créée directement par un MJ peut être validée immédiatement.
5. Il n'existe pas de période de modification libre jusqu'au premier combat : la
   validation du MJ engage le joueur sur ses choix.
6. Aucune sauvegarde automatique de brouillon supplémentaire n'est exigée ; le
   processus actuel de création complète est acceptable.

### Modifications après validation

Sont immuables :

- nom ;
- alignement ;
- espèce, lignée ou héritage ;
- historique ;
- taille ou catégorie de taille.

Restent modifiables :

- portrait ;
- description physique ;
- âge ;
- poids.

### Respécialisation

La classe et les caractéristiques peuvent changer uniquement par une
respécialisation complète :

1. la reconstruction recommence au niveau 1 ;
2. tous les niveaux jusqu'au niveau total actuel sont rejoués ;
3. le niveau total est conservé ;
4. le multiclassage est permis ;
5. la nouvelle construction doit de nouveau être validée par un MJ ;
6. la respécialisation est interdite pendant un combat ;
7. l'inventaire est conservé et aucun nouvel équipement de départ n'est accordé ;
8. toutes les maîtrises sont recalculées : une arme ou armure conservée peut devenir
   non maîtrisée, avec toutes les conséquences prévues par les règles ;
9. les anciennes ressources de classe disparaissent et les ressources de la nouvelle
   construction commencent pleines ;
10. états persistants, conditions et épuisement sont conservés ;
11. les PV actuels deviennent `min(anciens PV actuels, nouveaux PV maximaux)` : une
    hausse du maximum ne soigne pas le personnage.

### Progression

- L'expérience n'est pas gérée.
- Un MJ déverrouille explicitement le niveau suivant d'un personnage.
- Il peut aussi lancer une action groupée pour les personnages assignés aux joueurs.
- Un seul niveau est acquis à la fois, jusqu'au niveau 20.
- La montée de niveau n'entraîne ni soin complet ni repos implicite.
- Le multiclassage fait partie du périmètre obligatoire.

### Sorts préparés

Un personnage ne peut modifier ses sorts préparés qu'après un repos long achevé et
tant qu'aucun combat n'a commencé depuis ce repos. Plusieurs modifications sont
possibles dans cette fenêtre. Les exceptions explicites des classes, dons et autres
règles prévalent. Montée de niveau et respécialisation suivent leurs propres règles.

### État d'aventure

La fiche persistée porte notamment :

- PV actuels, maximaux et temporaires ;
- dés de vie ;
- emplacements de sorts utilisés ;
- ressources de classe et capacités ;
- inspiration ;
- conditions, épuisement et concentration ;
- inventaire, équipement porté, monnaie et harmonisation ;
- état relatif à la mort.

Le serveur calcule les valeurs dérivées et peut exposer leurs sources. Toute correction
manuelle d'un MJ conserve l'ancienne valeur, la nouvelle, l'auteur, la date et le motif.

### Critères d'acceptation essentiels

- Chaque combinaison valide de niveau 1 des trois livres de base peut être soumise.
- Une fiche sans alignement, âge, taille physique ou poids ne peut pas être soumise.
- Après validation, l'alignement ne peut plus être modifié.
- Une fiche non validée ne peut pas participer à un combat.
- Un changement d'âge ne déverrouille pas les champs immuables.
- Une respécialisation conserve l'inventaire mais recalcule les maîtrises.
- Une montée de niveau ne modifie pas implicitement les PV actuels ni les ressources
  dépensées, sauf règle explicite du choix de niveau.

## SF-003 — Préparation, lancement et reprise d'un combat

### Objectif

Permettre au MJ de préparer à l'avance un affrontement, de le lancer rapidement et de
le reprendre exactement après une fermeture de navigateur ou un redémarrage serveur.

### Cycle de vie

`PRÉPARATION → EN_COURS ↔ EN_PAUSE → BUTIN → TERMINÉ`

- Une campagne peut conserver plusieurs combats en préparation.
- Elle ne peut posséder qu'un combat en cours ou en phase de butin à la fois.
- Un combat terminé ne redémarre pas ; le MJ peut le dupliquer en nouvelle préparation.
- Le MJ décide explicitement de la fin du combat puis, séparément, de la fermeture du
  butin. La défaite apparente de tous les adversaires ne clôt pas automatiquement le
  combat.

### Préparation

Seuls les MJ voient et modifient une préparation. Ils définissent :

- nom du combat ;
- dimensions de la carte en mètres, par préréglage ou valeurs personnalisées ;
- participants et camps ;
- créatures du bestiaire ou personnages complets ;
- positions initiales ;
- obstacles ;
- créatures, pièges et zones cachés ;
- tables et objets de butin.

La carte est une surface blanche en vue du dessus, sans fond obligatoire. Elle utilise
un positionnement continu sur un plan horizontal.

Les personnages proposés sont par défaut les personnages actifs, assignés et validés.
Le MJ peut les exclure. Une préparation valide contient au moins un personnage joueur
et un adversaire. Les monstres utilisent leurs PV moyens par défaut ; le MJ peut
demander un jet serveur propre à chaque instance.

### Lancement et persistance

- Aucun bouton « prêt » des joueurs n'est requis ; le MJ lance le combat.
- Le lancement crée un instantané de l'affrontement, tout en reliant l'état courant des
  personnages aux conséquences persistantes.
- Chaque action validée est persistée avant la diffusion de son résultat.
- Une reconnexion ou un redémarrage serveur restaure exactement l'ordre, le tour,
  positions, PV, ressources, effets, concentration, visibilité et historique utiles.
- La fermeture du navigateur d'un participant ne met pas automatiquement en pause.
- Une pause décidée par le MJ bloque les nouvelles actions mécaniques.

### Arrivées après le lancement

- Une invocation suit les règles de l'effet qui fixe son contrôle, son initiative et
  sa durée.
- Le MJ peut faire entrer un PNJ, une patrouille ou un renfort dans le combat courant.
- Le renfort reçoit une position valide et lance son initiative.
- Il est inséré sans modifier l'ordre relatif des participants existants.
- Si sa place d'initiative est déjà passée, il agit au round suivant.
- L'arrivée et son initiative sont consignées dans l'historique.
- Les vagues entièrement automatisées sont reportées après le MVP.

## SF-004 — Carte, tours et résolution des actions

### Carte et déplacement

- Toutes les distances sont affichées en mètres, avec des décimales lorsque nécessaire
  (par exemple `1,5 m`).
- Le positionnement est continu, sans grille, et limité à un plan horizontal.
- Chaque client peut déplacer sa caméra, zoomer et recentrer sans déplacer la caméra
  des autres utilisateurs.
- Un outil de mesure libre est accessible aux participants.
- Un pion porte le portrait, le nom, le camp et la taille de la créature.
- L'occupation et les distances sont calculées depuis les limites physiques des pions,
  selon leur catégorie de taille.
- Un joueur déplace son personnage ; le MJ contrôle ses créatures et peut corriger
  n'importe quel pion.
- Avant confirmation, l'interface montre le chemin, sa distance, son coût, le mouvement
  restant, le terrain et les réactions possibles.
- Le système propose le chemin valide le plus court et accepte des points de passage.
- Le serveur revalide le déplacement confirmé.
- Le mouvement peut être fractionné autour des actions, selon les règles.
- Les espaces occupés, terrains et réactions appliquent les règles exactes.
- Une correction de position par le MJ est journalisée.

### Obstacles, visibilité et exceptions magiques

- Les obstacles peuvent bloquer mouvement, visibilité, ligne d'effet ou couverture.
- La couverture gère au minimum : aucune, partielle, trois-quarts et totale.
- Les entités cachées sont filtrées côté serveur, pas seulement masquées dans le client.
- Le MJ peut effectuer une correction explicite de visibilité ou de couverture.
- Le moteur distingue portée, visibilité, ligne d'effet, couverture, chemin parcouru et
  validité de la destination.
- Un sort ou une capacité peut, lorsque sa règle le prévoit, ignorer un obstacle, la
  couverture ou la ligne de vue.
- Une téléportation ne requiert pas de chemin franchissable entre départ et arrivée,
  mais sa destination doit respecter les contraintes propres à l'effet.

### Initiative et ordre des tours

- Le serveur lance et calcule l'initiative, y compris avantage, désavantage et effets.
- Les résultats des personnages joueurs sont publics ; les jets des créatures du MJ
  sont secrets par défaut.
- En cas d'égalité, seules les créatures à égalité relancent un jet de départage.
- Le résultat le plus élevé fixe leur ordre relatif, sans changer leur position globale
  dans l'ordre d'initiative ; une nouvelle égalité provoque un nouveau départage.
- Le combat conserve le round courant, l'acteur actif et les fenêtres de réaction.

### Tour et ressources d'action

Le système suit au minimum : déplacement, action, action bonus, réaction, nombre
d'attaques et ressources supplémentaires créées par les règles.

- Les effets de début et de fin de tour sont résolus au bon moment.
- Le joueur termine explicitement son tour ; l'interface avertit des ressources
  usuelles encore disponibles.
- Il n'existe pas de limite de temps dure pour un tour.
- Le MJ peut terminer de force un tour ou contrôler le personnage d'un joueur
  déconnecté.

### Résolution d'une action

Le parcours nominal est :

1. sélectionner une arme, un sort, une capacité ou une autre action ;
2. sélectionner variante, niveau ou paramètres utiles ;
3. sélectionner les cibles atteignables et visibles selon l'effet ;
4. afficher une prévisualisation ;
5. confirmer ;
6. faire valider, lancer et résoudre par le serveur ;
7. persister le nouvel état ;
8. diffuser le résultat et jouer les animations.

La commande doit être atomique et idempotente afin qu'une retransmission réseau ne
consomme pas deux fois une ressource ou n'applique pas deux fois les dégâts.

### Attaques, sorts et effets

- Une attaque couvre modificateurs, jet d'attaque, classe d'armure, critique,
  dégâts, résistances, immunités, vulnérabilités et états produits.
- Les attaques multiples, propriétés d'armes et maîtrises sont prises en charge.
- Les sorts contrôlent connaissance ou préparation, emplacement ou ressource, niveau
  choisi, temps d'incantation, concentration, ciblage, zones, sauvegardes, effets et
  surclassement.
- Une créature ne maintient qu'une concentration, sauf exception explicite. Remplacer
  une concentration demande confirmation et applique correctement la transition.
- Les dégâts appliquent dans l'ordre requis les PV temporaires, réductions et PV ; les
  soins et conditions suivent leurs règles et durées.
- Les ressources ne sont consommées qu'après validation de l'action. Elles restent
  dépensées lorsqu'une action valide échoue normalement, par exemple une attaque ratée.

### Réactions et interruptions

- Une réaction ouvre une fenêtre courte configurable ; elle peut être désactivée dans
  les réglages de la campagne.
- L'action déclenchante reste suspendue jusqu'à la réponse, l'expiration ou la décision
  du MJ.
- L'absence de réponse vaut refus.
- Le MJ peut répondre au nom d'une créature ou d'un joueur déconnecté.

### Information présentée

- Les alliés voient les PV actuels et maximaux exacts entre eux.
- Les ennemis affichent par défaut une barre qualitative sans nombres ; le MJ peut
  révéler les valeurs.
- Un joueur ne peut annuler une action après révélation du jet ou de ses conséquences.
- Le MJ corrige par une opération compensatoire journalisée, jamais par suppression de
  l'historique.

## SF-005 — Dés, repos, mort et butin

### Jets de dés

- Tout jet ayant une conséquence de partie est produit et enregistré par le serveur.
- Seuls les jets de caractéristiques utilisés pendant la création peuvent rester
  provisoirement non autoritaires côté client.
- Depuis la fiche, un joueur peut lancer un test de compétence en mode normal, avec
  avantage ou avec désavantage ; le bonus est appliqué automatiquement.
- Un plateau libre permet de combiner d4, d6, d8, d10, d12, d20 et d100.
- Les jets des joueurs sont publics dans la campagne.
- Les jets du MJ sont secrets par défaut, avec possibilité de révélation.
- Animation 3D, son et suspense ne déterminent jamais le résultat : ils représentent
  visuellement un résultat déjà fixé. Fermer l'animation ne relance pas les dés.

### Repos collectif

1. Un MJ propose un repos court ou long hors combat en cours ou en phase de butin.
2. Tous les personnages joués et assignés sont inclus par défaut.
3. Les joueurs connectés indiquent qu'ils sont prêts et effectuent leurs choix.
4. Un joueur déconnecté ne bloque pas indéfiniment le groupe : le MJ peut confirmer son
   inclusion ou l'exclure explicitement.
5. Le MJ valide finalement le repos ; les effets sont appliqués ensemble et persistés.

Le repos court permet les choix de dés de vie avant application. Le repos long applique
les règles complètes et ouvre la fenêtre de modification des sorts préparés décrite dans
SF-002.

### Mort

Un personnage mort reste dans la campagne avec son inventaire et son attribution. Il
peut être ressuscité selon les règles ou archivé par un MJ.

### Génération et consultation du butin

- Le butin d'une créature est généré une seule fois à partir des objets garantis,
  tables aléatoires, monnaie, objets cachés et objets imposés par la campagne.
- Le résultat est persisté et ne change pas à la reconnexion.
- Après la fin du combat, un joueur participant clique sur le portrait d'une créature
  vaincue pour ouvrir son butin, à la manière de Baldur's Gate 3.
- Plusieurs joueurs peuvent ouvrir simultanément le même contenant.
- La fenêtre partagée se met à jour en temps réel lorsqu'un objet visible est pris.
- La première attribution validée par le serveur gagne ; la récupération partielle
  d'une pile est possible.
- Seuls les joueurs dont le personnage participait au combat peuvent récupérer le
  butin.

### Investigation et objets cachés

- Un personnage dispose d'une tentative d'investigation par cadavre, sauf remise à
  zéro explicite par le MJ.
- Le jet et la découverte sont visibles uniquement par l'investigateur et les MJ.
- Un autre personnage peut découvrir indépendamment le même objet.
- Tant qu'il n'a pas réussi, un joueur n'apprend ni le nom de l'objet caché ni le fait
  qu'un autre joueur l'a récupéré.
- Une fois récupéré, l'objet disparaît pour les utilisateurs autorisés à le connaître.

### Clôture du butin

Le MJ ferme explicitement la phase de butin. Tous les objets non récupérés sont alors
transférés dans une réserve de campagne gérée par les MJ, avec leur provenance : combat,
créature et objet. Le butin clos n'est pas rouvert ; un MJ peut attribuer ultérieurement
un objet de la réserve à n'importe quel personnage actif de la campagne.

## SF-006 — Invitations, courriels et contenu personnalisé

### Invitations

- Un utilisateur invite un ami de la plateforme dans sa campagne.
- L'invitation dans l'application est la source d'autorité.
- Un courriel est envoyé en complément ; son échec ne supprime pas l'invitation.
- Le lien du courriel ouvre l'application, exige une authentification et demande une
  confirmation avant acceptation.
- Le cycle couvre `EN_ATTENTE`, `ACCEPTÉE`, `REFUSÉE` et `ANNULÉE`.
- Les commandes sont idempotentes.
- Pour le MVP, les courriels transactionnels sont limités à la vérification du compte
  et aux invitations de campagne.

### Objets personnalisés

Un MJ peut créer pour une campagne un objet qui contient au minimum :

- nom et description ;
- catégorie ;
- poids ;
- empilabilité et quantité ;
- valeur et rareté ;
- image facultative avec représentation par défaut ;
- harmonisation éventuelle ;
- charges et récupération éventuelles ;
- effets structurés ;
- texte privé réservé aux MJ ;
- créateur et campagne d'origine.

Les catégories couvrent au moins armes, armures, boucliers, objets généraux, outils,
consommables, contenants, paquets et objets magiques.

- Les effets structurés peuvent être automatisés.
- Un effet non automatisé est clairement marqué comme manuel.
- Aucun objet personnalisé ne peut exécuter du code arbitraire.
- À l'acquisition, l'objet apparaît sous forme de carte.
- Les joueurs ne voient que les objets qu'ils possèdent, ont découverts ou ont reçus.
- Une modification descriptive peut se propager aux exemplaires existants.
- Une modification mécanique crée une nouvelle version ; les anciens exemplaires
  gardent leur version sauf migration explicite du MJ.
- Un objet n'est pas supprimé s'il existe dans un inventaire : il est archivé et reste
  utilisable dans ses exemplaires existants.
- Le MJ peut l'attribuer directement à un personnage ou à la réserve de campagne.

La création personnalisée de monstres, sorts, capacités, classes et espèces, ainsi que
l'import entre campagnes, est postérieure au périmètre d'octobre.

## Fonctionnalités futures déjà identifiées

- journal de bord des personnages ;
- rédaction et import Markdown de campagne ;
- musique de session ;
- vagues automatisées de combat ;
- contrôleur téléphonique pour parties physiques et hybrides ;
- cartes 2,5D ou 3D et animations enrichies ;
- salon audio avec transformation de voix ;
- maître du jeu assisté ou remplacé par IA ;
- mode combat autonome de type roguelike ;
- autres systèmes de jeu de rôle ;
- autres langues ;
- hébergement public, paiement et consommation IA facturée.

Ces éléments ne doivent pas complexifier l'architecture du MVP tant qu'une spécification
et une priorité explicites ne les font pas entrer dans le périmètre actif.
