# setup-veille.ps1 - Cree le job cron qui reveille Margarette pour surveiller les tickets bloques
# Sans lui, personne ne regarde le board : Margarette est un agent conversationnel,
# elle n'agit que lorsqu'un message arrive.
#
# Usage : powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\setup-veille.ps1
# NOTE : fichier volontairement en ASCII pur (PowerShell 5.1 + UTF-8 sans BOM = chaines corrompues)

param(
  [string]$Repo     = "C:\_work\my_projects\donjon-dragon",
  [string]$Cadence  = "every 30 minutes"
)

# Fichier de dedoublonnage : evite de re-signaler un ticket deja remonte
$notified = Join-Path $Repo "hermes\.blocked-notified"
if (-not (Test-Path $notified)) { New-Item -ItemType File -Path $notified -Force | Out-Null }
Write-Host "[OK] Fichier de dedoublonnage : $notified" -ForegroundColor Green

$prompt = @"
Veille Kanban. Execute le Role 3 de ta skill product (veille des blocages), etape par etape :
releve les tickets blocked du board dnd-saas, dedoublonne avec hermes\.blocked-notified,
trie selon le tableau (tu resous seule tout ce qui n'est pas une decision de Charly),
puis n'ecris a Charly QUE s'il reste quelque chose pour lui, en un seul message groupe.
S'il n'y a rien de nouveau pour lui, ne dis rien : le silence est un rapport valide.
"@

Write-Host ""
Write-Host "Creation du job cron..." -ForegroundColor Cyan
hermes cron create "$Cadence" --prompt "$prompt" --workdir $Repo --name veille-kanban

Write-Host ""
Write-Host "Verification :" -ForegroundColor Cyan
hermes cron list
Write-Host ""
Write-Host "Si la syntaxe ci-dessus a ete refusee, lance 'hermes cron create' sans argument :"
Write-Host "  l'assistant interactif te demandera cadence, prompt et workdir."
Write-Host ""
Write-Host "Test immediat sans attendre la prochaine occurrence :"
Write-Host "  hermes cron list           # recupere l'id du job"
Write-Host "  hermes cron run <job-id>"
Write-Host ""
Write-Host "Pour mettre en pause (ex. le week-end) :  hermes cron pause <job-id>"
