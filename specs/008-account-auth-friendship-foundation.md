# Spec 008 — Fondation comptes, sessions et amitiés

## Références normatives

- `PRODUCT.md`, sections Utilisateurs et MVP — comptes et amis sont nécessaires aux
  parcours de campagne.
- `REQUIREMENTS.md`, SF-001 — une paire non ordonnée d'utilisateurs ne possède qu'une
  relation d'amitié.
- `DEC-016` — la paire canonique est garantie par la persistance MongoDB.

## Parcours utilisateur

Un visiteur crée un compte, reçoit un lien de vérification, active son adresse puis
obtient une session. Une fois connecté, il recherche un autre utilisateur par son
pseudo et gère le cycle complet de leur relation d'amitié.

## Inscription et vérification

1. Une inscription valide crée un compte non vérifié et envoie un lien à l'adresse
   fournie.
2. Le lien contient un secret à usage unique qui n'est jamais stocké en clair.
3. Une vérification valide marque l'adresse comme vérifiée, ouvre une session et mène
   vers l'espace authentifié.
4. Une adresse non vérifiée ne peut pas ouvrir une session par mot de passe.
5. Le parcours navigateur complet est vérifié avec un transport de courriel local au
   test ; aucun secret ni endpoint de capture n'est exposé par l'API.

## Session

1. Les secrets de session sont transportés par cookies `HttpOnly` et ne sont pas
   exposés dans le corps HTTP ni dans le stockage Web.
2. Le renouvellement remplace la lignée présentée conformément à la rotation définie
   par le domaine.
3. La déconnexion révoque la session présentée et efface ses cookies.
4. Une mutation authentifiée reste protégée contre les requêtes intersites.

## Amitiés

1. La clé de paire est construite en ordonnant les deux identifiants utilisateur ; le
   sens demandeur/destinataire n'en modifie jamais la valeur.
2. MongoDB impose un index unique sur cette clé : deux créations simultanées, y
   compris en sens inverse, ne peuvent pas produire deux documents.
3. Une relation `pending` interdit une seconde demande et une relation `accepted`
   interdit une nouvelle demande.
4. Après un refus, une nouvelle demande remplace atomiquement la relation refusée :
   elle reçoit un nouvel identifiant et éventuellement un nouveau sens, sans laisser
   de document résiduel.
5. Une collision détectée par l'index est traduite en conflit métier, jamais en erreur
   HTTP 500 ni en fuite d'un détail MongoDB.

## Preuves attendues

- tests de domaine et d'application pour la paire canonique, les doublons et le
  remplacement après refus ;
- test de schéma pour l'index MongoDB unique ;
- tests front/back existants pour connexion, renouvellement et amitiés ;
- test Playwright inscription → capture du lien → vérification → espace authentifié ;
- `pnpm typecheck`, `pnpm lint`, puis `pnpm test`.
