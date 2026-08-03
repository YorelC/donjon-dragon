# Note de transmission — Optimisation de l'ouvrier local (Hermes)

> **Destinataire** : la session Cowork qui configure la stratégie d'agents Hermes.
> **Objet** : contraintes réelles du profil `ouvrier` (LLM local) et ajustements à répercuter sur
> le `SOUL.md` de l'architecte.
> **Auteur** : session Cowork « diagnostic Hermes », 27/07/2026.

---

## 1. Le contexte matériel et logiciel

**Machine** : RTX 4080 (16 Go VRAM) + 64 Go RAM, Windows.
**Serveur d'inférence** : llama.cpp / LM Studio exposé sur `http://127.0.0.1:8001/v1`.
**Modèle** : `qwen3-coder-next` — MoE 80 B, **3 B de paramètres actifs**, contexte natif 262 144 tokens.

**Chaîne d'agents Hermes** :
`Charly → Margarette (clarification) → Bernadette (spec fonctionnelle, via claude -p) →
Architecte (DeepSeek V4 Pro, contrats + tests) → Ouvrier (LLM local, implémentation)`

**Asymétrie fondamentale, à garder en tête pour tout le reste de ce document** :
l'architecte dispose d'un contexte abondant (DeepSeek en API). L'ouvrier dispose d'un contexte
**rare** (limité par 16 Go de VRAM).

---

## 2. Ce qui était mal compris, et pourquoi ça compte

### 2.1 MoE ≠ modèle dense

**MoE** = *Mixture of Experts*. Le modèle contient ~128 « spécialistes ». Un **routeur** en
sélectionne 2 ou 3 par token généré ; les autres restent inactifs.

- **Coût mémoire** = tous les experts → ~46 Go en Q4_K_M.
- **Coût calcul** = seulement les experts actifs → 3 B de paramètres par token.

Conséquence pratique : la stratégie d'offload d'un modèle dense (« envoie N couches sur le GPU »)
est **la mauvaise stratégie** pour un MoE. La bonne consiste à garder l'attention et les couches
toujours actives sur le GPU, et à renvoyer les **experts routés** sur le CPU. Comme seuls 3 B
s'activent par token, le transit par la RAM coûte peu.

```
❌ -ngl 26                 # stratégie modèle dense
✅ -ngl 999 --cpu-moe      # stratégie MoE : attention sur GPU, experts sur CPU
```

### 2.2 Les deux mémoires — la distinction qui débloque tout

| | Nature | Taille | Rôle |
|---|---|---|---|
| **Poids** | ce que le modèle *sait* | ~46 Go, fixe | écrire du TypeScript correct |
| **KV cache** | ce que le modèle *a sous les yeux* | **réglable** | se souvenir du ticket qu'il lit |

Analogie : les poids sont la formation du développeur ; le KV cache est **la taille de son bureau**,
là où il étale le ticket, les tests et les fichiers à modifier.

**« Optimiser la mémoire » dans notre cas signifie : agrandir le KV cache.** Pas toucher aux poids.

### 2.3 Le paramétrage de sampling recommandé était inversé

Une analyse antérieure préconisait température 0.1-0.2 et repetition penalty 1.05-1.10, par
analogie avec les anciens modèles denses (« code = déterminisme = température basse »).

Les recommandations officielles pour ce modèle sont :

| Paramètre | Valeur |
|---|---|
| temperature | **1.0** |
| top_p | 0.95 |
| top_k | 40 |
| min_p | 0.01 |
| repetition penalty | **désactivée (1.0)** |

Une température très basse sur un MoE moderne provoque fréquemment des **boucles dégénérées**
(répétition infinie d'un bloc). Une repetition penalty élevée casse la syntaxe légitimement
répétitive du code.

### 2.4 Le contexte à 8 192 / 16 384 tokens était rédhibitoire

Le prompt système de l'ouvrier dans Hermes (identité + schémas d'outils) pèse **~39 Ko, soit
~10 000 tokens**, avant même de lire une tâche. Hermes documente un minimum de **64 000 tokens**
pour les workflows multi-étapes.

À 8 192 tokens, l'ouvrier ne peut littéralement pas charger ses propres instructions.
À 16 384, il lui reste de quoi lire *un* fichier.

**Ce n'était pas un défaut d'intelligence du modèle. C'était une amnésie.**

---

## 3. Le script de lancement — maximum d'« espace de bureau »

```bat
llama-server -m qwen3-coder-next-Q4_K_M.gguf ^
  --host 127.0.0.1 --port 8001 ^
  -c 65536 ^
  -ngl 999 --cpu-moe ^
  -fa on ^
  --cache-type-k q8_0 --cache-type-v q8_0 ^
  -t 12 --mlock --jinja ^
  --temp 1.0 --top-p 0.95 --top-k 40 --min-p 0.01 --repeat-penalty 1.0
```

