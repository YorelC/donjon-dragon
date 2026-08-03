# set-mode.ps1 - Bascule les profils de code entre le nuage (DeepSeek) et le local (Qwen)
#
#   -Mode cloud   : nominal. ouvrier/testeur/devops sur DeepSeek Flash. Board parallelisable.
#                   Le serveur llama.cpp n'a plus besoin de tourner.
#   -Mode local   : degrade. Les memes profils sur Qwen local. Board serialise (1 worker).
#                   Prerequis : start-qwen-coder.ps1 lance.
#
# Usage : powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\set-mode.ps1 -Mode cloud
# NOTE : fichier volontairement en ASCII pur (PowerShell 5.1 + UTF-8 sans BOM = chaines corrompues)

param(
  [Parameter(Mandatory=$true)][ValidateSet("cloud","local")][string]$Mode,
  [string]$Repo = "C:\_work\my_projects\donjon-dragon"
)

$profilsCode = @("ouvrier","testeur","devops")

function Ok($m) { Write-Host "  [OK] $m" -ForegroundColor Green }

Write-Host ""
Write-Host "=== Bascule en mode $Mode ===" -ForegroundColor Cyan

if ($Mode -eq "cloud") {
  # Le local sort du chemin critique : plus de contention GPU, board parallelisable
  foreach ($p in $profilsCode) {
    hermes -p $p config set model.provider openrouter
    hermes -p $p config set model.default deepseek/deepseek-v4-flash
    hermes -p $p config set model.base_url https://openrouter.ai/api/v1
    Ok "$p -> deepseek-v4-flash (nuage)"
  }
  hermes config set kanban.max_in_progress 3
  Ok "max_in_progress = 3 (plus de contention GPU, les tickets avancent en parallele)"
  Write-Host ""
  Write-Host "  Le serveur llama.cpp n'est plus necessaire au fonctionnement nominal." -ForegroundColor DarkGray
}
else {
  foreach ($p in $profilsCode) {
    hermes -p $p config set model.provider custom
    hermes -p $p config set model.default qwen3-coder-next
    hermes -p $p config set model.base_url http://127.0.0.1:8001/v1
    Ok "$p -> qwen3-coder-next (local)"
  }
  hermes config set kanban.max_in_progress 1
  Ok "max_in_progress = 1 (un seul worker : le GPU est partage)"
  Write-Host ""
  Write-Host "  PREREQUIS : le serveur doit tourner. Verification..." -ForegroundColor Yellow
  try {
    Invoke-RestMethod "http://127.0.0.1:8001/v1/models" -TimeoutSec 3 | Out-Null
    Ok "llama-server repond sur :8001"
  } catch {
    Write-Host "  [ECHEC] Serveur injoignable. Lance d'abord :" -ForegroundColor Red
    Write-Host "    powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\ia_automation_code\local-llm\start-qwen-coder.ps1"
  }
}

# Profils de reflexion : toujours dans le nuage, ils ne touchent pas au GPU
Write-Host ""
Write-Host "=== Profils de reflexion (inchanges par la bascule) ===" -ForegroundColor Cyan
$pro = @("analyste","architecte")
foreach ($p in $pro) {
  hermes -p $p config set model.default deepseek/deepseek-v4-pro
  Ok "$p -> deepseek-v4-pro"
}
foreach ($p in @("orchestrateur","designer","scribe","dev-senior","revieweur","securite")) {
  hermes -p $p config set model.default deepseek/deepseek-v4-flash
  Ok "$p -> deepseek-v4-flash"
}

Write-Host ""
Write-Host "=== Redemarrage de la gateway ===" -ForegroundColor Cyan
hermes gateway restart

Write-Host ""
Write-Host "=== Verification ===" -ForegroundColor Cyan
foreach ($p in @("orchestrateur","analyste","architecte","designer","dev-senior","ouvrier","testeur","revieweur","devops","securite","scribe")) {
  $m = (Get-Content "$env:LOCALAPPDATA\hermes\profiles\$p\config.yaml" -ErrorAction SilentlyContinue |
        Select-String "default:" | Select-Object -First 1) -replace '.*default:\s*',''
  Write-Host ("  {0,-14} {1}" -f $p, $m.Trim())
}
