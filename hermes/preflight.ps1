# preflight.ps1 - Controle de sante du pipeline (lecture seule, ne modifie rien)
# Usage : powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\preflight.ps1
# NOTE : fichier volontairement en ASCII pur (PowerShell 5.1 + UTF-8 sans BOM = chaines corrompues)

param(
  [string]$Repo       = "C:\_work\my_projects\donjon-dragon",
  [string]$HermesRoot = "$env:LOCALAPPDATA\hermes"
)

$global:nbOk = 0 ; $global:nbKo = 0
function Ok($msg) { Write-Host "  [OK]     $msg" -ForegroundColor Green ; $global:nbOk++ }
function Ko($msg) { Write-Host "  [ECHEC]  $msg" -ForegroundColor Red   ; $global:nbKo++ }
function Step($msg) { Write-Host "" ; Write-Host "=== $msg ===" -ForegroundColor Cyan }

# Modele attendu par profil (profil = assignee Kanban)
$attendu = [ordered]@{
  "orchestrateur" = "deepseek";  "bernadette" = "deepseek";  "architecte" = "deepseek"
  "designer"      = "deepseek";  "dev-senior" = "deepseek";  "ouvrier"    = "qwen3-coder-next"
  "testeur"       = "qwen3-coder-next"; "revieweur" = "deepseek"; "devops" = "qwen3-coder-next"
  "securite"      = "deepseek";  "scribe"     = "deepseek"
}

Step "1. CLI et endpoints"
try { $v = hermes version 2>&1 | Select-Object -First 1 ; Ok "hermes : $v" } catch { Ko "hermes introuvable dans le PATH" }
try { $c = claude --version 2>&1 ; Ok "claude : $c" } catch { Ko "claude introuvable dans le PATH" }
try {
  Invoke-RestMethod "http://127.0.0.1:8001/v1/models" -TimeoutSec 3 | Out-Null
  Ok "llama-server Qwen repond sur :8001"
} catch {
  Ko "Qwen local ETEINT (:8001) - ouvrier/testeur/devops planteront au spawn. Lance start-qwen-coder.ps1"
}

Step "2. Les 11 profils et leur SOUL.md"
foreach ($n in $attendu.Keys) {
  $dir = Join-Path $HermesRoot "profiles\$n"
  $soul = Join-Path $dir "SOUL.md"
  if (-not (Test-Path $dir))  { Ko "profil '$n' absent ($dir)" ; continue }
  if (-not (Test-Path $soul)) { Ko "profil '$n' : SOUL.md manquant" ; continue }
  $l1 = (Get-Content $soul -TotalCount 1)
  if ($l1 -match "Profil : $n") { Ok "profil '$n' : SOUL v3 en place" }
  else { Ko "profil '$n' : SOUL.md inattendu (1re ligne : $l1) - relance fix-souls.ps1" }
}

Step "3. Modele de chaque profil (config.yaml)"
foreach ($n in $attendu.Keys) {
  $cfg = Join-Path $HermesRoot "profiles\$n\config.yaml"
  if (-not (Test-Path $cfg)) { Ko "profil '$n' : config.yaml introuvable" ; continue }
  $bloc = (Get-Content $cfg -Raw)
  if ($bloc -match "(?s)model:\s*\n(.*?)\n\S") { $bloc = $Matches[1] }
  $motif = $attendu[$n]
  if ($bloc -match [regex]::Escape($motif)) { Ok ("profil '{0}' : modele contient '{1}'" -f $n, $motif) }
  else { Ko ("profil '{0}' : modele attendu '{1}' non trouve dans le bloc model: - verifier avec: hermes -p {0} config show" -f $n, $motif) }
}

Step "4. Margarette (profil par defaut)"
$soulM = Join-Path $HermesRoot "SOUL.md"
if ((Test-Path $soulM) -and ((Get-Content $soulM -Raw) -match "porte d'entr")) { Ok "SOUL.md v3 (porte d'entree du pipeline)" }
else { Ko "SOUL.md racine : version v3 non detectee - copier hermes-profiles\margarette.md puis hermes gateway restart" }
$skillP = Join-Path $HermesRoot "skills\product\SKILL.md"
if (Test-Path $skillP) { Ok "skill product installee" } else { Ko "skill product absente ($skillP)" }

Step "5. Kanban"
$boards = hermes kanban boards list 2>&1 | Out-String
if ($boards -match "dnd-saas") { Ok "board dnd-saas present" } else { Ko "board dnd-saas absent - hermes kanban boards create dnd-saas ..." }
$bloques = hermes kanban list --status blocked 2>&1 | Out-String
Write-Host "  --- tickets blocked (a relayer par Margarette) ---"
Write-Host $bloques

Step "6. Repo et garde-fous"
$mode = Get-Content (Join-Path $Repo "MODE") -ErrorAction SilentlyContinue
if ($mode) { Ok "MODE = $mode" } else { Ko "fichier MODE absent a la racine du repo" }
if ($env:HERMES_WRITE_SAFE_ROOT -eq $Repo) { Ok "HERMES_WRITE_SAFE_ROOT = $Repo" }
else { Ko "HERMES_WRITE_SAFE_ROOT non defini dans CE terminal (valeur: '$env:HERMES_WRITE_SAFE_ROOT') - setx fait, rouvre le terminal ou relance setup" }
Push-Location $Repo
$dirty = git status --short | Measure-Object -Line | Select-Object -ExpandProperty Lines
if ($dirty -eq 0) { Ok "git propre" } else { Ko "$dirty fichier(s) non commite(s) - committe avant de lancer des workers" }
Pop-Location

Step "7. Gateway (dispatcher Kanban)"
Write-Host "  Le dispatcher vit dans le gateway : sans lui, aucun ticket ne part."
Write-Host "  Verifie/demarre :  hermes gateway status   puis   hermes gateway start"

Step "BILAN"
Write-Host ("  {0} OK, {1} ECHEC" -f $global:nbOk, $global:nbKo)
if ($global:nbKo -eq 0) { Write-Host "  Pipeline pret." -ForegroundColor Green }
else { Write-Host "  Corrige les ECHEC ci-dessus avant de lancer des tickets." -ForegroundColor Yellow }
