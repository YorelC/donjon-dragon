# Produit

## Vision

Créer un SaaS permettant de jouer à D&D avec une extrême simplicité pour la création et
l'évolution des personnages, puis de résoudre des combats rapidement dans une interface
moderne et immersive.

Le produit ne cherche pas à reproduire tous les outils possibles d'une table virtuelle.
Il se concentre sur les piliers qui apportent le plus de valeur :

- fiche de personnage fiable et valorisante ;
- progression guidée par les règles ;
- combat tactique fluide ;
- jets de dés attrayants ;
- support de campagne utile au MJ.

## Problème utilisateur

Les joueurs et MJ occasionnels doivent aujourd'hui maîtriser de nombreuses règles et
configurer des interfaces jugées lourdes. En ligne, un combat impose souvent de nombreux
clics, des feuilles réparties, des calculs manuels et une préparation technique qui nuit
au rythme de la partie.

Roll20 et Foundry VTT constituent les références citées, mais sont perçus comme trop
complexes, chargés en fonctionnalités secondaires, longs à configurer et parfois peu
fluides.

## Proposition de valeur

- Une session peut commencer rapidement.
- Une fiche valide est calculée par le système.
- Le joueur voit ses actions disponibles sans suivre un cours de règles.
- Les actions impossibles sont masquées ou désactivées avec une raison courte.
- Le détail des calculs est consultable sans ralentir l'action principale.
- Le combat suit un parcours proche de Baldur's Gate 3, mais visuellement simplifié.
- Le MJ conserve la priorité et peut arbitrer les exceptions.

## Utilisateurs

### Joueur

Joueur débutant ou occasionnel, ou joueur expérimenté souhaitant réduire les tâches
administratives. Il possède un compte et au maximum un personnage attribué par campagne.

### Maître du jeu

Utilisateur qui crée ou administre une campagne, prépare les rencontres, consulte les
fiches, contrôle les créatures et arbitre les exceptions. Une campagne peut avoir
plusieurs co-MJ.

### Propriétaire de campagne

Attribut indépendant du rôle. Le créateur est initialement propriétaire et MJ, mais le
propriétaire peut devenir joueur si un autre MJ reste actif.

### Administrateur de plateforme

Acteur global envisagé, sans accès fonctionnel automatique au contenu des campagnes pour
le MVP. Ses capacités produit restent hors périmètre.

## Système de jeu

- **DÉCISION** : D&D 5e 2024 uniquement pour la première cible.
- **DÉCISION** : couverture des trois livres de base 2024 fournis par le propriétaire.
- **DÉCISION** : toutes les règles de création, progression et combat doivent être
  respectées, avec leurs exceptions.
- **DÉCISION** : toutes les combinaisons valides d'espèce et de classe sont disponibles.
- **DÉCISION** : multiclassage requis.
- **DÉCISION** : aucun calcul d'expérience ; le MJ débloque les niveaux.
- **DÉCISION** : interface et distances affichées en mètres, jamais en pieds.

Le contenu de référence — descriptions des sorts, capacités, objets et monstres — est
fourni par le propriétaire. Les questions de droits sur ce contenu ne font pas partie du
présent travail.

## Parcours principaux

### Campagne

Un utilisateur crée une campagne, devient propriétaire et MJ, puis invite des amis déjà
inscrits. Les destinataires reçoivent une notification dans l'application et un email.

### Personnage

Un joueur rejoint une campagne, crée un personnage complet de niveau 1, le soumet au MJ
et utilise sa fiche une fois validée. Un MJ peut créer plusieurs personnages et les
attribuer.

### Combat

Le MJ prépare un combat : participants, monstres, obstacles, positions, éléments cachés
et butin. Il le lance, puis les joueurs agissent chacun à leur tour depuis leur fiche et
la carte. Le backend applique les règles, les jets et les conséquences.

### Progression

Le MJ débloque individuellement ou collectivement une montée de niveau. Le joueur suit
le parcours applicable et le backend valide le nouveau build.

### Butin

Après le combat, les joueurs ouvrent les portraits des ennemis vaincus. Le conteneur est
partagé en temps réel. L'investigation privée peut révéler des objets cachés. Les objets
non récupérés rejoignent la réserve partagée des MJ.

## Modes d'utilisation

### Priorité MVP

Tous les participants jouent à distance sur ordinateur. Chaque joueur voit sa fiche et
la carte ; le MJ dispose des informations complètes.

### Futur mode présentiel ou hybride

Les joueurs utilisent leur téléphone comme contrôleur simplifié. La carte est projetée
sur un écran collectif et les joueurs choisissent actions, cibles et déplacements sans
avoir à manipuler une carte complète sur petit écran.

## MVP cible

- comptes, amis et invitations de campagne ;
- rôles joueur, MJ, co-MJ et propriétaire ;
- création complète et validation MJ d'un personnage niveau 1 ;
- fiche calculée et état d'aventure ;
- montée de niveau manuelle et multiclassage ;
- objets personnalisés de campagne ;
- préparation et exécution persistante d'un combat ;
- carte 2D continue sans fond ;
- actions, sorts, réactions, états et renforts ;
- jets backend avec animations ;
- repos collectif ;
- butin, investigation et réserve MJ.

## Fonctions différées

### Après le cœur du MVP

- rédaction de campagne et import Markdown ;
- journal de bord et notes ;
- musique de session ;
- vagues automatisées ;
- mode présentiel avec téléphone.

### Long terme

- carte 2,5D et 3D ;
- animations et décors enrichis ;
- salon audio et transformation vocale ;
- MJ piloté par IA ;
- campagnes sans MJ humain ;
- mode combat autonome ou roguelike ;
- autres systèmes de jeu ;
- import de contenu entre campagnes ;
- multilingue ;
- hébergement public, abonnement et paiement.

## Modèle économique

**DÉCISION REQUISE, non bloquante pour le pilote** : aucun modèle n'est validé.

Pistes évoquées : abonnement, limites sur le nombre de campagnes ou de contenus, et
facturation des fonctions IA au coût des tokens augmenté d'une marge. Ces pistes ne sont
pas des décisions.

## Validation produit

Le pilote sera utilisé avec environ dix amis ayant une expérience de Roll20 et Foundry
VTT, ainsi que dans la campagne du propriétaire.

Indicateurs retenus :

- absence d'erreurs de règles ;
- exactitude des calculs de combat ;
- temps moyen d'un tour ;
- nombre de campagnes et de joueurs invités ;
- fréquence d'utilisation ;
- retours qualitatifs des joueurs et MJ ;
- facilité ressentie de création et d'évolution des personnages.
