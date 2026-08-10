# Doctrine de granularité — la chaîne de traçabilité

Objectif : un découpage si fin que l'exécution devient mécanique — les agents ne peuvent pas se tromper parce qu'à aucun moment ils n'ont à interpréter. Corollaire économique : plus les tickets sont atomiques, plus ils sont exécutables par `ouvrier` (Qwen) au lieu de `dev-senior` (Claude).

## 1. La chaîne (chaque maillon référence le précédent par son ID)

```
R-NNN     Réponse de Charly à une question de Margarette (Discord, dans le ticket [SPEC])
  ▼
UA-NNN    Unité Atomique de spec (l'analyste) : UN comportement observable, en EARS + Gherkin + table de valeurs
  ▼
INV-NNN   Invariant de contrat (architecte) : schéma Zod / port du domaine, avec mapping UA → INV
  ▼
E-NNN     Étape du plan d'implémentation (architecte) : un fichier, une action, dans l'ordre
  ▼
t_xxxx    Ticket Kanban (orchestrateur) : 1 ticket = 1 à 3 UA, jamais plus
  ▼
Test      1 UA = au moins 1 test dont le NOM contient l'ID : it("UA-012: rejette un jet à 0 dé")
  ▼
Commit    type(scope): sujet [t_xxxx][UA-012]
```

Le `revieweur` vérifie la chaîne par les IDs : toute UA sans test = revue refusée ; tout code sans UA = refactor non demandé = refusé.

## 2. L'Unité Atomique (UA) — définition stricte

Une UA est bonne si elle passe ces 5 tests :
1. **Un seul comportement observable** — si la phrase contient « et », découpe.
2. **EARS** : « Quand \<déclencheur\>, [si \<condition\>,] le système doit \<réponse mesurable\> ». Pas de « devrait », pas de « rapidement », pas de « convivial » : chiffres et valeurs exactes.
3. **Table de valeurs** : entrées exactes → sorties exactes, y compris les erreurs (code, message exact).
4. **Testable sans interprétation** : un modèle faible doit pouvoir écrire le test sans poser de question.
5. **Indépendante ou à dépendance déclarée** : `dépend de : UA-008`.

Exemple (moteur de dés) :
```markdown
### UA-012 — Rejet d'un jet à zéro dé   [source: R-004] [dépend de: UA-010]
QUAND un joueur soumet un jet, SI le nombre de dés est < 1,
le système DOIT rejeter avec l'erreur DICE_COUNT_INVALID sans émettre d'événement.
| entrée (notation) | sortie |
|---|---|
| "0d6"  | erreur DICE_COUNT_INVALID, message "Le nombre de dés doit être entre 1 et 20." |
| "-1d6" | erreur DICE_COUNT_INVALID (même message) |
| "1d6"  | jet accepté (cas frontière → couvert par UA-010) |
```

## 3. Tailles maximales (draconien = chiffré)

| Objet | Limite | Si dépassée |
|---|---|---|
| Ticket [SPEC] | 1 capacité utilisateur (« lancer un dé », pas « le système de combat ») | Margarette découpe en plusieurs [SPEC] |
| Spec de l'analyste | ≤ 15 UA par spec | scinder en spec-partie-1/2 avec dépendances |
| Ticket de code | 1 à 3 UA, diff attendu ≤ ~80 lignes, 1 seule couche hexagonale (domaine OU application OU infra OU front) | l'orchestrateur redécoupe |
| Ticket [TEST] | les UA d'UN ticket de code miroir | idem |
| Plan de l'architecte (mode dégradé) | 1 étape E-NNN = 1 fichier, ≤ 20 lignes modifiées | redécouper le plan |

**Droit de refus** : un dev qui reçoit un ticket portant plus de 3 UA, plusieurs couches, ou une UA ambiguë (échoue à un des 5 tests) DOIT bloquer : `kanban_block(reason="dependency: ticket à redécouper — <motif>")`. Refuser est un succès, pas un échec.

## 4. Le filet anti-couture : le ticket [INTEG]

Le risque de l'hyper-granularité n'est pas dans les briques mais dans les jointures (chaque pièce correcte, l'ensemble faux). Parade : chaque feature se termine par UN ticket `[INTEG][M]` (assigné à `testeur`, parent = tous les FEAT de la feature) qui écrit les tests de bout en bout traversant TOUTES les couches (front → API → domaine → Mongo/Redis → WS retour), en suivant les parcours Gherkin de la spec — pas les UA une à une. Le ticket [REVIEW] a le [INTEG] en parent.

## 5. Coût assumé de la granularité

Plus de tickets = plus de passages d'orchestrateur et de handoffs (tokens DeepSeek flash, négligeable) contre moins d'erreurs d'interprétation et moins de quota Claude (les tickets 1-UA en couche unique passent presque tous à `ouvrier`). Nouveau routage attendu : `dev-senior` ne garde que les UA marquées ALGO (logique non triviale : calculs de règles D&D, concurrence Redis, protocole WS) et le débogage. Si l'orchestrateur constate qu'une feature génère > 25 tickets, il le signale dans le ticket [INTEG] de la feature : c'est le signe d'une spec à re-scinder en deux features.
