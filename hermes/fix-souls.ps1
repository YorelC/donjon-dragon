# fix-souls.ps1 - Rattrapage de la phase 2bis : copie les prompts comme SOUL.md des 11 profils
# (les profils existent deja ; ce script ne fait QUE la copie, avec .bak de l'ancien SOUL.md)
# Usage : powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\fix-souls.ps1

param(
  [string]$Repo       = "C:\_work\my_projects\donjon-dragon",
  [string]$HermesRoot = "$env:LOCALAPPDATA\hermes"
)

$map = [ordered]@{
  "orchestrateur" = "00-orchestrateur.md"
  "bernadette"    = "01-bernadette.md"
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

$okCount = 0
foreach ($name in $map.Keys) {
  $src = Join-Path $Repo ("hermes\prompts\" + $map[$name])
  $profDir = Join-Path $HermesRoot ("profiles\" + $name)
  if (-not (Test-Path $src))     { Write-Host "  [ECHEC] source introuvable : $src" -ForegroundColor Red ; continue }
  if (-not (Test-Path $profDir)) { Write-Host "  [ECHEC] profil introuvable : $profDir" -ForegroundColor Red ; continue }
  $soul = Join-Path $profDir "SOUL.md"
  if (Test-Path $soul) { Copy-Item $soul "$soul.bak" -Force }
  Copy-Item $src $soul -Force
  Write-Host ("  [OK] {0,-14} recoit {1}  ({2})" -f $name, $map[$name], $soul) -ForegroundColor Green
  $okCount++
}
Write-Host ""
Write-Host "$okCount/11 SOUL.md installes."
Write-Host "Verification rapide : Get-Content `"$HermesRoot\profiles\bernadette\SOUL.md`" -TotalCount 3"
