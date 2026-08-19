# Journal consolidé des échanges

## Nature de ce journal

Ce document préserve la chronologie et le sens des échanges ayant conduit à la cible
actuelle. Ce n'est pas une transcription mot à mot : l'archive exacte est conservée dans
[HISTORY/2026-08-19-product-specification-session.md](HISTORY/2026-08-19-product-specification-session.md).
Les règles normatives restent dans [REQUIREMENTS.md](REQUIREMENTS.md).

## 1. Demande initiale de reprise documentaire

Le propriétaire a expliqué que le SaaS avait été développé rapidement avec Claude Code,
sans spécifications fonctionnelles et techniques suffisamment stables. Cette situation
créait trois risques : décisions implicites, dérive d'architecture et choix incohérents
entre sessions d'agents IA.

Il a demandé d'interrompre temporairement les nouvelles fonctionnalités et de distinguer
en permanence :

1. son intention produit ;
2. ce que le code implémente réellement ;
3. la cible finalement souhaitée.

Il a imposé une progression en six phases : compréhension, audit en lecture seule,
analyse des écarts, spécifications fonctionnelles, spécifications techniques, puis
documentation du repository. Il a également imposé le vocabulaire FAIT, DÉCISION,
HYPOTHÈSE, RECOMMANDATION et DÉCISION REQUISE, ainsi que le cycle
`SPEC → PLAN → CODE → TEST → REVIEW`.

## 2. Vision produit exprimée

Le produit doit simplifier la création et l'évolution des personnages de jeu de rôle et
fournir une interface de combat rapide, intuitive et immersive. Les utilisateurs visés
sont les joueurs et MJ débutants, occasionnels ou manquant de temps pour maîtriser et
appliquer toutes les règles.

Roll20 et Foundry VTT ont été cités comme solutions existantes jugées lourdes, longues à
configurer, parfois lentes et trop riches en fonctions secondaires. La vision privilégie
la fiche, les combats, les dés et la narration plutôt que la reproduction numérique de
tous les accessoires possibles d'une table physique.

Les premiers parcours décrits ont été :

- créer une campagne et inviter des amis de la plateforme ;
- créer, éditer puis consulter des personnages ;
- préparer et exécuter un combat proche du parcours d'action de Baldur's Gate 3 ;
- distribuer un butin normal ou caché après le combat ;
- faire évoluer la fiche avec niveaux, objets et événements de campagne ;
- à terme, rédiger la campagne en Markdown et conserver des notes.

Le combat et la fiche ont été identifiés comme les deux piliers du MVP. Une possibilité
future de combats autonomes de type roguelike a aussi été évoquée.

## 3. Utilisateurs, campagnes et confidentialité

Les acteurs retenus sont l'administrateur de plateforme, le propriétaire de campagne,
le MJ, les co-MJ et les joueurs. Tous possèdent un compte. Le système d'amis et les
invitations servent à rejoindre une campagne.

Les premières règles formulées puis précisées sont :

- un joueur ne voit pas les fiches complètes des autres joueurs ;
- les MJ voient toutes les fiches et leur évolution ;
- les jets secrets du MJ restent cachés ;
- une campagne est invisible aux personnes non invitées ;
- une campagne accepte plusieurs co-MJ ;
- son créateur reste propriétaire, même s'il devient joueur ;
- un propriétaire qui quitte doit nommer un MJ comme nouveau propriétaire ;
- un joueur contrôle un seul personnage assigné dans une campagne ;
- seul un MJ peut céder ou réattribuer un personnage.

Le résumé de combat publiquement visible a finalement été fixé à : nom, portrait,
classe, niveau et PV, avec les règles de détail différentes pour alliés et ennemis.

## 4. Périmètre D&D et expérience utilisateur

Le propriétaire a d'abord envisagé plusieurs systèmes de jeu pour élargir le marché. La
décision finale pour la première cible a été D&D 5e 2024 uniquement, avec les trois
livres de base 2024 et toutes les règles de création, progression et combat. Toutes les
combinaisons valides de classe et d'espèce doivent être couvertes, ainsi que le
multiclassage.

Il a rejeté l'idée d'un tutoriel ou d'un parcours distinct pour débutants : le parcours
doit rester commun et simple. Une hypothèse d'interface a ensuite été confirmée :

