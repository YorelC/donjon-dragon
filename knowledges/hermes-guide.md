# Hermès Agent — guide de référence

Ce que fait Hermès, comment il est configuré, et comment le piloter. Écrit pour ce poste (Windows, install native, profils du SaaS D&D) : les chemins et exemples sont ceux de la machine.

---

## 1. Le modèle mental : un dossier et une CLI

Hermès n'est pas une boîte noire. C'est un dossier de configuration et un exécutable qui le lit.

```
%LOCALAPPDATA%\hermes\
├── config.yaml       TOUT le comportement par défaut (modèles, outils, mémoire, kanban…)
├── .env              les secrets (clés API). Jamais dans config.yaml.
├── auth.json         jetons OAuth
├── SOUL.md           l'identité du profil par défaut (ici : Margarette)
├── memories/         MEMORY.md (l'environnement) + USER.md (le profil de l'utilisateur)
├── skills/           compétences chargées à la demande
├── profiles/<nom>/   un sous-dossier complet par profil : config.yaml, SOUL.md, sessions, mémoire
├── kanban/boards/    les tableaux, en SQLite
├── cron/             jobs planifiés
└── logs/
```

**Le principe qui débloque tout** : un profil est une instance Hermès isolée. Son `config.yaml` ne contient que les **surcharges** ; tout le reste est hérité du `config.yaml` racine. C'est pourquoi le fichier de l'ouvrier peut ne faire que 200 octets tout en ayant un comportement complet.

### Les cinq couches à ne pas confondre

| Couche | Où | Portée | Qui écrit |
|---|---|---|---|
| Identité | `profiles/<nom>/SOUL.md` | le profil | toi (via `deploy.ps1`) |
| Instructions projet | `AGENTS.md` à la racine du repo | ce projet | toi |
| Mémoire | `memories/*.md` | globale, persistante | l'agent |
| Skills | `skills/<nom>/SKILL.md` | chargées à la demande | toi et l'agent |
| Session | `sessions/` | la conversation en cours | automatique |

Un seul fichier de contexte projet est chargé par session, selon cet ordre de priorité : `.hermes.md` ou `HERMES.md`, puis `AGENTS.md`, puis `CLAUDE.md`, puis `.cursorrules`. **Le premier trouvé gagne** : ne crée jamais de `HERMES.md` dans ce repo, il masquerait `AGENTS.md` que lisent aussi les agents Claude.

---

## 2. Les commandes, par usage

### Diagnostiquer

```powershell
hermes doctor                 # config et dépendances ; --fix tente de réparer
hermes version
hermes config show            # la config effective (| Select-String pour filtrer)
hermes profile list           # les profils et leur état
hermes prompt-size            # poids du prompt système et des schémas d'outils, en octets
hermes insights               # tokens consommés, coût, activité
hermes logs                   # journaux, filtrables
hermes backup -o chemin.zip   # sauvegarde complète ; hermes import -f pour restaurer
```

`prompt-size` est l'outil le plus sous-estimé : il décompose ce que l'agent a réellement sous les yeux. C'est lui qui a révélé que les schémas d'outils pesaient 43 Ko par tour, soit plus que tout le reste du prompt.

### Configurer

```powershell
hermes config set <cle> <valeur>            # sur le profil courant
hermes -p <profil> config set <cle> <valeur> # sur un profil précis
hermes model                                 # sélecteur interactif provider + modèle
hermes tools                                 # sélecteur interactif des toolsets, par plateforme
hermes setup                                 # assistant de configuration par section
```

Attention : `config set` accepte une clé inconnue et l'enregistre quand même, en te prévenant que « Hermes may not read it ». Lis toujours l'avertissement, c'est ainsi qu'on découvre le vrai nom d'une clé.

### Profils

```powershell
hermes profile create <nom> --clone-from default
hermes profile list
hermes -p <nom> chat -q "question"     # une question à un profil précis
hermes -p <nom> prompt-size
```

Le clonage copie config, `.env`, `SOUL.md` **et les skills**. C'est pratique, mais chaque profil hérite alors du bagage du profil source : c'est la cause classique des workers surchargés d'outils et de skills inutiles.

### Sessions et exécution ponctuelle

```powershell
hermes                        # session interactive
hermes --tui                  # interface enrichie : on voit les outils s'exécuter
hermes --continue             # reprendre la dernière session
hermes -z "prompt"            # one-shot, renvoie seulement le texte final (pour les scripts)
hermes chat -q "..." -t "web,terminal"   # question ponctuelle avec toolsets restreints
```

### Gateway (messagerie et dispatcher)

```powershell
hermes gateway start | stop | restart | status
hermes pairing approve <plateforme> <code>
```

**La gateway héberge le dispatcher Kanban.** Sans elle, aucun ticket n'est exécuté, quel que soit l'état du board. C'est la panne n°1.

### Cron

```powershell
hermes cron create "every 30 minutes" --prompt "..." --workdir <chemin> --name <nom>
hermes cron list
hermes cron run <job-id>      # déclencher immédiatement
hermes cron pause | resume | remove <job-id>
```

