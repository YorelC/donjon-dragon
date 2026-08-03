# trim-toolsets.ps1 - Degraissage des toolsets des profils workers
# Etape 1 : -Discover  -> snapshot avant/apres pour trouver la cle de config exacte
# Etape 2 : -Apply -Key <cle> -Value <valeur>  -> propage aux 10 autres profils
# NOTE : fichier volontairement en ASCII pur (PowerShell 5.1 + UTF-8 sans BOM = chaines corrompues)

param(
  [switch]$Discover,
  [switch]$Apply,
  [string]$Pilote = "testeur",
  [string]$Key,
  [string]$Value,
  [string]$HermesRoot = "$env:LOCALAPPDATA\hermes"
)

# Profils workers. ATTENTION : le profil "default" (Margarette) n'est PAS dans cette liste.
# Elle a besoin de vision (captures d'ecran), web (recherches) et messaging (Discord).
$workers = @("orchestrateur","bernadette","architecte","designer","dev-senior",
             "ouvrier","testeur","revieweur","devops","securite","scribe")

function Cfg($p) { Join-Path $HermesRoot "profiles\$p\config.yaml" }

if ($Discover) {
  $src = Cfg $Pilote
  if (-not (Test-Path $src)) { Write-Host "[ECHEC] config introuvable : $src" -ForegroundColor Red ; exit 1 }
  $snap = Join-Path $env:TEMP "cfg-avant-$Pilote.yaml"
  Copy-Item $src $snap -Force
  Write-Host "Snapshot pris : $snap" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Mesure AVANT :" -ForegroundColor Cyan
  & hermes -p $Pilote prompt-size | Select-String -Pattern "System prompt total|Tool schemas"
  Write-Host ""
  Write-Host "MAINTENANT, dans ce terminal :" -ForegroundColor Yellow
  Write-Host "  1. hermes -p $Pilote tools"
  Write-Host "  2. Choisir '1. Configure CLI'  (les workers Kanban tournent sur la plateforme CLI)"
  Write-Host "  3. DESACTIVER : browser, session_search, delegation, vision, clarify, memory"
  Write-Host "     GARDER     : terminal, file, skills"
  Write-Host "  4. Confirmer, puis relancer ce script avec -Discover pour voir le diff"
  Write-Host ""
  if (Test-Path $snap) {
    Write-Host "Diff avec le snapshot precedent (s'il existe) :" -ForegroundColor Cyan
    $ancien = Get-Content $snap ; $nouveau = Get-Content $src
    $d = Compare-Object $ancien $nouveau
    if ($d) { $d | Format-Table -AutoSize } else { Write-Host "  (aucune difference pour l'instant)" }
  }
  Write-Host ""
  Write-Host "Mesure APRES (relance ce script apres avoir configure) :" -ForegroundColor Cyan
  Write-Host "  hermes -p $Pilote prompt-size"
  exit 0
}

if ($Apply) {
  if (-not $Key) { Write-Host "[ECHEC] -Key requis (la cle trouvee en phase -Discover)" -ForegroundColor Red ; exit 1 }
  foreach ($p in $workers) {
    if ($p -eq $Pilote) { continue }
    # securite garde 'web' pour consulter les avis de vulnerabilite
    $v = $Value
    if ($p -eq "securite" -and $Value) { $v = ($Value + ",web") }
    hermes -p $p config set $Key $v
    Write-Host ("[OK] {0} : {1} = {2}" -f $p, $Key, $v) -ForegroundColor Green
  }
  Write-Host ""
  Write-Host "Verification (taille de prompt par profil) :" -ForegroundColor Cyan
  foreach ($p in $workers) {
    $t = (& hermes -p $p prompt-size 2>&1 | Select-String "Tool schemas") -join " "
    Write-Host ("  {0,-14} {1}" -f $p, $t)
  }
  exit 0
}

Write-Host "Usage :"
Write-Host "  .\trim-toolsets.ps1 -Discover                        # etape 1, sur le profil pilote"
Write-Host "  .\trim-toolsets.ps1 -Apply -Key <cle> -Value <val>   # etape 2, propagation"
