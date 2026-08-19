# Cartographie de l'existant

## Portée et date de l'audit

Cette cartographie décrit l'état observé pendant la phase 2. Elle constitue un **FAIT
daté**, pas la spécification du produit. Aucun code n'a été modifié pendant cet audit.

## Stack et structure

Le repository est un monorepo pnpm TypeScript strict :

| Périmètre | Technologies observées |
|---|---|
| Contrat partagé | package `shared`, schémas Zod 3 |
| Backend | NestJS 10, Mongoose 8, MongoDB |
| Frontend | React 18, Vite, Tailwind CSS 4, shadcn/ui |
| État client | Zustand et TanStack Query |
| Tests unitaires/intégration | Vitest |
| Tests de bout en bout | Playwright sous `front/e2e/` |

Le backend suit une architecture hexagonale par module sous
`back/src/modules/<module>/{presentation,application,domain,infrastructure,testing}`.
Les règles d'architecture détaillées sont dans
[architecture-back.md](architecture-back.md) et les règles actives dans
[`../.claude/rules/`](../.claude/rules/).

## Modules fonctionnels observés

### Authentification et utilisateurs

- inscription, connexion et gestion de session ;
- vérification de l'adresse électronique ;
- envoi de courriel par SMTP Gmail ;
- profil utilisateur et recherche utile aux relations entre utilisateurs.

### Amitiés

- système d'amis déjà présent ;
- les utilisateurs peuvent rechercher et relier d'autres utilisateurs ;
- cette relation sert déjà de base à l'invitation dans une campagne.

### Campagnes

- création et consultation de campagnes ;
- adhésion par invitation ;
- rôles de joueur et de MJ ;
- notion de propriétaire ;
- changement de rôle et attribution de personnage partiellement présents.

### Personnages

- création de personnage de niveau 1 ;
- consultation et édition ;
- construction guidée par les données de règles présentes dans le repository ;
- niveau actuellement forcé à 1 ;
- absence d'état d'aventure complet, de progression et de portrait tel que spécifié.

### Objets et bestiaire

- domaines et données de référence pour les objets et les monstres ;
- lecture de ces référentiels ;
- présence d'une notion de portée campagne dans le domaine ;
- absence d'API complète de création d'objet personnalisé dans le parcours cible.

## Fonctionnalités absentes de l'existant audité

- moteur de combat et cycle de vie d'un combat ;
- carte 2D continue ;
- initiative, tours, actions, réactions et résolution complète ;
- persistance et reprise exacte d'un combat ;
- repos collectif ;
- butin partagé et investigation privée ;
- progression au-delà du niveau 1 et respécialisation ;
- communication temps réel installée et opérationnelle ;
- courriel d'invitation de campagne.

## Autorisations observées

La présence dans une campagne et plusieurs distinctions de rôle sont vérifiées. L'audit
a cependant identifié des contrôles insuffisants :

- après validation de l'accès à la campagne de l'URL, certaines opérations chargent un
  personnage uniquement par son identifiant sans vérifier qu'il appartient à cette
  même campagne ;
- tout membre actif peut actuellement consulter des données de fiche plus larges que
  la visibilité cible ;
- une attribution peut rechercher sa cible globalement sans exiger son appartenance à
  la campagne ;
- le transfert de propriété et certaines transitions MJ/joueur ne satisfont pas encore
  toutes les règles consolidées.

Ces constats sont des vulnérabilités fonctionnelles à corriger avant d'exposer le SaaS
à des utilisateurs non fiables.

## Dés

Un service de dés existe au backend, mais les jets employés pendant la création de
personnage sont effectués côté client avec une source aléatoire locale. Aucun moteur
serveur complet ne porte encore les jets de combat, de compétence ou de butin.

## Temps réel et infrastructure

- Redis est déclaré dans Docker Compose et mentionné dans le README, mais aucun package
  ni code applicatif observé ne l'utilise.
- Socket.IO est annoncé dans le README, mais n'est ni installé ni implémenté.
- Aucun webhook ne fournit — ni ne devrait fournir — la synchronisation interactive
  d'un combat entre navigateurs.
- MongoDB est la base persistante existante et reste la source de vérité visée.

Des divergences de configuration ont aussi été relevées entre Docker Compose, le
README et le contrat d'environnement : noms de variables CORS, variables de courriel
et contraintes de secret JWT notamment. Elles devront être revérifiées au moment de la
spécification technique et du déploiement.

## Documentation et conventions

- `AGENTS.md` et `CLAUDE.md` redirigent vers les règles du projet.
- Le répertoire réellement actif est `.claude/rules/` ; toute mention de `.Codex/rules/`
  doit être considérée comme une dérive documentaire tant qu'elle n'est pas corrigée.
- Des ADR et documents plus anciens décrivent encore une architecture backend à
  dossiers numérotés qui n'existe plus.
- [pipeline-hermes.md](pipeline-hermes.md) décrit le pipeline de travail actuel.

## Vérifications constatées pendant l'audit

- typecheck : réussi ;
- lint : réussi ;
- tests `shared` : 104 réussis ;
- tests `back` : 700 réussis ;
- tests `front` : 415 réussis ;
- total : 1 219 tests réussis ;
- Playwright : non exécuté pendant l'audit.

Ces résultats ne prouvent pas la conformité aux exigences cibles : ils qualifient
uniquement la cohérence de l'implémentation existante au moment de l'audit.
