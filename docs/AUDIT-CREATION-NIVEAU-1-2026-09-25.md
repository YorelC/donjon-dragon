# Bilan de la création d'un personnage de niveau 1 — 25 septembre 2026

## Conclusion

La création de niveau 1 est exploitable et cohérente avec le périmètre D&D 5e 2024
retenu par le produit. La matrice B01 reste `PARTIELLE` : 74 règles sont conformes,
10 partielles et 1 absente. Les principaux choix de création, les 120 combinaisons
classe/espèce, les calculs de fiche, l'équipement de départ, le tirage serveur,
l'attribution et le workflow de validation sont implémentés.

Trois dérogations au *Player's Handbook 2024* sont confirmées comme décisions produit :

- aucun achat n'est proposé pendant la création ;
- la catégorie Petit/Moyen est déduite de la taille physique ;
- aucune longévité maximale n'est automatisée, le MJ arbitre la cohérence de l'âge.

## Fonctionnalité fermée dans cet incrément

Une fiche acceptée ne peut toujours pas rouvrir le wizard. Une commande dédiée permet
désormais au joueur assigné et aux MJ autorisés de modifier uniquement :

- l'âge ;
- le poids, dans les bornes physiques de l'espèce ;
- la description physique.

Le contrat refuse tout champ supplémentaire. Le nom, l'alignement, l'espèce, la
lignée, l'historique, la taille physique et la catégorie de taille ne peuvent donc
pas être altérés par ce chemin. La commande contrôle la révision, est idempotente et
emploie l'enveloppe transactionnelle personnage/reçu/audit/outbox.

Le parcours Playwright couvre maintenant une correction réelle après refus, puis une
édition des données personnelles après acceptation. L'ancien scénario ne faisait que
vérifier la présence du lien « Éditer » avant de resoumettre la fiche inchangée.

## Vérifications exécutées

- typecheck `shared`, `back`, `front` et Playwright : réussi ;
- lint complet, règles de couverture et architecture : réussi, avec l'avertissement
  d'architecture préexistant dans le module d'authentification ;
- Vitest : 1 757 tests réussis, 9 tests Mongo conditionnels ignorés faute de variable
  d'environnement, 1 cas déjà marqué `todo` ;
- tests ciblés du nouveau contrat, domaine, use case, contrôleur et dialogue : réussis.

La nouvelle suite Mongo transactionnelle a été lancée explicitement, mais Docker
Desktop n'exposait plus son moteur : le port 27017 répondait, tandis que la connexion
Mongoose expirait et que l'API Docker/WSL était indisponible. Elle doit être rejouée
avant de faire passer les règles de validation de `PARTIELLE` à `CONFORME`.

Playwright n'a pas été exécuté contre les services déjà présents sur les ports 3000
et 5173 : leur identité et leur base cible ne sont pas garanties. Le typecheck E2E et
le lint du scénario passent.

## Écarts restant à traiter

### Priorité 1 — preuves de bout en bout

1. rétablir une réplica-set Mongo locale puis exécuter les trois suites Mongo, dont
   `character-review.mongo.integration.test.ts` ;
2. lancer back et front dans un environnement E2E isolé, puis exécuter Playwright et
   la collection Bruno ;
3. confirmer dans la base les versions immuables, reçus, audits et messages outbox du
   cycle soumission/refus/correction/resoumission/acceptation.

### Priorité 2 — portrait

Le portrait est l'unique règle B01 absente. Le stockage objet est choisi, mais
Spec 010 doit encore arrêter le fournisseur, les formats, la taille maximale, la
validation réelle du contenu, les URL signées, la suppression et le visuel générique.
Aucune implémentation sûre ne peut commencer avant ces décisions.

### Priorité 3 — complétude des règles

- structurer les trois révélations de l'Aasimar, encore descriptives ;
- compléter la provenance affichée des compétences et attaques ;
- traiter le corpus complet des sorts dans B06, hors besoin strict du niveau 1.

Le magasin pendant la création, le choix manuel Petit/Moyen et la limite automatique
d'âge ne sont pas des bugs à corriger : ils sont volontairement exclus par les
décisions produit confirmées le 25 septembre 2026.

## Attribution et suite du cycle

L'auto-attribution du personnage créé par un joueur et l'attribution par un MJ sont
déjà atomiques, idempotentes et testées, y compris en concurrence Mongo. Une fiche
peut être attribuée avant son acceptation, mais ne devient pas utilisable en combat
avant validation ; ce découplage est intentionnel.

Après fermeture des preuves E2E et du portrait, la prochaine évolution fonctionnelle
n'est plus la création de niveau 1 : elle relève de B02 (progression niveaux 2 à 20)
et B03 (respécialisation), selon les priorités produit.