### Ce que fait chaque option

| Option | Effet | Pourquoi |
|---|---|---|
| `-c 65536` | contexte de 64 k tokens | minimum Hermes pour du multi-étapes |
| `-ngl 999 --cpu-moe` | attention sur GPU, **tous** les experts sur CPU | libère le maximum de VRAM pour le KV cache |
| `-fa on` | flash attention | requis pour quantifier le cache V, et plus rapide |
| `--cache-type-k/v q8_0` | KV cache en 8 bits | **divise le bureau par deux en encombrement**, sans perte perceptible |
| `-t 12` | threads = cœurs physiques | le CPU travaille vraiment avec `--cpu-moe` |
| `--mlock` | verrouille en RAM physique | évite tout passage par le fichier d'échange |
| `--jinja` | template de chat correct | **sans lui, le tool calling casse** — un ouvrier Hermes sans appels d'outils ne peut ni lire ni écrire de fichier |

### Procédure de réglage — dans cet ordre, la vitesse en dernier

1. Lancer avec `-c 65536`. Au démarrage, **llama.cpp affiche la taille réelle du KV cache** dans
   ses logs : c'est le chiffre de référence, bien plus fiable qu'un calcul théorique.
2. Si échec par manque de mémoire → `-c 32768`. C'est le plancher acceptable.
3. Seulement une fois que ça tourne, si c'est trop lent : remplacer `--cpu-moe` par
   `--n-cpu-moe 40`, puis 35, puis 30 — on remonte des experts sur le GPU jusqu'à saturer
   ~14 Go de VRAM (garder ~2 Go pour l'affichage et le système).

**Ne jamais optimiser la vitesse au détriment du contexte.** Débit attendu : 15-25 tokens/s avec
un offload correct.

### Leviers de secours si 32 768 ne passe toujours pas

| Levier | Effet | Coût |
|---|---|---|
| `--no-kv-offload` | KV cache en RAM au lieu du GPU | contexte quasi illimité, nettement plus lent |
| Poids en Q3 | libère ~10 Go | **dégrade la qualité du code — à éviter** |

Vérifier la syntaxe exacte des flags avec `llama-server --help` : elle évolue d'une version à l'autre.

---

## 4. Bilan sur le `SOUL.md` de l'architecte

### 4.1 État actuel — trois écarts

Le `SOUL.md` de l'architecte (profil `architecte`, DeepSeek V4 Pro) **ne tient pas compte de la
contrainte mémoire de l'ouvrier**. Trois points précis :

**1. Sa règle de découpe est un critère de revue, pas de mémoire.**
Il écrit : « une tâche = un contrat = une PR possible ». Or une PR peut toucher huit fichiers —
parfaitement relisable par un humain, parfaitement infaisable pour un ouvrier à 32-64 k de contexte.
Il découpe selon la cohérence fonctionnelle, jamais selon l'empreinte mémoire.

**2. Aucun chemin de fichier dans le contrat.**
Il livre « spec courte, types/interfaces/schémas Zod, et les tests ». Rien ne dit *où*. L'ouvrier
doit donc explorer le dépôt pour se repérer, et chaque fichier ouvert pour s'orienter consomme le
bureau dont il a besoin pour travailler.

**3. Le piège Modern Web Guidance.**
Le `SOUL.md` de l'architecte **prescrit explicitement** à l'ouvrier d'exécuter
`npx -y modern-web-guidance@latest retrieve "<id>"`. Cela injecte un guide entier dans son contexte.
C'est probablement la plus grosse fuite mémoire de la chaîne, et elle est écrite noir sur blanc
dans les deux `SOUL.md`.

### 4.2 Le principe manquant

> L'architecte a un contexte abondant. L'ouvrier a un contexte rare.
> **C'est donc à l'architecte de dépenser son contexte pour que l'ouvrier n'ait pas à dépenser le sien.**

C'est une asymétrie de ressources — la même logique qui fait déporter la charge sur le serveur
quand le client est contraint. Aujourd'hui la chaîne fait l'inverse : elle laisse le maillon le
plus contraint faire le travail d'exploration.

### 4.3 Section à ajouter au `SOUL.md` de l'architecte

```markdown
## Budget de contexte de l'ouvrier (contrainte dure)

L'ouvrier tourne sur un modèle local dont la mémoire de travail est limitée. Son prompt système
consomme déjà ~10 000 tokens avant même de lire ta tâche. Toi, tu disposes d'un contexte
confortable. La règle : **tu dépenses ton contexte pour qu'il n'ait pas à dépenser le sien.**

Chaque contrat que tu livres doit être exécutable **sans aucune exploration du dépôt** :

- **Chemins exacts** de chaque fichier à créer ou modifier, depuis la racine du monorepo.
- **Signatures complètes** des fonctions et composants attendus — pas leur description.
- **Extraits** du code existant à modifier : la portion concernée, jamais « va voir dans X ».
- **Imports** à utiliser, avec leur chemin exact.
- **Modern Web Guidance** : si un guide s'applique, tu le consultes TOI-MÊME et tu recopies
  dans le contrat les 10 à 20 lignes utiles. Tu ne demandes jamais à l'ouvrier d'aller le
  chercher : un guide entier saturerait sa mémoire de travail.

Taille cible d'un contrat : **1 à 3 fichiers touchés, moins de 200 lignes de code produites.**
Si ta découpe dépasse ça, elle n'est pas assez fine — redécoupe.

Règle de contrôle : si l'ouvrier doit ouvrir un fichier que tu n'as pas cité, c'est un défaut de
ton contrat, pas de son travail.
```

### 4.4 Correctif symétrique côté ouvrier

Dans `profiles/ouvrier/SOUL.md`, la section Modern Web Guidance autorise l'ouvrier à chercher
lui-même un guide s'il n'y en a pas dans la spec. À remplacer par : *si la spec ne référence aucun
guide et que la tâche est frontend, poser la question à l'architecte* — plutôt que de charger un
document dans un contexte déjà contraint.

---

## 5. Question ouverte : faut-il changer de modèle pour l'ouvrier ?

L'intuition « un modèle dense, plus petit en mémoire, laisse plus de place au contexte » est
**correcte**. Pour maximiser l'espace de bureau sur une carte de 16 Go, un dense compact bat un
gros MoE.

| Modèle | Type | Poids Q4_K_M | Contexte natif | Tient en VRAM ? |
|---|---|---:|---:|---|
| Qwen3-Coder-Next 80B-A3B | MoE | ~46 Go | 262 k | Non — RAM + offload experts |
| Devstral Small 2 24B | **Dense** | ~14,6 Go | 256 k | Poids oui, KV cache en RAM |
| Qwen2.5-Coder 14B | **Dense** | ~9 Go | — | Oui, + ~5 Go de KV cache sur GPU |
| DeepSeek-Coder-V2 Lite 16B | MoE (2,4 B actifs) | ~10 Go | — | Presque, ~45 tok/s |
| Qwen2.5-Coder 7B | **Dense** | ~5,5 Go (Q5) | — | Oui, + ~9 Go de KV cache |

**Piste la plus prometteuse pour le rôle d'ouvrier : Devstral Small 2 24B.** Dense, conçu
spécifiquement pour le codage agentique (exploration de dépôt, édition multi-fichiers, tool use),
256 k de contexte natif, 68 % sur SWE-bench Verified. Ses 14,6 Go de poids saturent la VRAM, donc
le KV cache passe en RAM — plus lent, mais c'est précisément le compromis accepté.

**Alternative si la vitesse redevient prioritaire : Qwen2.5-Coder 14B.** 9 Go de poids, il reste
~5 Go de VRAM pour le KV cache entièrement sur GPU : rapide *et* confortable. Plus faible en
appels d'outils, ce qui compte dans un contexte agentique — à tester avant de trancher.

À vérifier expérimentalement, pas sur le papier : la seule mesure qui compte est le taux de tâches
qui passent `pnpm typecheck && pnpm lint && pnpm test` du premier coup.

---

## 6. Ce qu'il faut retenir pour ajuster le workflow

1. L'ouvrier n'est pas « bête » : il est **amnésique** tant que son contexte n'est pas ≥ 32 k.
2. La découpe des tickets doit être dimensionnée par **l'empreinte mémoire**, pas par la
   cohérence fonctionnelle : 1 à 3 fichiers, < 200 lignes.
3. Tout ce que l'architecte n'écrit pas dans le contrat, l'ouvrier devra le **chercher** — et
   chercher coûte plus cher que faire.
4. Le tool calling local dépend du template de chat (`--jinja`). Sans lui, l'ouvrier n'a plus ni
   lecture ni écriture de fichier, ce qui ressemble à une panne de compétence.
5. Un bon ticket, c'est de la VRAM qu'on n'a pas eu à acheter.

---

## Sources

- [Qwen3-Coder-Next — Unsloth (specs, sampling, quantifications)](https://unsloth.ai/docs/models/qwen3-coder-next)
- [Guide d'offload MoE dans llama.cpp](https://huggingface.co/blog/Doctor-Shotgun/llamacpp-moe-offload-guide)
- [Hermes Agent — Quickstart (contexte minimum de 64 k)](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/getting-started/quickstart.md)
- [Devstral Small 2 24B — specs et VRAM](https://willitrunai.com/models/devstral-small-2-24b)
- [Modèles de code locaux pour 16 Go de VRAM](https://localaimaster.com/vram/best-coding-llm-16gb-vram)
