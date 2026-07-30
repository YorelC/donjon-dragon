# Journée type de développement autonome

Pré-condition (une fois) : le dégraissage est terminé, ses lots sont commités, et `preflight.ps1` est tout vert.

## Le matin : 3 terminaux, 4 commandes

**Terminal 1, le moteur local (reste ouvert toute la journée) :**
```powershell
powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\ia_automation_code\local-llm\start-qwen-coder.ps1
```
Sans lui, `ouvrier`, `testeur` et `devops` meurent au spawn (WinError 10061).

**Terminal 2, le contrôle puis le dispatcher :**
```powershell
powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\preflight.ps1
hermes gateway start
```
Le pré-vol doit être tout vert AVANT le gateway. Le gateway héberge le dispatcher Kanban ET Margarette sur Discord : il reste ouvert. Un échec sur les SOUL ? `fix-souls.ps1`. Un échec sur un modèle ? `set-qwen-profiles.ps1` ou `hermes -p <profil> config show`.

**Terminal 3 (optionnel), la vigie :**
```powershell
hermes kanban watch        # flux des événements en direct
# ou : hermes dashboard    # vue graphique du board
```

## Ensuite : tout passe par Margarette, sur Discord

1. **Donne l'idée** en langage naturel : « Nouvelle feature : ... ». Elle charge sa skill product et déroule l'interrogatoire (7 thèmes, 4 questions max par message, défauts proposés — tu peux répondre « ok défauts » pour accélérer).
2. **Valide sa synthèse** R-001…R-NNN. Elle crée alors le ticket [SPEC] pour `bernadette`, et la chaîne se déroule seule : spec en UA → contrats → découpe → dev ∥ tests → intégration → revue → déploiement → doc.
3. **Dans la journée, tu n'interviens que sur ses pings** : `decision-needed:` (arbitrage produit) et `review-required:` (auth, suppressions de données, migrations, CI, NO-GO sécurité). Réponds-lui, elle commente et débloque le ticket. C'est TA seule charge de travail.
4. **Si tu veux voir où ça en est** : demande-lui « où en est-on ? », ou lis `STATUS.md`, ou le terminal 3.

## Le soir

- Demande un bilan à Margarette (épics done, tickets bloqués restants).
- `git log --oneline -15` : chaque commit doit porter ses tags `[t_xxxx][UA-NNN]`.
- Jauge le quota : part des tickets passés par `dev-senior` (objectif ≤ 30 %) ; si une fenêtre Pro s'est épuisée, vérifie que `MODE` est revenu à `nominal`.
- Les tickets `done` de plus d'une semaine partent en archive (l'orchestrateur s'en charge, sinon `hermes kanban archive <id>`).

## Le rôle de chaque script .ps1

| Script | Quand le lancer | Qui le lance |
|---|---|---|
| `ia_automation_code\local-llm\start-qwen-coder.ps1` | Chaque matin, en premier | Toi (terminal dédié) |
| `hermes\preflight.ps1` | Chaque matin, avant le gateway ; après tout changement de config | Toi |
| `scripts\claude-task.ps1` | Jamais toi (sauf debug) : c'est le pont que `dev-senior` et `revieweur` exécutent pour appeler `claude -p`. Exit 42 = quota épuisé → bascule `MODE` en dégradé | Les agents |
| `hermes\fix-souls.ps1` | À chaque fois que tu modifies un prompt dans `hermes\prompts\` (les SOUL des profils sont des copies : sans ça, tes modifications restent lettre morte) | Toi |
| `hermes\set-qwen-profiles.ps1` | Déjà fait. À relancer seulement si tu changes le serveur local (port, nouveau modèle) ou recrées un profil | Toi, rarement |
| `scripts\bootstrap-board.ps1` | Déjà fait (le board `dnd-saas` existe). Garde-le comme AIDE-MÉMOIRE : ses commandes commentées montrent comment créer une chaîne de tickets à la main si un jour tu veux court-circuiter Margarette | Toi, jamais en routine |
| `hermes\setup-hermes.ps1` | Déjà fait. Uniquement en cas de réinstallation complète | Toi, jamais en routine |
| `scripts\claude-task.sh` | Équivalent bash du pont (WSL/Git Bash), non utilisé sous Windows natif | Personne pour l'instant |

## Dépannage express

Ticket qui ne part pas → gateway éteint (`hermes gateway start`) ou nom d'assignee ≠ nom de profil. Worker qwen qui crash au spawn → serveur :8001 éteint. Ticket auto-bloqué après 2 échecs → `hermes kanban runs <id>` puis lis le body du ticket (spec ambiguë ?) avant d'incriminer l'agent. Pont Claude muet → `._claude\logs\<ticket>.log`. Comportement bizarre d'un worker → son `SOUL.md` et `%LOCALAPPDATA%\hermes\memories\`.
