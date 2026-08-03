# deploy.ps1 - Deploie les prompts du repo vers Hermes (SOUL.md des 11 profils + skill product)
# Les fichiers du repo sont la SOURCE ; ceux de %LOCALAPPDATA%\hermes sont des COPIES.
# A lancer apres toute modification dans hermes\prompts\.
#
# Usage : powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\deploy.ps1
#         (ajouter -NoRestart pour ne pas redemarrer la gateway)
# NOTE : fichier volontairement en ASCII pur (PowerShell 5.1 + UTF-8 sans BOM = chaines corrompues)

param(
  [string]$Repo       = "C:\_work\my_projects\donjon-dragon",
  [string]$HermesRoot = "$env:LOCALAPPDATA\hermes",
  [switch]$NoRestart
)

$ok = 0 ; $ko = 0
function Ok($m) { Write-Host "  [OK]    $m" -ForegroundColor Green ; $script:ok++ }
function Ko($m) { Write-Host "  [ECHEC] $m" -ForegroundColor Red   ; $script:ko++ }

$map = [ordered]@{
  "orchestrateur" = "00-orchestrateur.md"
  "analyste"      = "01-analyste.md"
  "architecte"    = "02-architecte.md"
  "designer"      = "03-designer.md"
  "dev-senior"    = "04-dev-senior.md"
  "ouvrier"       = "05-ouvrier.md"
  "testeur"       = "06-testeur.md"
  "revieweur"     = "07-revieweur.md"
  "devops"        = "08-devops.md"
  "securite"      = "09-securite.md"
  "scribe"        = "10-scribe.md"
}

Write-Host ""
Write-Host "=== SOUL.md des 11 profils ===" -ForegroundColor Cyan
foreach ($name in $map.Keys) {
  $src     = Join-Path $Repo ("hermes\prompts\" + $map[$name])
  $profDir = Join-Path $HermesRoot ("profiles\" + $name)
  if (-not (Test-Path $src))     { Ko "source absente : $src" ; continue }
  if (-not (Test-Path $profDir)) { Ko "profil absent : $profDir" ; continue }
  $soul = Join-Path $profDir "SOUL.md"
  if (Test-Path $soul) {
    # Ne recopie que si le contenu a change (evite les .bak inutiles)
    $a = (Get-FileHash $src).Hash ; $b = (Get-FileHash $soul).Hash
    if ($a -eq $b) { Write-Host "  [=]     $name deja a jour" -ForegroundColor DarkGray ; continue }
    Copy-Item $soul "$soul.bak" -Force
  }
  Copy-Item $src $soul -Force
  Ok ("{0,-14} <- {1}" -f $name, $map[$name])
}

Write-Host ""
Write-Host "=== SOUL de Margarette (profil par defaut) ===" -ForegroundColor Cyan
$soulMargSrc = "C:\_work\my_projects\ia_automation_code\hermes-profiles\margarette.md"
$soulMargDst = Join-Path $HermesRoot "SOUL.md"
if (Test-Path $soulMargSrc) {
  if (Test-Path $soulMargDst) {
    $a = (Get-FileHash $soulMargSrc).Hash ; $b = (Get-FileHash $soulMargDst).Hash
    if ($a -eq $b) { Write-Host "  [=]     deja a jour" -ForegroundColor DarkGray }
    else { Copy-Item $soulMargDst "$soulMargDst.bak" -Force ; Copy-Item $soulMargSrc $soulMargDst -Force ; Ok "SOUL.md racine mis a jour" }
  } else { Copy-Item $soulMargSrc $soulMargDst -Force ; Ok "SOUL.md racine cree" }
} else { Ko "source absente : $soulMargSrc" }

Write-Host ""
Write-Host "=== Skill product (Margarette) ===" -ForegroundColor Cyan
$skillSrc = Join-Path $Repo "hermes\prompts\SKILL-product.md"
$skillDir = Join-Path $HermesRoot "skills\product"
if (Test-Path $skillSrc) {
  New-Item -ItemType Directory -Force -Path $skillDir | Out-Null
  $dest = Join-Path $skillDir "SKILL.md"
  if (Test-Path $dest) { Copy-Item $dest "$dest.bak" -Force }
  Copy-Item $skillSrc $dest -Force
  $ver = (Get-Content $dest -TotalCount 5 | Select-String "version:") -join ""
  Ok ("skill product deployee ({0})" -f $ver.Trim())
} else {
  Ko "source absente : $skillSrc"
}

Write-Host ""
Write-Host "=== Gateway ===" -ForegroundColor Cyan
if ($NoRestart) {
  Write-Host "  (saute : -NoRestart). Les SOUL et skills ne seront relus qu'au prochain redemarrage."
} else {
  hermes gateway restart
  Ok "gateway redemarree (SOUL et skills rechargees)"
}

Write-Host ""
Write-Host ("BILAN : {0} OK, {1} ECHEC" -f $ok, $ko)
if ($ko -gt 0) { Write-Host "Corrige les ECHEC ci-dessus." -ForegroundColor Yellow }