- actions immédiatement visibles ;
- actions impossibles masquées ou désactivées ;
- motif court et contextuel d'indisponibilité ;
- détail du calcul consultable à la demande.

Le propriétaire fournit les données et contenus de référence. À sa demande explicite,
la présente documentation ne traite pas leur analyse juridique.

## 5. Création et évolution des personnages

La création de niveau 1 doit couvrir caractéristiques, espèce, classe, historique,
compétences, équipement, sorts et choix associés. Âge, taille et poids sont obligatoires ;
la description physique est facultative. Un portrait peut être téléversé et sert ensuite
au combat ; sinon un profil générique blanc et gris est affiché.

Le propriétaire a refusé l'ajout d'une sauvegarde automatique de brouillon, considérant
le processus actuel assez court et la fiche ensuite éditable.

La validation par le MJ a été rendue structurante. Il ne doit pas exister de période de
modification libre avant le premier combat. Après validation :

- espèce, nom, historique et taille sont immuables ;
- âge, poids, portrait et description peuvent évoluer ;
- changer de classe ou de caractéristiques impose de rejouer toute la construction
  depuis le niveau 1, comme une respécialisation dans Baldur's Gate 3 ;
- l'inventaire est conservé et les implications des armes et armures non maîtrisées
  sont appliquées ;
- la nouvelle construction requiert l'approbation du MJ.

Les recommandations relatives à la respécialisation ont été validées : conservation du
niveau total, multiclassage, absence de soin, recalcul des maîtrises, remplacement des
ressources de classe et conservation des états persistants.

La progression ne gère pas l'expérience. Le MJ déverrouille un niveau individuellement
ou collectivement pour les personnages assignés.

## 6. Modes de jeu et carte

Trois configurations ont été envisagées : tous à distance sur ordinateur, tous en
présentiel avec carte projetée et téléphones, ou groupe hybride. Le propriétaire a rendu
le premier cas prioritaire pour octobre.

L'idée de manipuler directement toute la carte sur téléphone a été jugée peu adaptée au
petit écran. Une proposition de contrôleur simplifié a été validée pour plus tard : le
joueur sélectionne intention, déplacement ou cible depuis son téléphone, tandis que la
prévisualisation est visible sur l'écran collectif.

Le choix entre grille isométrique et positionnement continu a été débattu. La décision
finale est une vue 2D du dessus, sans grille, à positionnement continu, sur plan
horizontal avec obstacles. Toutes les unités visibles sont des mètres et non des pieds.

Une précision ultérieure a imposé de séparer chemin, visibilité, couverture, ligne
d'effet et destination : certains sorts ignorent des obstacles ou permettent de passer
directement d'un point A à un point B, par exemple par téléportation.

## 7. Combat

Le parcours de référence décrit est : sélectionner arme ou sort, sélectionner une cible
atteignable et visible, calculer les modificateurs, effectuer le jet d'attaque, comparer
à la classe d'armure, lancer les dégâts, réduire les PV et appliquer les états.

Le MJ prépare intégralement le combat avant son lancement : créatures, personnages,
obstacles, positions et éléments cachés. La carte peut rester une surface blanche. Les
joueurs distants voient carte et fiche ; le MJ conserve son pouvoir d'arbitrage.

Le propriétaire a accepté les objectifs proposés de durée de tour et a confirmé que la
priorité du MJ prime sur une automatisation aveugle. Il a ensuite validé les décisions
fonctionnelles détaillées sur le cycle du combat, les déplacements, actions, réactions,
informations de PV, ressources et corrections du MJ.

Deux précisions ont modifié les règles initialement proposées :

- en cas d'égalité d'initiative, les créatures à égalité relancent seulement un jet de
  départage ; leur ordre relatif change, pas leur place globale ;
- les invocations suivent leur effet et un PNJ ou une patrouille peut entrer dans un
  combat déjà commencé, avec insertion par initiative sans réordonner les autres.

La reprise exacte après fermeture de navigateur ou redémarrage serveur est obligatoire.

## 8. Dés, compétences et repos

Le propriétaire s'est interrogé sur la part à laisser manuelle hors combat afin de
responsabiliser les joueurs. La recommandation validée garde le geste du joueur mais
automatise le bonus : il clique sur une compétence et choisit jet normal, avantage ou
désavantage.

