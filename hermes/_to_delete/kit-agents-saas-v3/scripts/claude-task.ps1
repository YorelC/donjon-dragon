# claude-task.ps1 — Pont Hermès -> Claude Code (plan Pro)
# Usage : powershell -ExecutionPolicy Bypass -File scripts\claude-task.ps1 -TaskId t_abcd [-Mode dev|review] [-RepoPath C:\_work\my_projects\donjon-dragon]
# Codes de sortie : 0 = OK · 42 = quota Claude Pro épuisé · 1 = échec autre

param(
  [Parameter(Mandatory = $true)][string]$TaskId,
  [ValidateSet("dev", "review")][string]$Mode = "dev",
  [string]$RepoPath = (Get-Location).Path,
  [int]$MaxTurns = 40
)

$ErrorActionPreference = "Stop"
Set-Location $RepoPath

$missionFile = Join-Path $RepoPath "._claude\task-$TaskId.md"
$logDir      = Join-Path $RepoPath "._claude\logs"
$logFile     = Join-Path $logDir "$TaskId.log"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

if (-not (Test-Path $missionFile)) {
  Write-Error "Fichier de mission introuvable : $missionFile"
  exit 1
}

$mission = Get-Content $missionFile -Raw

if ($Mode -eq "review") {
  $preambule = @"
Tu es relecteur de code senior. Ne modifie AUCUN fichier. Analyse le diff et les contrats fournis,
applique la checklist incluse, et rends un verdict structuré en markdown :
VERDICT: APPROUVE | CHANGEMENTS_DEMANDES, puis les constats classés bloquant/majeur/mineur avec fichier:ligne.
"@
  $allowed = "Read Glob Grep Bash(git diff:*) Bash(git log:*) Bash(pnpm typecheck:*) Bash(pnpm test:*)"
} else {
  $preambule = @"
Tu es développeur senior sur ce repo (règles dans AGENTS.md, que tu respectes à la lettre : hexagonale, Zod, pas de any, repository pattern).
Réalise la mission ci-dessous de bout en bout : code + vérifications dans cet ordre (pnpm typecheck, pnpm lint, pnpm test), contrôle par git diff.
INTERDIT : modifier les fichiers de test du testeur, les schémas de shared/, .env, les scripts de seed/migration, le CI. Pas de script build à la racine.
Termine par un résumé : fichiers modifiés, commandes exécutées, points de vigilance.
"@
  $allowed = "Read Edit Write Glob Grep Bash(pnpm:*) Bash(node:*) Bash(git add:*) Bash(git commit:*) Bash(git diff:*) Bash(git status:*)"
}

$prompt = "$preambule`n`n---- MISSION (ticket $TaskId) ----`n$mission"

Write-Host "[claude-task] $Mode / $TaskId -> claude -p (log: $logFile)"
$output = & claude -p $prompt --max-turns $MaxTurns --allowedTools $allowed 2>&1
$exit = $LASTEXITCODE
$output | Out-File -FilePath $logFile -Encoding utf8

# Détection quota plan Pro (messages connus du CLI)
$quotaPatterns = "usage limit reached", "You've reached your", "rate limit", "quota", "Please wait", "resets at"
$outText = ($output | Out-String)
foreach ($p in $quotaPatterns) {
  if ($outText -match [regex]::Escape($p)) {
    # Estimation du reset : fenêtres de 5 h du plan Pro
    $reset = (Get-Date).AddHours(5).ToString("yyyy-MM-ddTHH:mm:sszzz")
    "degrade|reset=$reset" | Out-File -FilePath (Join-Path $RepoPath "MODE") -Encoding ascii -NoNewline
    Write-Host "[claude-task] QUOTA EPUISE -> MODE=degrade (reset estime $reset)"
    exit 42
  }
}

if ($exit -ne 0) {
  Write-Host "[claude-task] Echec (exit $exit) — voir $logFile"
  exit 1
}

Write-Host "[claude-task] OK"
exit 0
