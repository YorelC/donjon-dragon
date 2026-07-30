# set-qwen-profiles.ps1 - Aligne testeur et devops sur le Qwen local (llama-server :8001), comme ouvrier
# Methode identique a ton setup-cli.md (hermes config set), pas d'edition YAML manuelle.
# Usage : powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\set-qwen-profiles.ps1
# NOTE : fichier volontairement en ASCII pur (PowerShell 5.1 + UTF-8 sans BOM = chaines corrompues)

param(
  [string]$Repo = "C:\_work\my_projects\donjon-dragon",
  [string[]]$Profils = @("testeur", "devops")
)

# 1. Le serveur Qwen doit tourner : Hermes interroge l'endpoint au DEMARRAGE du profil
#    (fetch de la taille de contexte) -> c'est le crash WinError 10061 que tu as vu sur ouvrier.
try {
  Invoke-RestMethod "http://127.0.0.1:8001/v1/models" -TimeoutSec 3 | Out-Null
  Write-Host "[OK] llama-server repond sur :8001" -ForegroundColor Green
} catch {
  Write-Host "[ECHEC] Serveur Qwen injoignable sur :8001. Lance d'abord (autre terminal) :" -ForegroundColor Red
  Write-Host "  powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\ia_automation_code\local-llm\start-qwen-coder.ps1"
  exit 1
}

# 2. Alignement des profils sur la config d'ouvrier
foreach ($p in $Profils) {
  hermes -p $p config set model.provider custom
  hermes -p $p config set model.default qwen3-coder-next
  hermes -p $p config set model.base_url http://127.0.0.1:8001/v1
  hermes -p $p config set terminal.cwd $Repo
  Write-Host "[OK] $p -> qwen3-coder-next local (:8001), cwd=$Repo" -ForegroundColor Green
}

# 3. Verification
foreach ($p in $Profils) {
  Write-Host ""
  Write-Host "--- config $p ---" -ForegroundColor Cyan
  hermes -p $p config show | Select-String -Pattern "provider|default|base_url|cwd" | Select-Object -First 6
}
Write-Host ""
Write-Host "Test rapide conseille :  hermes -p testeur chat -q `"Reponds uniquement: OK`""
