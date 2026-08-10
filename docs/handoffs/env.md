# Variables d'environnement — donjon-dragon

**Ne JAMAIS inscrire de valeur dans ce fichier ni dans `.env.example`.** Les valeurs
réelles vivent dans `back/.env`, en local, non versionné.

## La source de vérité est le code

Le contrat d'environnement est déclaré en Zod dans
[`back/src/config/env.validation.ts`](../../back/src/config/env.validation.ts) et
validé au démarrage : une variable manquante ou invalide fait échouer le boot
immédiatement, avec le détail des champs en cause. `back/.env.example` en est la
copie commentée, à jour, prête à être renommée en `.env`.

Ce document ne recopie donc pas la liste des variables : une seconde liste
divergerait, et c'est exactement ce qui s'est produit avec sa version précédente.
Pour connaître les variables, leur rôle et leur défaut, lire `back/.env.example`.

## Les trois règles qui ne se lisent pas dans la liste

**Aucun défaut pour un secret.** `JWT_SECRET` et les identifiants d'envoi d'email
n'ont pas de valeur par défaut, volontairement : un secret qui retombe sur une valeur
connue publiquement est pire qu'un boot qui échoue. `JWT_SECRET` fait 32 caractères
minimum et sert aussi, par séparation de domaine, à dériver la clé des jetons CSRF.

**`NODE_ENV=production` n'est pas cosmétique.** C'est lui qui passe les cookies de
session en `secure` : hors production, ils voyagent en clair. Un déploiement qui
oublie cette variable expose les jetons de session.

**`CORS_ORIGINS` est une liste, jamais un joker.** Dès que `credentials: true` est
actif — et il l'est, la session est en cookies — le navigateur refuse
`Access-Control-Allow-Origin: *`. Il faut renvoyer l'origine exacte de l'appelant,
donc savoir lesquelles sont légitimes.

## Front et CI

Le front **n'utilise aucune variable d'environnement** : aucun `import.meta.env`,
aucun `VITE_*` dans `front/src`. L'API est appelée en chemin relatif. Rien à
configurer côté build.

La CI (`.github/workflows/ci.yml`) ne requiert aucun secret : elle lance
typecheck, lint, test et un build de smoke, sans déploiement.

## Déploiement

Rien n'est déployé à ce jour. Le projet tourne en local via `scripts/start-local.sh`.
Quand un hébergeur sera choisi, c'est ici que se documentera l'endroit où ses secrets
sont stockés — pas leurs valeurs.
