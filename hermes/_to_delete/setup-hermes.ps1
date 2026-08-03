# setup-hermes.ps1 - Execute les phases 0, 2, 3, 4 et 5 du CHECKLIST-INSTALLATION.md
# (la phase 1 - fichiers du repo - a deja ete posee par Claude Cowork, voir output_installation_agents.md)
# Usage :  powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\setup-hermes.ps1
# Journal complet : hermes\setup-log.txt
# NOTE : fichier volontairement en ASCII pur (PowerShell 5.1 + UTF-8 sans BOM = chaines corrompues)

param(
  [string]$Repo       = "C:\_work\my_projects\donjon-dragon",
  [string]$HermesRoot = "$env:LOCALAPPDATA\hermes"
)

$ErrorActionPreference = "Continue"
Start-Transcript -Path (Join-Path $Repo "hermes\setup-log.txt") -Append
function Step($msg)  { Write-Host "" ; Write-Host "=== $msg ===" -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Ko($msg)    { Write-Host "  [ECHEC] $msg" -ForegroundColor Red }
function PauseStep($msg) { Read-Host ">> $msg - Entree pour continuer" | Out-Null }

# ---------------------------------------------------------------- PHASE 0
Step "PHASE 0 - Prerequis"
$fail = $false
try { hermes version           ; Ok "hermes CLI" }        catch { Ko "hermes introuvable dans le PATH" ; $fail = $true }
try { claude --version         ; Ok "claude CLI" }        catch { Ko "claude introuvable dans le PATH" ; $fail = $true }
try { pnpm -v                  ; Ok "pnpm" }              catch { Ko "pnpm introuvable" ; $fail = $true }
Write-Host "  Test reel claude -p (consomme un appel du plan Pro) :"
$claudeTest = claude -p "Reponds uniquement: OK" 2>&1
if ("$claudeTest" -match "OK") { Ok "claude -p repond : $claudeTest" } else { Ko "claude -p : $claudeTest" ; $fail = $true }
Set-Location $Repo
git status --short
if ($fail) { Ko "Corrige les prerequis ci-dessus puis relance. (Rappel : meme terminal que celui qui lancera Hermes.)" ; Stop-Transcript ; exit 1 }

Step "PHASE 0bis - Sauvegarde Hermes (tutoriel module 0.1)"
$backup = "$env:USERPROFILE\hermes-backup-$(Get-Date -Format yyyy-MM-dd).zip"
hermes backup -o $backup
if (Test-Path $backup) { Ok "Backup : $backup" } else { Ko "Backup non cree - Ctrl+C pour stopper, ou continue" ; PauseStep "confirme" }
hermes doctor

# ---------------------------------------------------------------- PHASE 2
Step "PHASE 2 - Creation des 11 profils (assignees Kanban - noms EXACTS)"
$profils = @(
  @{n="orchestrateur"; m="deepseek-v4-flash"; p="00-orchestrateur.md"},
  @{n="bernadette";    m="deepseek-v4-pro";   p="01-bernadette.md"},
  @{n="architecte";    m="deepseek-v4-pro";   p="02-architecte.md"},
  @{n="designer";      m="deepseek-v4-pro";   p="03-designer.md"},
  @{n="dev-senior";    m="deepseek-v4-flash"; p="04-dev-senior.md"},
  @{n="ouvrier";       m="qwen3-coder-next";  p="05-ouvrier.md"},
  @{n="testeur";       m="qwen3-coder-next";  p="06-testeur.md"},
  @{n="revieweur";     m="deepseek-v4-flash"; p="07-revieweur.md"},
  @{n="devops";        m="qwen3-coder-next";  p="08-devops.md"},
  @{n="securite";      m="deepseek-v4-pro";   p="09-securite.md"},
  @{n="scribe";        m="deepseek-v4-flash"; p="10-scribe.md"}
)
$existants = (hermes profile list 2>&1 | Out-String)
foreach ($pr in $profils) {
  if ($existants -match "\b$($pr.n)\b") { Ok ("profil '{0}' existe deja (prompt a mettre a jour quand meme)" -f $pr.n) }
  else { hermes profile create $pr.n --clone-from default ; Ok ("profil '{0}' cree" -f $pr.n) }
}

Step "PHASE 2bis - Installation des prompts comme SOUL.md de chaque profil"
# Le SOUL.md d'un profil = son identite (tutoriel module 6.2). Nos prompts SONT l'identite des workers.
foreach ($pr in $profils) {
  $src = Join-Path $Repo ("hermes\prompts\" + $pr.p)
  # @() force un tableau meme si Where-Object ne renvoie qu'un element (sinon $dirs[0] = 1er caractere)
  $dirs = @(@("$HermesRoot\profiles\$($pr.n)", "$HermesRoot\$($pr.n)") | Where-Object { Test-Path $_ })
  if ($dirs.Count -gt 0) {
    $soul = Join-Path $dirs[0] "SOUL.md"
    if (Test-Path $soul) { Copy-Item $soul "$soul.bak" -Force }
    Copy-Item $src $soul -Force
    Ok ("{0} recoit {1}  ({2})" -f $pr.n, $pr.p, $soul)
  } else {
    Ko ("{0} : dossier de profil introuvable sous {1} - copie MANUELLE de hermes\prompts\{2} dans son SOUL.md" -f $pr.n, $HermesRoot, $pr.p)
  }
}
Write-Host ""
Write-Host "  MODELES a verifier profil par profil (hermes -p NOM puis /model, ou 'hermes model') :"
$profils | ForEach-Object { Write-Host ("   - {0,-14} -> {1}" -f $_.n, $_.m) }
PauseStep "Configure les modeles ci-dessus maintenant (ou note-le pour apres)"

# ---------------------------------------------------------------- PHASE 3
Step "PHASE 3 - Skill 'product' pour Margarette"
$skillDir = "$HermesRoot\skills\product"
New-Item -ItemType Directory -Force -Path $skillDir | Out-Null
$frontLines = @(
  "---",
  "name: product",
  'description: Protocole product du SaaS D&D pour Margarette - interrogatoire structure en 7 themes (reponses R-NNN), creation de tickets [SPEC] pre-remplis pour bernadette sur le board dnd-saas, relais des blocages decision-needed / review-required vers Discord. A utiliser des que Charly exprime une idee de feature, demande ou en est le projet, ou repond a une question bloquee.',
  "version: 3.0.0",
  "---",
  ""
)
$body = Get-Content (Join-Path $Repo "hermes\prompts\skill-product-margarette.md") -Raw
($frontLines -join "`r`n") + $body | Out-File "$skillDir\SKILL.md" -Encoding utf8
Ok "Skill installee : $skillDir\SKILL.md (profil courant/default - si Margarette est un autre profil, copie ce dossier dans SES skills)"
Write-Host "  Verifie ensuite : hermes skills list  (puis audit : hermes security audit)"

# ---------------------------------------------------------------- PHASE 4
Step "PHASE 4 - Board Kanban"
hermes kanban init
hermes kanban boards create dnd-saas --name "SaaS D&D" --description "VTT simplifie - pipeline agents"
hermes kanban boards switch dnd-saas
hermes kanban list
Ok "Board dnd-saas actif"

Step "PHASE 4bis - Config a poser DANS $HermesRoot\config.yaml (edition manuelle)"
Write-Host "  Ajoute/verifie ces cles (tutoriel modules 10.4 et 12.5) :"
Write-Host "  ------------------------------------------------"
Write-Host "  kanban:"
Write-Host "    dispatch_in_gateway: true"
Write-Host "    max_in_progress: 3"
Write-Host "    max_in_progress_per_profile: 1"
Write-Host "    failure_limit: 2"
Write-Host "  agent:"
Write-Host "    max_turns: 90"
Write-Host "  ------------------------------------------------"
PauseStep "Edite config.yaml maintenant (notepad $HermesRoot\config.yaml)"

Step "PHASE 4ter - Garde-fous"
setx HERMES_WRITE_SAFE_ROOT $Repo | Out-Null
Ok "HERMES_WRITE_SAFE_ROOT=$Repo (nouvelles sessions ; ecritures agents confinees au projet)"
Write-Host "  RAPPEL CRITIQUE : le dispatcher Kanban vit dans le gateway -> 'hermes gateway start' obligatoire pour que les tickets partent."

# ---------------------------------------------------------------- PHASE 5
Step "PHASE 5a - Smoke test du pont claude -p (sans Kanban)"
$missionDir = Join-Path $Repo "._claude" ; New-Item -ItemType Directory -Force -Path $missionDir | Out-Null
"Lis AGENTS.md et liste les 3 regles principales du projet. Ne modifie AUCUN fichier." |
  Out-File (Join-Path $missionDir "task-t_test.md") -Encoding utf8
& powershell -ExecutionPolicy Bypass -File (Join-Path $Repo "scripts\claude-task.ps1") -TaskId t_test -Mode review -RepoPath $Repo
if ($LASTEXITCODE -eq 0) { Ok "Pont claude -p operationnel (log : ._claude\logs\t_test.log)" }
elseif ($LASTEXITCODE -eq 42) { Ko "Quota Pro epuise detecte -> MODE passe en degrade (normal si fenetre epuisee, sinon verifier les motifs dans claude-task.ps1)" }
else { Ko "Pont claude -p en echec (exit $LASTEXITCODE) - voir ._claude\logs\t_test.log" }

Step "PHASE 5b - Ticket de test bout-en-bout (worker scribe)"
Write-Host "  Prerequis : gateway demarre (hermes gateway start) dans un autre terminal."
$go = Read-Host "  Creer le ticket de test maintenant ? (o/N)"
if ($go -eq "o") {
  $dateJour = Get-Date -Format yyyy-MM-dd
  hermes kanban create "[DOC][S] Test pipeline: creer docs/user/test-pipeline.md contenant exactement la phrase 'Pipeline OK - $dateJour'" --assignee scribe --workspace dir:$Repo
  Ok "Ticket cree - suis-le avec :  hermes kanban watch   (dispatch sous ~60 s)"
  Write-Host "  Attendu : ticket done + fichier docs\user\test-pipeline.md cree + metadata remplie (hermes kanban show ID)"
  Write-Host "  Ensuite, teste le droit de refus (phase 5c du CHECKLIST) :"
  Write-Host "    hermes kanban create ""[FEAT][S] Ameliorer le systeme"" --assignee ouvrier --workspace dir:$Repo"
  Write-Host "    -> DOIT finir blocked 'dependency: ticket a redecouper' (c'est le comportement attendu)."
}

# ---------------------------------------------------------------- BILAN
Step "BILAN"
Write-Host "  Fait par ce script : prerequis testes, backup, 11 profils + SOUL.md, skill product,"
Write-Host "  board dnd-saas, HERMES_WRITE_SAFE_ROOT, smoke test 5a (+5b si lance)."
Write-Host "  Reste MANUEL (voir hermes\output_installation_agents.md section 5) :"
Write-Host "   1. Modeles par profil (table phase 2)       4. Validation Margarette sur Discord"
Write-Host "   2. config.yaml (bloc phase 4bis)            5. Phases 5c/5d puis epic pilote (CHECKLIST 6-7)"
Write-Host "   3. hermes gateway start (dispatcher)"
Write-Host "  Journal : hermes\setup-log.txt"
Stop-Transcript
