# Analyse des écarts

## Méthode

Cette analyse compare l'intention produit, la cible consolidée dans
[REQUIREMENTS.md](REQUIREMENTS.md) et le code décrit dans
[CURRENT-STATE.md](CURRENT-STATE.md). Elle ne constitue ni un plan d'implémentation ni
une autorisation de corriger automatiquement le code.

| Domaine | Cible validée | État observé | Qualification |
|---|---|---|---|
| Isolation des campagnes | Toute ressource doit appartenir à la campagne autorisée | Plusieurs chargements de personnage reposent seulement sur son identifiant | Incohérence d'autorisation, priorité critique |
| Visibilité des fiches | Un joueur ne voit que sa fiche complète | Les membres actifs peuvent lire des informations plus larges | Fonctionnalité contraire à l'intention |
| Attribution | Cible active et membre de la même campagne | Recherche de cible globale observée | Règle métier incomplète |
| Rôles et propriété | Un propriétaire, au moins un MJ, transitions encadrées | Modèle partiel, transitions non conformes dans tous les cas | Fonctionnalité partielle |
| Création niveau 1 | Toutes les combinaisons valides, fiche soumise au MJ | Parcours présent mais cas particuliers et bugs connus | Fonctionnalité partielle |
| Inventaire des espèces | Dix espèces du Player's Handbook 2024 | Neuf espèces ; Aasimar absent | Donnée et fonctionnalité manquantes |
| Inventaire des sorts | Inventaire complet du Player's Handbook 2024 | Dataset local de 390 sorts ; contrôle du livre p. 331 : `telepathy` est l'unique identité absente | Donnée manquante identifiée |
| Profils fonctionnels des sorts | Les 391 sorts possèdent paramètres, coûts, ciblage, durée, conséquences, fins et arbitrage éventuel testables selon B06 | 506 annotations pour 390 clés, dont 177 informatives et plusieurs sémantiquement incorrectes ; aucun moteur d'exécution | Données partielles et non fiables, fonctionnalité manquante |
| Identité de création | Alignement, âge, taille, poids, description et portrait selon la cible | Seul le nom appartient au modèle courant | Fonctionnalité manquante |
| Choix d'origine | Langues, taille d'espèce, dons et outils validés | Parcours et validations backend incomplets ; taille P de l'Humain et du Tieffelin non représentable | Règles métier partielles |
| Choix de classe niveau 1 | Tous les outils, maîtrises, expertise, invocation et grimoire requis | Plusieurs choix absents ou contrôlés uniquement par l'interface | Fonctionnalité partielle |
| Sorts de niveau 1 | Listes, sources et quotas validés par le serveur | Interface filtrée mais backend permissif ; grimoire du Magicien non distingué | Incohérence d'autorité |
| Équipement de départ | Paquetages, possession, port, or et babiole gratuite cohérents | Le backend vérifie l'existence des objets, pas leur provenance complète ; catalogue de babioles absent | Règle métier incomplète |
| Catalogue d'équipement | Profils PHB complets : armes, armures, outils, variantes, matériel, contenants et paramètres mécaniques selon B07 | 159 identités présentes, mais variantes fusionnées et nombreuses règles conservées seulement en texte | Données partielles et non exécutables |
| Possession et port | Exemplaires versionnés, provenance, mains, emplacement, conteneurs, poids optionnel et transferts consentis | Inventaire `{itemKey, quantity}` intégré au build, armure/bouclier/or seulement ; commandes et exemplaires absents | Fonctionnalité majoritairement manquante et couplage obsolète |
| Armes et bottes d'armes | Maîtrise et botte distinctes ; propriétés, munitions, mains, déclencheurs, limites et effets actifs selon B07 | Profils portent leurs marqueurs et huit bottes, mais aucun moteur ne les exécute ; choix de botte incomplet | Fonctionnalité partielle, non exploitable |
| Objets magiques | Catalogue DMG A–Z, identification, harmonisation, charges, prochaine aube, malédictions, artefacts, conscience et projections privées | Catalogue DMG et état magique absents ; potions/parchemins PHB sans profil actif | Données et fonctionnalité manquantes, risque de fuite à prévenir |
| Validation de fiche | États brouillon/soumis/refusé/accepté, version examinée figée, décision par tout MJ actif, correction puis resoumission auditée et verrouillage | Statut unique `waiting_adventure`, réédition directe et aucun historique de décision | Fonctionnalité contraire à la cible et manquante |
| Portrait | Téléversement et défaut générique | Champs et parcours cibles absents | Fonctionnalité manquante |
| Progression mono-classe | Niveaux 2 à 20 conformes à la matrice B02 : gains de classe et sous-classe, dons, sorts, ressources et remplacements | Niveau forcé à 1 ; sous-classes, dons de progression, sorts supérieurs et ressources sans représentation active complète | Fonctionnalité manquante malgré des données partielles |
| Déverrouillage de niveau | Action individuelle ou groupée par le MJ, niveau en attente unique, finalisation par le joueur assigné et révocation avant commencement seulement | Aucun état ni parcours de progression ; aucune action groupée | Fonctionnalité manquante |
| Progression et état de partie | Déverrouillage possible à tout moment, mais début et finalisation interdits pendant `EN_COURS`, `EN_PAUSE` et `BUTIN` ; aucun soin ou repos implicite | Aucun verrou de progression ni état d'aventure suffisant pour prouver la conservation des ressources | Fonctionnalité manquante |
| Composition multiclassée | Séquence de niveaux, classe initiale, niveaux par classe, profils d'entrée et historique déterministes selon B03 | Une seule `classKey`, niveau forcé à 1 et aucun profil multiclassé | Fonctionnalité manquante |
| Prérequis multiclasses | Score 13 dans les caractéristiques principales de la nouvelle classe et de toutes les classes présentes, avec Force **ou** Dextérité pour le Guerrier | Métadonnées dormantes non validées ; le Guerrier encode à tort Force **et** Dextérité | Fonctionnalité manquante et donnée incorrecte |
| Incantation multiclassée | Préparations séparées, provenance par classe, table d'emplacements 1–20, arrondi séparé des classes fractionnaires et Magie de pacte distincte | Sorts limités aux niveaux 0–1, `level1Slots`, aucune sous-classe active ni table multiclassée | Fonctionnalité manquante malgré un socle niveau 1 |
| Respécialisation | Déverrouillage MJ, reconstruction par le joueur, ancien build actif jusqu'à acceptation, valeurs de base sans relance, possessions et états externes conservés, ressources du nouveau build pleines | Édition générale pouvant remplacer librement classe et caractéristiques ; aucun workflow, version ou état d'aventure complet | Fonctionnalité contraire à la cible et majoritairement manquante |
| État d'aventure | Fiche active et dérivés, PV courants/temporaires, dés de vie, ressources, inspiration, conditions, concentration, inventaire, cinq monnaies, harmonisation, repos, mort et corrections selon B04 | Seuls plusieurs dérivés et maxima niveau 1, un catalogue informatif de conditions, des marqueurs de concentration et un inventaire de création avec or unique existent ; aucune valeur courante, instance d'état, harmonisation, repos, mort ou correction compensatoire | Majoritairement manquant malgré un socle de calcul partiel |
| Jets de création | Exception client provisoire permise | Aléatoire côté client | Acceptable provisoirement |
| Autres jets | Serveur autoritaire, historique, audience figée avant tirage ; joueur public par défaut ou privé, MJ secret par défaut ou public | Port de dé cryptographique présent, mais aucun use-case, historique ou projection de partie | Fonctionnalité manquante malgré un socle technique partiel |
| Catalogue de créatures | 503 profils XMM versionnés et 15 profils PHB paramétrés, avec page, errata, provenance et état de qualité selon B08 | Le seed contient 498 profils MM : cinq Modrons absents, Blink Dog et Faerie Dragon Adult divergents, 89 profils avec au moins une règle tronquée | Données partielles, obsolètes ou corrompues malgré un inventaire largement présent |
| Profils de créatures exécutables | Statistiques, attaques, sauvegardes, dégâts, usages, recharges, sorts, actions légendaires, repaires et préférences de trésor structurés selon B08 | La majorité des mécanismes reste en chaînes libres ; aucune primitive d'action de profil n'est exécutable | Données non exécutables et fonctionnalité manquante majeure |
| Instances, PNJ et invocations | Instances versionnées, états indépendants, contrôle MJ ou prévu par la source, projections privées, compagnons, montures et neuf esprits paramétrés selon B08 | Aucun modèle d'instance non joueur, contrôleur, PNJ, invocation, ressource ou écran de préparation | Fonctionnalité manquante majeure et risque d'exposition du bestiaire |
| Combat | Cycle, initiative, tours, douze actions, Réactions, attaques, dégâts, mort et reprise exacte selon B05 | Aucun contrat, module, route, page ou test de combat ; seulement un port de dés et des effets latents non exécutables | Fonctionnalité manquante majeure malgré un socle descriptif partiel |
| Carte | Géométrie B05 : 2D continue, empreintes circulaires, altitude numérique, distances euclidiennes métriques, obstacles, visibilité, couverture et zones | Carte, positions, empreintes, altitude, terrain, obstacles et visibilité absents | Fonctionnalité manquante majeure |
| Projections de combat | Alliés exacts ; ennemis en états discrets sans nombres ; entités cachées filtrées côté serveur | Aucune projection de combat et visibilité actuelle de fiche trop large | Fonctionnalité manquante et risque d'exposition critique |
| Réactions | Fenêtre 15 s configurable 5–60 s, résolution MJ possible et désactivation limitée au chronomètre | Aucun déclencheur, coût réactif exécutable, suspension ou reprise | Fonctionnalité manquante majeure |
| Lancement et concentration | Accès, provenance, emplacements, composantes, limite d'un emplacement par tour, durée et concentration selon B06 | Runtime limité aux niveaux 0–1 ; aucun emplacement courant, composant consommable, durée, zone ou concentration active | Fonctionnalité majoritairement manquante malgré un socle descriptif |
| Effets magiques hors combat | Temps fictionnel avancé par le MJ et registre persistant rattaché à créature, objet ou lieu | Aucune horloge d'aventure, échéance ou instance persistante | Fonctionnalité manquante |
| Arbitrage des sorts narratifs | Conséquences déterministes automatiques, clause subjective résolue en privé par un MJ après dépense normale | Notes libres sans workflow, audit ni projection privée | Fonctionnalité manquante et risque de fuite |
| Temps réel | Socket bidirectionnel après persistance | Annoncé seulement dans le README | Dette documentaire et fonctionnalité manquante |
| Redis | Absent du MVP monolithique | Déclaré sans utilisation | Configuration probablement obsolète |
| Repos | Décision collective, choix par le joueur ou par un MJ à sa place, conversion d'un repos long interrompu et validation indivisible | Aucun état, choix, déclencheur ou parcours de repos | Fonctionnalité manquante |
| Butin | Objets imposés figés, aléatoire résolu une fois à la première ouverture, contenant partagé, piles monétaires concurrentes et réserve MJ | Aucun contenant, exemplaire, génération, provenance ou réserve | Fonctionnalité manquante majeure |
| Investigation de butin | Intelligence (Investigation), une tentative par personnage et dépouille, résultat et découverte privés | Aucun compteur, jet, connaissance privée ou projection filtrée | Fonctionnalité manquante et risque de fuite |
| Audit fonctionnel | Mutations, arbitrages, conflits et refus de règle utiles persistés avec acteur, version, motifs et projections autorisées | Horodatages d'agrégats seulement ; aucun événement, avant/après ou historique consultable | Fonctionnalité manquante majeure |
| Objets personnalisés | Création limitée à la campagne, identité sans collision, versions mécaniques immuables, migration, archivage, attribution et texte privé selon B07 | Domaine et lecture partiels ; une clé de campagne peut masquer l'officielle ; écriture, versionnement, migration et archivage absents | Fonctionnalité partielle et comportement actuel contraire à la cible |
| Invitations par courriel | Notification applicative autoritaire + courriel | Invitation applicative présente, courriel absent | Fonctionnalité partielle |
| Documentation d'architecture | Doit refléter les dossiers actuels | Références anciennes aux dossiers numérotés | Dette documentaire |
| Configuration | Contrat unique cohérent | README, Compose et validation divergent | Dette technique / décision à vérifier |

