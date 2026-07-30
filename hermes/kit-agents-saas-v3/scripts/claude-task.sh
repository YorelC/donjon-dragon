#!/usr/bin/env bash
# claude-task.sh — Pont Hermès -> Claude Code (plan Pro) — équivalent bash (WSL / Git Bash / Linux)
# Usage : scripts/claude-task.sh <task_id> [dev|review] [repo_path]
# Codes de sortie : 0 = OK · 42 = quota épuisé · 1 = échec autre
set -uo pipefail

TASK_ID="${1:?task_id requis}"
MODE_RUN="${2:-dev}"
REPO="${3:-$PWD}"
MAX_TURNS=40

cd "$REPO"
MISSION="._claude/task-${TASK_ID}.md"
LOGDIR="._claude/logs"; mkdir -p "$LOGDIR"
LOG="$LOGDIR/${TASK_ID}.log"

[[ -f "$MISSION" ]] || { echo "Mission introuvable : $MISSION" >&2; exit 1; }

if [[ "$MODE_RUN" == "review" ]]; then
  PRE="Tu es relecteur de code senior. Ne modifie AUCUN fichier. Analyse le diff et les contrats fournis, applique la checklist incluse, et rends un verdict structuré : VERDICT: APPROUVE | CHANGEMENTS_DEMANDES, puis constats bloquant/majeur/mineur avec fichier:ligne."
  ALLOWED="Read Glob Grep Bash(git diff:*) Bash(git log:*) Bash(pnpm typecheck:*) Bash(pnpm test:*)"
else
  PRE="Tu es développeur senior sur ce repo (règles dans AGENTS.md, à respecter à la lettre : hexagonale, Zod, pas de any, repository pattern). Réalise la mission ci-dessous de bout en bout : code + vérifications dans cet ordre (pnpm typecheck, pnpm lint, pnpm test), contrôle par git diff. INTERDIT : modifier les fichiers de test du testeur, les schémas de shared/, .env, les scripts de seed/migration, le CI. Pas de script build à la racine. Termine par un résumé : fichiers modifiés, commandes exécutées, points de vigilance."
  ALLOWED="Read Edit Write Glob Grep Bash(pnpm:*) Bash(node:*) Bash(git add:*) Bash(git commit:*) Bash(git diff:*) Bash(git status:*)"
fi

PROMPT="$PRE

---- MISSION (ticket $TASK_ID) ----
$(cat "$MISSION")"

echo "[claude-task] $MODE_RUN / $TASK_ID -> claude -p (log: $LOG)"
OUT=$(claude -p "$PROMPT" --max-turns "$MAX_TURNS" --allowedTools "$ALLOWED" 2>&1)
EXIT=$?
printf '%s\n' "$OUT" > "$LOG"

if grep -qiE "usage limit reached|You've reached your|rate limit|quota|resets at" <<< "$OUT"; then
  RESET=$(date -d '+5 hours' +%Y-%m-%dT%H:%M:%S%z 2>/dev/null || date -v+5H +%Y-%m-%dT%H:%M:%S%z)
  printf 'degrade|reset=%s' "$RESET" > MODE
  echo "[claude-task] QUOTA EPUISE -> MODE=degrade (reset estimé $RESET)"
  exit 42
fi

[[ $EXIT -ne 0 ]] && { echo "[claude-task] Échec (exit $EXIT) — voir $LOG"; exit 1; }
echo "[claude-task] OK"
exit 0
