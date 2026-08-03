# Analyse : LLM local, orchestration et usage du Kanban

Faits relevés le 03/08/2026 sur la machine (config réelle + base Kanban `dnd-saas`), à confronter à la note de transmission « Optimisation de l'ouvrier local ».

---

## 1. Correction préalable : la note de transmission se trompe sur le paramètre décisif

Elle annonce **RTX 4080, 16 Go de VRAM**. Ton script de lancement dit, en commentaire de première ligne :

> `MSI Raider GE78HX 13VH — RTX 4080 Laptop 12 Go VRAM, 64 Go RAM, i9-13980HX`

**12 Go, pas 16.** Toutes ses recommandations matérielles sont à recalculer, et sa conclusion principale tombe : **Devstral Small 2 24B (14,6 Go de poids) ne tient pas dans 12 Go.** Le recommander sur une carte de 12 Go, c'est promettre un offload dense massif, précisément la configuration que la note elle-même décrit comme « mauvaise stratégie ».

Second point obsolète : elle s'alarme d'un contexte à 8 192 / 16 384 tokens. Ton script tourne déjà à **131 072**. Ce diagnostic est périmé, et l'inversion qu'il implique est développée au §3.

Ce qu'elle dit de juste, et qui reste : la distinction poids / KV cache, la stratégie d'offload MoE (`-ngl 999` + experts CPU), le sampling officiel (temp 1.0, pas de repetition penalty), la nécessité de `--jinja` pour le tool calling, et surtout le principe d'asymétrie de contexte du §4.2. Ton script applique déjà les quatre premiers.

---

## 2. Le vrai problème n'est pas le modèle : le graphe de dépendances du Kanban est inversé

C'est le résultat le plus important de cette analyse, et il explique tous les symptômes observés.

Dans `kanban.db`, table `task_links`, les 8 liens de la feature « modale + badge » sont :

```
parent_id = t_749170f0 (ARCH)     child_id = t_68908c1c (SPEC)
parent_id = t_b27a5bed (DESIGN)   child_id = t_68908c1c (SPEC)
parent_id = t_5a400a57 (FEAT)     child_id = t_68908c1c (SPEC)
parent_id = t_d79b2285 (TEST)     child_id = t_68908c1c (SPEC)
parent_id = t_9115d286 (REVIEW)   child_id = t_68908c1c (SPEC)
parent_id = t_a64c4d04 (OPS)      child_id = t_68908c1c (SPEC)
parent_id = t_b44dea60 (DOC)      child_id = t_68908c1c (SPEC)
```

Lecture : la **spec est l'enfant de tous les autres tickets**. C'est exactement l'inverse de la réalité. La cause est une inversion d'arguments : `hermes kanban link <parent_id> <child_id>` a été appelé comme « je rattache ce ticket à la spec », soit `link <nouveau> <spec>`, au lieu de `link <spec> <nouveau>`.

**Conséquence mécanique.** Un ticket devient `ready` quand tous ses parents sont `done`. Ici, ARCH, DESIGN, FEAT, TEST, REVIEW, OPS et DOC n'ont **aucun parent** : ils sont donc tous devenus `ready` en même temps, et le dispatcher les a lancés dans un ordre arbitraire. La chaîne de production n'a jamais existé. D'où :

- **REVIEW** lancé avant que FEAT et TEST existent → `blocked` ×3 + 1 `timed_out`, et son message « bloqué upstream, attend les FEAT + TEST ».
- **OPS** et **DOC** lancés avant tout le reste. DOC affiche **17 tentatives bloquées et 13 commentaires (13,7 Ko)** : à chaque déblocage il repart, ne trouve rien à documenter, et se rebloque. C'est le symptôme le plus visible.
- **TEST** en `timed_out` puis `gave_up` : lancé sans implémentation à tester ni contrat stabilisé.

Le ticket de reprise aggrave le cas : `t_f1bb38bf` (retry du badge) a pour parent `t_adee90ae`, le ticket bloqué qu'il est censé remplacer. Il ne deviendra jamais `ready`.

**Ce n'était donc ni un manque de ressources machine, ni un défaut des agents.** Aucune configuration de modèle n'aurait sauvé cette feature.

### Correctif

Le plus sûr est de repartir propre plutôt que de démêler : archiver les tickets de cette feature, puis les recréer avec `--parent` **à la création** (plutôt que `link` après coup, qui est le piège), dans l'ordre topologique.

```
SPEC (racine, sans parent)
 ├── ARCH        --parent SPEC
 ├── DESIGN      --parent SPEC
 ├── TEST        --parent ARCH        <- dual-sandbox : meme parent que FEAT, jamais l'un l'autre
 ├── FEAT n°1    --parent ARCH
 ├── FEAT n°2    --parent ARCH
 ├── INTEG       --parent FEAT n°1, FEAT n°2
 ├── REVIEW      --parent INTEG, TEST
 ├── OPS         --parent REVIEW
 └── DOC         --parent OPS
```

