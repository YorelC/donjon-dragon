# STATUS — SaaS D&D
Mis à jour : 2026-07-30 — Mode : nominal

## En production
Rien encore — projet en local (`scripts/start-local.sh`).

## En cours
- Pipeline d'agents Hermès (kit v3) installé — voir `hermes/REPRISE.md` pour l'état et ce qui reste.
- Dégraissage du code terminé : tous les lots du § 8d de `docs/refactor/audit-degraissage.md`
  sont passés, plus aucun override ESLint de dette. `pnpm typecheck`, `pnpm lint` et
  `pnpm test` passent (43 tests back, 41 front).

## Bloqué (attend Charly — relayé par Margarette)
- Dégraissage des toolsets Hermès (`hermes -p <profil> tools`), puis `preflight.ps1` au vert.
- Validation manuelle de la page amis : refactorée en 4 containers de zone, aucun test de composant ne la couvre.

## Prochaine release : contenu prévu
- v0.1 : épic pilote « lancer de dés partagé en temps réel » (via le pipeline d'agents).

## Santé
CI : pas encore en place · couverture tests : 84 tests (back + front) · audit sécu : n/a