Chaque job peut surcharger le modèle et le répertoire de travail. Le `workdir` détermine quel `AGENTS.md` est chargé.

### Skills

```powershell
hermes skills                 # parcourir, installer, activer/désactiver
hermes skills list
hermes security audit         # scan de vulnérabilités, à faire après toute installation tierce
hermes curator run --consolidate   # fusionne les skills redondantes créées par l'agent
```

Une skill se charge en trois niveaux : ses métadonnées sont toujours dans le prompt (~80 octets), son contenu complet seulement quand elle est jugée pertinente, ses fichiers de référence seulement à la demande. Avoir 50 skills ne ruine donc pas le prompt ; mais 50 descriptions floues, ce sont 50 chances de déclencher la mauvaise. **La description est l'élément le plus important d'une skill.**

---

## 3. Les clés de configuration qui comptent

Découvertes à l'usage sur cette installation, avec leur emplacement réel.

| Clé | Effet | Note |
|---|---|---|
| `model.provider` / `model.default` / `model.base_url` | le modèle du profil | `provider: custom` + `base_url` local pour un llama.cpp |
| `platform_toolsets.<plateforme>` | **la** liste des toolsets actifs | ce n'est ni `toolsets` ni `enabled_toolsets` ; `hermes tools` écrit ici |
| `agent.disabled_toolsets` | désactivation globale | liste |
| `agent.max_turns` | plafond d'itérations par tâche | 60 par défaut ; un dépassement fait échouer le ticket |
| `agent.reasoning_effort` | profondeur de raisonnement | `low` pour de l'exécution cadrée, `medium` ou plus pour de la conception |
| `display.show_reasoning` | affiche le raisonnement du modèle | à `false` : sinon il fuit dans les messages Discord |
| `delegation.provider` / `.model` / `.base_url` | modèle des sous-agents | s'il pointe vers un serveur éteint, toute délégation échoue |
| `auxiliary.<tache>.*` | modèles auxiliaires (compression, titres) | un modèle bon marché ici est le levier n°1 sur la facture |
| `kanban.max_in_progress_per_profile` | un worker par profil à la fois | garde-fou anti-contention |
| `kanban.failure_limit` | échecs avant auto-blocage | 2 : évite de brûler des tokens en boucle |
| `kanban.dispatch_in_gateway` | le dispatcher tourne dans la gateway | `true` |
| `security.redact_secrets` | masque les secrets dans les sorties | activé par défaut |

Garde-fou d'écriture, à poser dans l'environnement : `HERMES_WRITE_SAFE_ROOT` confine les écritures des agents à un dossier. Indispensable quand on lance des agents autonomes.

---

## 4. Le Kanban : comment ça marche vraiment

### Le cycle de vie

`triage → todo → ready → running → blocked → done → archived`

Un ticket porte un titre, un corps, **un** profil assigné, un statut, et des liens de dépendance.

### Le mécanisme central : la parenté

**Un ticket passe automatiquement de `todo` à `ready` quand tous ses parents sont `done`.** C'est tout. Il n'y a pas d'autre moteur de séquencement : la chaîne de production n'existe que par ce graphe.

```powershell
hermes kanban --board <board> create "<titre>" --assignee <profil> --parent <id> --workspace dir:<chemin>
hermes kanban --board <board> link <parent_id> <child_id>    # pour un SECOND parent
```

⚠️ **`link(A, B)` signifie « B attend A »**, ce qui se lit à l'envers de l'intuition « je rattache A à B ». Une inversion rend tous les tickets orphelins, donc tous `ready` en même temps, et ils s'exécutent dans un ordre arbitraire. Symptômes : la revue tourne avant que le code existe, la documentation se relance en boucle. Préfère systématiquement `--parent` à la création. Test de contrôle : après avoir créé une chaîne, si le dernier ticket est `ready`, le graphe est inversé.

### Le dispatcher

Il tourne dans la gateway, toutes les 60 secondes. À chaque tick il récupère les revendications périmées, promeut les tickets dont les parents sont terminés, et lance un processus par ticket réclamé, avec la variable `HERMES_KANBAN_TASK` positionnée.

### Le protocole du worker

Un worker spawné dispose des outils `kanban_*`, que **n'a pas** une session de chat ordinaire (ils sont conditionnés par cette variable d'environnement). Son cycle :

1. `kanban_show()` — il lit sa tâche, le fil complet des commentaires et les résumés des tentatives précédentes
2. il travaille dans son workspace
3. `kanban_heartbeat()` pendant les opérations longues, sinon sa revendication est reprise
4. `kanban_complete(summary, metadata)` ou `kanban_block(reason)` **avant de sortir**

Un worker qui meurt sans rien appeler produit un run `crashed`. Deux échecs consécutifs et le dispatcher bloque le ticket (`failure_limit`).

### Le côté humain