Règle à graver dans le prompt de l'orchestrateur : **`--parent` à la création, `link` seulement pour ajouter un second parent**, et vérification obligatoire avant `kanban_complete` que le ticket [DOC] a bien [OPS] pour parent (le test le plus simple : si DOC est `ready` immédiatement, le graphe est inversé).

---

## 3. Deuxième cause : les tickets ne portent pas leur contenu

Les corps de tickets mesurés : ARCH 545 octets, FEAT 633, TEST 579, REVIEW 414, OPS **200**, DOC **222**.

Or `04-granularite.md` impose que le corps recopie le **texte complet des UA**, tables de valeurs comprises. En pratique, le corps se contente de références :

```
## UA couvertes
UA-006: Affichage badge numérique à côté de "Reçues"
UA-007: Truncation à "9+" si > 9 demandes
...
## Artefacts d'entrée
- specs/003-friends-list-modal-badge.md
```

L'ouvrier reçoit donc un titre d'UA et un chemin de fichier. Pour connaître le comportement attendu, il **doit ouvrir la spec**, puis explorer le dépôt pour trouver où l'implémenter. C'est exactement la fuite que dénonce le §4.2 de la note de transmission : le maillon au contexte le plus rare fait le travail d'exploration.

Deux autres écarts sur le même ticket `t_adee90ae` :
- il porte **5 UA** (UA-006 à UA-010), alors que la doctrine plafonne à 3 ;
- les corps contiennent des `\n` littéraux au lieu de vrais retours à la ligne : artefact de l'échappement PowerShell lors du `kanban create`. Les agents lisent un pavé.

**Correctif** : l'orchestrateur doit recopier intégralement chaque UA (énoncé EARS + table de valeurs) dans le corps du ticket, y ajouter les chemins exacts des fichiers à créer ou modifier et les signatures attendues, et se limiter à 3 UA. Pour les retours à la ligne, passer le corps via un commentaire (`kanban comment`) rédigé en plusieurs lignes réelles plutôt que par un `create` avec `\n` échappés.

---

## 4. Configuration optimale du LLM local, compte tenu du pipeline

### 4.1 Le pipeline change la contrainte

La note de transmission pose : « ne jamais optimiser la vitesse au détriment du contexte ». C'était juste pour un ouvrier qui doit explorer le dépôt. **Ce n'est plus vrai une fois les correctifs du §3 appliqués** : un ouvrier qui reçoit 1 à 3 UA complètes, les chemins exacts et les signatures n'a pas besoin de 128 k de contexte.

Mesure réelle après dégraissage des toolsets : prompt système ≈ 47 Ko ≈ **12 000 tokens**. Un ticket bien formé plus deux ou trois fichiers ouverts : 10 000 à 20 000 tokens. **32 768 est confortable, 65 536 est généreux.**

Or tu tournes à `-CtxSize 131072`, sans quantification du cache KV. Ce cache occupe de la VRAM qui pourrait héberger des couches d'experts : tu paies en lenteur un contexte que tu n'utilises pas.

### 4.2 Réglages recommandés

```powershell
# start-qwen-coder.ps1
[int]$CtxSize = 32768      # au lieu de 131072
[int]$NCpuMoe = 34         # au lieu de 42, a descendre progressivement
# et ajouter aux arguments de llama-server :
--cache-type-k q8_0 --cache-type-v q8_0
```

