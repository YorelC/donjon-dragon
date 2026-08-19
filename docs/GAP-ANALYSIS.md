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
| Inventaire des sorts | Inventaire complet du Player's Handbook 2024 | Dataset local de 390 sorts pour 391 annoncés | Donnée manquante à identifier |
| Identité de création | Alignement, âge, taille, poids, description et portrait selon la cible | Seul le nom appartient au modèle courant | Fonctionnalité manquante |
| Choix d'origine | Langues, taille d'espèce, dons et outils validés | Parcours et validations backend incomplets | Règles métier partielles |
| Choix de classe niveau 1 | Tous les outils, maîtrises, expertise, invocation et grimoire requis | Plusieurs choix absents ou contrôlés uniquement par l'interface | Fonctionnalité partielle |
| Sorts de niveau 1 | Listes, sources et quotas validés par le serveur | Interface filtrée mais backend permissif ; grimoire du Magicien non distingué | Incohérence d'autorité |
| Équipement de départ | Paquetages, possession, port, or et babiole cohérents | Le backend vérifie l'existence des objets, pas leur provenance complète | Règle métier incomplète |
| Validation de fiche | État soumis/accepté/refusé et verrouillage | Non conforme à la cible consolidée | Fonctionnalité manquante |
| Portrait | Téléversement et défaut générique | Champs et parcours cibles absents | Fonctionnalité manquante |
| Progression | Niveaux 2 à 20, multiclassage, déblocage MJ | Niveau forcé à 1 | Fonctionnalité manquante |
| Respécialisation | Reconstruction complète avec inventaire conservé | Absente | Fonctionnalité manquante |
| État d'aventure | PV, ressources, conditions, concentration, inventaire | Modèle incomplet | Fonctionnalité partielle |
| Jets de création | Exception client provisoire permise | Aléatoire côté client | Acceptable provisoirement |
| Autres jets | Serveur autoritaire et historique | Moteur de partie absent | Fonctionnalité manquante |
| Combat | Préparation, tours, actions, reprise exacte | Aucun module de combat | Fonctionnalité manquante majeure |
| Carte | 2D continue en mètres, obstacles et visibilité | Absente | Fonctionnalité manquante majeure |
| Temps réel | Socket bidirectionnel après persistance | Annoncé seulement dans le README | Dette documentaire et fonctionnalité manquante |
| Redis | Absent du MVP monolithique | Déclaré sans utilisation | Configuration probablement obsolète |
| Repos | Décision collective puis validation MJ | Absent | Fonctionnalité manquante |
| Butin | Contenant partagé, investigation privée, réserve MJ | Absent | Fonctionnalité manquante |
| Objets personnalisés | Création versionnée et limitée à la campagne | Domaine partiel, parcours d'écriture absent | Fonctionnalité partielle |
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