```powershell
hermes kanban --board <b> list [--status blocked] [--assignee <profil>]
hermes kanban --board <b> show <id>          # ticket + commentaires + historique
hermes kanban --board <b> comment <id> "..."  # le canal de communication inter-agents
hermes kanban --board <b> unblock <id>
hermes kanban --board <b> archive <id> [<id>…]
hermes kanban --board <b> runs <id>          # historique des tentatives et leur issue
hermes kanban watch                           # flux d'événements en direct
hermes dashboard                              # vue graphique
hermes kanban boards create|list|switch <slug>
```

Les **commentaires sont le protocole inter-agents** : tout ce qu'un worker doit savoir doit s'y trouver, car il les lit intégralement au démarrage. C'est aussi le bon endroit pour un corps de ticket long, car `create` échappe mal les retours à la ligne depuis PowerShell.

### Espaces de travail

`--workspace dir:<chemin>` travaille dans un dossier persistant, `worktree` crée un worktree git isolé (utile pour du travail parallèle), `scratch` est éphémère et supprimé à la fin. Ne jamais utiliser `scratch` pour du travail à conserver.

---

## 5. Ce qu'on peut faire avec, au-delà du code

Hermès n'est pas qu'un orchestrateur de développement. Les mêmes briques servent à : recevoir des instructions depuis Discord, Telegram, Slack ou e-mail via la gateway ; exécuter des tâches planifiées (veille, rapports, sauvegardes) via cron ; réagir à des événements externes via les webhooks (un push GitHub qui réveille un agent) ; brancher des services tiers via MCP (bases de données, API métier) en filtrant les outils exposés ; et déléguer des sous-tâches parallèles via `delegate_task` quand un résultat immédiat est attendu, là où le Kanban sert au travail durable qui traverse les redémarrages.

Le choix entre `delegate_task` et le Kanban se résume ainsi : `delegate_task` est un appel de fonction synchrone dont le parent attend le résultat ; le Kanban est une file durable, auditable, où des humains peuvent intervenir.

---

## 6. Dépannage, par symptôme

| Symptôme | Cause probable | Vérification |
|---|---|---|
| Les tickets ne partent jamais | gateway éteinte | `hermes gateway status` |
| Un ticket reste `ready` sans jamais tourner | nom d'assignee ≠ nom de profil exact | `hermes profile list` |
| Worker qui crashe au démarrage | endpoint du modèle injoignable (serveur local éteint) | `Invoke-RestMethod http://127.0.0.1:8001/v1/models` |
| Toute la chaîne s'exécute en désordre | graphe de parenté inversé | `hermes kanban show <id>`, regarder les parents |
| Un ticket se relance en boucle | il n'a pas de parent alors qu'il devrait en avoir | idem |
| L'agent perd son plan en cours de route | contexte trop court (minimum 64 k tokens) | `hermes prompt-size` puis la config du modèle |
| Timeout ou budget d'itérations épuisé | ticket trop gros, ou `agent.max_turns` trop bas | le corps du ticket avant tout |
| Coût qui grimpe | trop d'outils actifs, cache de préfixe invalidé | `hermes prompt-size`, `hermes insights` |
| Comportement inexplicable | mémoire polluée ou SOUL inattendu | lire `memories/*.md` et `profiles/<nom>/SOUL.md` |
| Une skill ne se déclenche jamais | description trop vague | réécrire la `description` du frontmatter |

Séquence de diagnostic générale : `hermes doctor`, puis `hermes doctor --fix`, puis `hermes config show` pour la clé suspecte, puis `hermes kanban runs <id>` pour l'historique d'un ticket, et enfin les logs.

---

## 7. Économiser les tokens, par ordre d'impact

Réduire les toolsets actifs vient largement en tête : chaque outil coûte son schéma à chaque tour, et passer de 24 à 9 outils a fait tomber le prompt de 68 à 47 Ko sur ce poste. Vient ensuite le filtrage des outils MCP, qu'il faut toujours restreindre par liste blanche. Puis le choix d'un modèle bon marché pour les tâches auxiliaires (compression, titres, évaluation de risque). Puis la consolidation des skills, pour réduire l'index permanent. Puis la préservation du cache de préfixe : modifier `SOUL.md`, la mémoire ou `AGENTS.md` en cours de session invalide le cache et fait grimper le coût, d'où l'intérêt de déployer les changements puis de redémarrer. Enfin, plafonner `agent.max_turns` évite qu'un ticket mal découpé ne brûle un budget entier avant d'échouer.

---

## Sources

Documentation Hermès Agent : <https://hermes-agent.nousresearch.com/docs/>
Référence CLI : <https://hermes-agent.nousresearch.com/docs/reference/cli-commands>
Kanban : <https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban>
Configuration : <https://hermes-agent.nousresearch.com/docs/user-guide/configuration>
Skills : <https://hermes-agent.nousresearch.com/docs/user-guide/features/skills>
Sécurité : <https://hermes-agent.nousresearch.com/docs/user-guide/security>