Le cache KV en 8 bits divise son encombrement par deux (`--flash-attn on` est déjà présent, c'est son prérequis). Combiné au passage de 128 k à 32 k, cela libère plusieurs Go de VRAM, qui servent à remonter des couches d'experts sur le GPU. Méthode : baisser `-NCpuMoe` par pas de 2 tant que `nvidia-smi` reste sous ~11 Go, et mesurer avec `test-api.ps1` à chaque palier. Ton propre commentaire indique 33 t/s à `NCpuMoe 40` avec 128 k de contexte ; avec 32 k et un cache quantifié, viser sensiblement mieux.

### 4.3 Faut-il changer de modèle ?

Sur 12 Go de VRAM, le tableau de la note se réduit :

| Modèle | Type | Poids Q4 | Tient en 12 Go ? | Verdict |
|---|---|---:|---|---|
| Qwen3-Coder-Next 80B-A3B (actuel) | MoE | ~46 Go | Non, experts en RAM (64 Go dispo) | **Viable.** Qualité d'un 80B, coût calcul d'un 3B |
| Devstral Small 2 24B | Dense | ~14,6 Go | **Non** | À écarter : offload dense sur 12 Go = lent |
| Qwen2.5-Coder 14B | Dense | ~9 Go | Oui, ~2-3 Go restants pour le KV | Alternative rapide, plus faible en tool calling |
| Qwen2.5-Coder 7B | Dense | ~5,5 Go (Q5) | Oui, large marge KV | Rapide, qualité en retrait |

**Recommandation : garde Qwen3-Coder-Next**, applique d'abord les réglages du §4.2. Tu as déjà les 46 Go téléchargés, l'offload MoE est efficace sur ta configuration, et le tool calling (indispensable à un worker Hermès) y est meilleur que sur les petits denses. Ne teste Qwen2.5-Coder 14B que si, après réglage, le débit reste insuffisant, et juge-le sur la seule métrique qui compte : **le taux de tickets qui passent `pnpm typecheck && pnpm lint && pnpm test` du premier coup**, pas les tokens par seconde.

---

## 5. Répartition DeepSeek V4 / local : l'arithmétique change la conclusion

Ton propre `setup-cli.md` indique les tarifs OpenRouter : **DeepSeek V4 Flash à 0,09 $ / 0,18 $ par million de tokens** (entrée / sortie), V4 Pro à 0,435 / 0,87.

Un ticket typique consomme environ 15 000 tokens en entrée et 3 000 en sortie, soit :

- **Flash : ~0,002 $ par ticket.** Cent tickets par jour : **0,20 $**.
- **Pro : ~0,009 $ par ticket.** Cent tickets : 0,90 $.

Autrement dit, faire tourner l'intégralité de tes workers sur DeepSeek Flash coûterait de l'ordre de **6 $ par mois** à un rythme soutenu. Le LLM local n'économise donc pas de l'argent de façon significative : il économise des centimes et coûte des heures d'attente, de la chaleur et de la complexité (serveur à démarrer, sérialisation du board, timeouts).

Cela ne veut pas dire qu'il faut le supprimer. Sa valeur réelle est ailleurs : **indépendance** (tu continues à produire sans réseau et sans compte), **confidentialité** (ton code ne sort pas), et **apprentissage** (c'est aussi un banc d'essai). Ce sont des raisons valables, mais ce ne sont pas des raisons économiques, et il vaut mieux le savoir en le choisissant.

### Répartition proposée

| Profil | Modèle nominal | Justification |
|---|---|---|
| `orchestrateur` | DeepSeek Flash | Manipule des tickets, pas du code |
| `bernadette` | DeepSeek **Pro** | La spec est le socle : c'est là que la qualité paie le plus |
| `architecte` | DeepSeek **Pro** | Contrats, ADR, plan E-NNN : raisonnement long |
| `designer` | DeepSeek Flash | Wireframes et tokens, tâche cadrée |
| `dev-senior` | pont `claude -p` | UA `[ALGO]` uniquement |
| `ouvrier` | **Qwen local** | Le seul vrai poste local : volume élevé, tâches ultra-cadrées |
| `testeur` | DeepSeek Flash | Écrit du code de test à partir des contrats ; le dual-sandbox exige de la rigueur, et Flash est 20 fois plus rapide que le local |
| `revieweur` | pont `claude -p` | Revue critique |
| `devops` | DeepSeek Flash | CI YAML, commandes de déploiement : aucun besoin d'un modèle de code |
| `securite` | DeepSeek **Pro** | Audit adversarial |
| `scribe` | DeepSeek Flash | Rédaction |

Changement principal par rapport à aujourd'hui : **`testeur` et `devops` quittent le local.** Ils y étaient par symétrie, pas par nécessité, et ils y créaient la contention GPU que tu as constatée. Ne reste en local que l'ouvrier, celui dont le volume est le plus élevé et les tâches les plus cadrées.

Avantage secondaire, majeur : le board redevient parallélisable. Un seul profil utilise le GPU, donc `max_in_progress: 1` n'est plus nécessaire comme garde-fou matériel. Tu peux remonter à 2 ou 3 en gardant `max_in_progress_per_profile: 1`, et laisser un ticket DeepSeek avancer pendant que l'ouvrier local travaille.

### Mode dégradé, redéfini

L'ancien mode dégradé visait l'épuisement du quota Claude Pro. Il gagne une seconde forme : **hors ligne ou volonté de coût nul**, tous les profils de code basculent sur le local (`ouvrier`, `testeur`, `devops`), avec `max_in_progress: 1` pour éviter la contention. C'est le seul cas où la sérialisation stricte se justifie.

---

## 6. Plan d'action, par ordre de rendement

1. **Corriger le graphe de dépendances** (§2). Sans cela, rien d'autre ne compte : c'est la cause de tous les blocages observés.
2. **Enrichir les corps de tickets** (§3) : UA complètes, chemins exacts, 3 UA maximum. C'est ce qui rend l'ouvrier local viable.
3. **Sortir `testeur` et `devops` du local** (§5) : deux commandes, supprime la contention.
4. **Régler le serveur local** (§4.2) : contexte 32 k, cache KV en q8_0, `NCpuMoe` descendu progressivement.
5. **Mesurer** : taux de tickets verts du premier coup, avant et après. C'est la seule métrique qui tranche.
6. Ne changer de modèle local qu'après les cinq étapes précédentes, si le besoin persiste.
