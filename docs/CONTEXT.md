# Contexte consolidé du projet

## Pourquoi ce document existe

Le produit a d'abord été développé rapidement avec des agents IA, sans référentiel
fonctionnel et technique complet. Certaines décisions sont devenues implicites et le
code risquait d'être pris à tort pour la cible produit.

Le développement de nouvelles fonctionnalités a donc été temporairement arrêté pour
reconstruire une documentation exploitable par Codex, Claude Code et un développeur
humain.

## Principe directeur

Toujours distinguer :

1. **l'intention produit** — ce que le propriétaire veut construire ;
2. **l'état actuel** — ce que le repository implémente réellement ;
3. **la spécification cible** — le comportement validé à atteindre.

Une fonctionnalité existante peut être correcte, partielle, expérimentale, obsolète ou
contraire à l'intention. Une contradiction doit être signalée, jamais rationalisée a
posteriori.

## Historique des phases

### Phase 1 — compréhension du produit

La vision a été précisée progressivement :

- simplifier radicalement la création et l'évolution des personnages D&D ;
- rendre les combats en ligne rapides, lisibles et immersifs ;
- éviter la lourdeur ressentie dans Roll20 et Foundry VTT ;
- conserver les fondements utiles du jeu de rôle : fiche, combat, dés et narration ;
- viser d'abord D&D 5e 2024 et les trois livres de base 2024 ;
- automatiser toutes les règles de création, progression et combat ;
- garder une interface autosuffisante plutôt qu'un parcours pédagogique ;
- commencer par le jeu à distance sur ordinateur ;
- différer le téléphone comme contrôleur du mode présentiel.

Les principaux parcours validés sont : campagne et invitation, création de personnage,
combat préparé, combat tour par tour, repos collectif, progression manuelle et butin.

### Phase 2 — audit en lecture seule

Le repository a été cartographié sans modification fonctionnelle. Le socle existant
couvre l'authentification, les utilisateurs, les amitiés, les campagnes, les personnages
de niveau 1, les objets et le bestiaire. Le combat, le temps réel, la progression et le
butin ne sont pas implémentés.

Les vérifications réalisées pendant l'audit ont donné :

- typecheck des trois packages : réussi ;
- lint : réussi ;
- dependency-cruiser : aucune erreur, un avertissement connu ;
- tests unitaires : 104 `shared`, 700 `back`, 415 `front`, soit 1 219 réussis ;
- Playwright non exécuté, faute d'environnement base/seeds/navigateur préparé.

### Phase 3 — analyse des écarts

Les écarts critiques identifiés sont notamment :

- lecture des fiches complètes par tous les membres, contraire à la cible ;
- frontière inter-campagnes insuffisante sur plusieurs opérations de personnage ;
- attribution possible à un utilisateur non vérifié comme membre de la campagne ;
- niveau forcé à 1 ;
- absence d'état d'aventure mutable ;
- absence complète du combat ;
- Redis déclaré mais inutilisé ;
- Socket.IO annoncé mais non installé ;
- documentation et Docker Compose en dérive.

Aucune correction n'a été faite pendant cette phase.

### Phase 4 — spécifications fonctionnelles

Six groupes de spécifications ont été validés :

- SF-001 : acteurs, permissions et visibilité ;
- SF-002 : personnage, validation, progression et re-spécialisation ;
- SF-003 : préparation et cycle de vie du combat ;
- SF-004A/B : carte, déplacements, tours, actions et résolution ;
- SF-005 : dés, repos, mort, butin et réserve MJ ;
- SF-006 : notifications, objets personnalisés et fonctions futures.

La couverture système et les matrices règle par règle B01 à B09 sont validées. B08
contient 91 règles, 10 constats et un registre de 503 profils XMM plus 15 profils PHB.
La source XMM est 5e.tools `v2.33.3`, désignée par le propriétaire avec priorité aux
errata officiels.

## Jalons et contraintes

- **DÉCISION** : objectif maintenu au 20 octobre 2026.
- **FAIT déclaré** : indisponibilité du propriétaire du 2 au 27 septembre.
- **DÉCISION** : l'objectif n'est pas réduit si le jalon glisse.
- **FAIT déclaré** : Codex et Claude Code peuvent travailler en parallèle sur des
  branches et périmètres séparés.
- **RECOMMANDATION maintenue** : figer les contrats partagés et intégrer fréquemment ;
  le parallélisme ne supprime pas les dépendances entre moteur, données, API et UI.
- **DÉCISION** : le pilote initial est hébergé sur l'ordinateur du propriétaire et
  exposé par tunnel Cloudflare.
- **DÉCISION** : aucune contrainte de paiement ou de montée en charge pour ce pilote.

## Gouvernance des changements

- Ne pas coder une fonctionnalité importante sans exigence correspondante.
- Ne pas modifier une règle métier seulement pour s'adapter au code actuel.
- Documenter une contradiction comme un écart.
- Lorsqu'une information manque, utiliser `DÉCISION REQUISE`.
- Toute décision technique significative doit expliciter problème, options et
  conséquences.
- Les transactions Mongo, nouvelles dépendances, nouveaux rôles et élargissements de
  surface d'attaque restent des décisions explicites du propriétaire.

## État courant

La documentation produit et fonctionnelle peut désormais être utilisée comme référence.
La Phase 5A, validée par le propriétaire le 21 août 2026, définit l'architecture
logique, les frontières d'agrégats, le modèle de calcul, la cohérence et les
projections de sécurité dans
[`TECHNICAL-ARCHITECTURE-5A.md`](TECHNICAL-ARCHITECTURE-5A.md) et DEC-015.

La Phase 5B, validée par le propriétaire le 21 août 2026, définit le modèle MongoDB,
les collections, versions, transactions, index, rétentions et initialisation propre dans
[`TECHNICAL-PERSISTENCE-5B.md`](TECHNICAL-PERSISTENCE-5B.md) et DEC-016. Elle intègre
la décision validée de ne jamais faire coexister un niveau déverrouillé et une
respécialisation déverrouillée, permet l'abandon d'une respécialisation et impose le
soft delete des comptes et campagnes. Les données métier ne sont supprimées
physiquement qu'après une demande explicite de l'utilisateur au responsable de la
plateforme, ou lorsqu'un combat terminal nettoie ses seules données de reprise. La base
actuelle est un reliquat non migré. Les combats ouverts conservent une transition par
interaction ; le butin emploie un bail exclusif, et le journal de sécurité est séparé
avec une rétention de douze mois.

Les contrats HTTP et Socket.IO, le stockage des images, la stratégie de tests,
l'observabilité et le déploiement détaillé restent à construire dans les phases
techniques suivantes.