Les jets ayant une conséquence doivent être produits par le backend. La génération des
caractéristiques pendant la création reste une exception provisoire, car elle n'est pas
critique pour l'autorité d'une partie. Les animations 3D, sons et effets de suspense sont
souhaités mais ne déterminent pas le résultat.

Le repos court ou long est collectif. Tous les joueurs concernés valident leur état et
le MJ garde la décision finale. Un repos long ouvre une fenêtre de préparation des
sorts, qui se ferme dès qu'un combat commence. Les exceptions propres aux classes, dons
ou capacités doivent être respectées.

## 9. Butin et investigation

Le propriétaire a demandé une fenêtre de butin qui s'ouvre lorsqu'un joueur clique sur
le portrait d'une créature morte, comme dans Baldur's Gate 3. Si plusieurs joueurs
ouvrent la même créature, ils partagent une fenêtre synchronisée et voient les objets
visibles retirés par les autres.

La découverte par investigation reste visible seulement par l'investigateur et les MJ.
Les objets non récupérés sont transférés, à la fermeture du butin, dans une réserve des
MJ avec le nom du combat, le monstre et l'objet. Les recommandations de concurrence,
tentative, confidentialité et attribution ultérieure ont toutes été validées.

## 10. Fonctions de campagne et avenir

Les objets personnalisés sont requis pour octobre, sans import entre campagnes. Le
journal de personnage, la rédaction Markdown de campagne, la musique, les vagues, la
2,5D/3D, les voix transformées et l'IA MJ sont différés.

Le modèle économique n'est pas choisi. Ont été évoqués les abonnements, des limites de
campagnes/joueurs/contenus et une facturation future de l'IA au coût des tokens avec
marge. Le pilote privé auprès d'environ dix amis doit d'abord fournir fréquence d'usage,
durée des tours, exactitude des règles et retours qualitatifs.

## 11. Audit du repository

Une phase de lecture seule a ensuite cartographié le monorepo, sa stack, ses modules et
ses tests. Elle a confirmé que comptes, amis, campagnes, personnages niveau 1, objets et
bestiaire existent partiellement, mais que combat, progression, repos, butin et temps
réel sont absents.

L'audit a découvert des écarts de confidentialité et d'isolation inter-campagnes, ainsi
que des attributions insuffisamment contraintes. Il a aussi établi que Redis est déclaré
mais inutilisé, tandis que Socket.IO est seulement annoncé.

À la question de savoir si la mention d'une visibilité contraire signifiait une
correction, il a été clarifié qu'aucun code n'avait été corrigé pendant l'audit. Les
termes FAIT et ÉCART décrivaient uniquement l'observation.

Le propriétaire a proposé d'abandonner Redis dans le monolithe ; cette proposition a
été retenue. Socket.IO a été distingué d'un webhook : le premier convient aux échanges
bidirectionnels de combat, le second aux notifications serveur à serveur et ne remplace
pas un canal temps réel navigateur.

## 12. Analyse des écarts et spécifications

Le propriétaire a ensuite lancé la phase 3 et validé l'analyse des écarts. Il a précisé
que la date d'octobre ne devait pas réduire le périmètre, que le portrait serait
téléversé et que le combat devait être durable.

La phase 4 a produit puis fait valider successivement les blocs :

- rôles, autorisations et visibilité ;
- personnage, validation, progression et respécialisation ;
- préparation et cycle de combat ;
- carte, déplacements et obstacles ;
- initiative, tours, actions, sorts, réactions et renforts ;
- dés, repos, mort, butin et investigation ;
- invitations, courriels, objets personnalisés et fonctions futures.

À plusieurs reprises, le propriétaire a validé à la fois les spécifications et toutes
les décisions requises proposées. Les derniers ajouts validés concernent les mètres,
les effets ignorant les obstacles, le départage d'initiative, la préparation des sorts
et l'arrivée de créatures en cours de combat.

## 13. Point atteint

Les phases 1 à 4 disposent maintenant d'un référentiel écrit. La phase 5 reste à mener :
architecture cible, données, API, protocole temps réel, sécurité, stockage, erreurs,
logs, monitoring, tests et déploiement. Aucun de ces choix techniques manquants ne doit
être inventé à partir du seul code actuel.