## Priorités de risque

### P0 — Avant toute exposition publique

- corriger l'isolation inter-campagnes ;
- appliquer côté serveur les règles de visibilité et d'attribution ;
- sécuriser toutes les commandes de combat dès leur conception ;
- valider les secrets et variables de configuration de production.

### P1 — Socle du produit cible

- fiabiliser toutes les variantes de création niveau 1 ;
- introduire validation, état d'aventure et progression ;
- construire le cycle de combat persistant et le moteur de règles serveur ;
- introduire le canal temps réel sans en faire la source de vérité ;
- couvrir carte, initiative, actions, repos et butin par des tests d'acceptation.

### P2 — Cohérence et exploitation

- retirer Redis du périmètre monolithique tant qu'aucun besoin concret ne le justifie ;
- aligner README, Compose, contrat d'environnement et documentation d'architecture ;
- ajouter les courriels d'invitation et les objets personnalisés ;
- définir logs, monitoring, sauvegardes et déploiement dans la phase technique.

## Décisions encore nécessaires pour la phase technique

Les décisions produit recensées dans la conversation ont été validées. Les sujets
suivants ne doivent cependant pas être inventés pendant l'implémentation :

> **DÉCISION REQUISE — Modèle transactionnel MongoDB**
>
> Déterminer quelles opérations exigent une transaction MongoDB, notamment transfert
> de propriété, lancement d'un combat, résolution atomique d'une action et transfert
> du butin. L'usage de transactions appartient explicitement au propriétaire du projet.

> **DÉCISION REQUISE — Protocole temps réel détaillé**
>
> Définir les commandes, événements, accusés de réception, numéros de version,
> stratégie de reconnexion et règles d'idempotence avant d'implémenter Socket.IO.

> **DÉCISION REQUISE — Stockage des portraits**
>
> Choisir le stockage local initial, les limites de taille et formats, puis la cible
> hébergée. Cette décision influence sécurité, sauvegardes et déploiement.

> **DÉCISION REQUISE — Modèle de calcul des règles**
>
> Définir la représentation versionnée des règles D&D, des exceptions et des effets
> structurés afin d'éviter une accumulation de conditions propres à chaque contenu.

> **DÉCISION REQUISE — Hébergement et modèle économique**
>
> Le produit public, ses coûts, abonnements, quotas et facturation IA restent à
> brainstormer après validation du MVP privé.
