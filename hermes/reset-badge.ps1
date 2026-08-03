# reset-badge.ps1 - Repart proprement sur la feature badge, depuis le commit d'architecture
#
# CONTEXTE : le revieweur a refuse la revue avec 3 bloquants, dont une violation du
# dual-sandbox (185 lignes de code de production dans un commit tague `test(friends)`).
# On annule le code de la feature, on conserve et on commite le travail de pipeline,
# puis on recree la chaine de tickets depuis zero.
#
# Baseline conservee : 4384f65 "arch(friends): schemas Zod + port countPendingReceived + ADR 001"
# Les contrats de l'architecte sont donc GARDES : on refait l'implementation, pas la conception.
#
# Usage : powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\reset-badge.ps1
#         (-DryRun pour voir sans rien faire)
# NOTE : fichier volontairement en ASCII pur (PowerShell 5.1 + UTF-8 sans BOM = chaines corrompues)

param(
  [string]$Repo     = "C:\_work\my_projects\donjon-dragon",
  [string]$Board    = "dnd-saas",
  [string]$Baseline = "4384f656827d19340ee212b9ba453dc3e1e415e2",
  [switch]$DryRun
)

Push-Location $Repo   # Pop-Location en fin de script : ne deplace pas ton terminal
function Run($cmd) {
  if ($DryRun) { Write-Host "  $cmd" -ForegroundColor DarkGray }
  else { Write-Host "  > $cmd" -ForegroundColor DarkGray ; Invoke-Expression $cmd }
}

# ---------------------------------------------------------------- 0. Securite
Write-Host ""
Write-Host "=== 0. La gateway doit etre arretee ===" -ForegroundColor Cyan
$g = hermes gateway status 2>&1 | Out-String
if ($g -match "running|started|actif") {
  Write-Host "  [STOP] La gateway tourne encore. Arrete-la d'abord :" -ForegroundColor Red
  Write-Host "     hermes gateway stop"
  Write-Host "  Sinon les workers ecriront pendant le retour arriere."
  if (-not $DryRun) { exit 1 }
} else { Write-Host "  [OK] gateway arretee" -ForegroundColor Green }

# ---------------------------------------------------------------- 1. Board
Write-Host ""
Write-Host "=== 1. Archivage des tickets de la feature badge ===" -ForegroundColor Cyan
$aArchiver = @("t_68908c1c","t_220dd634","t_9fb2f76d","t_b45ce2ac","t_f39879d1",
               "t_0684081a","t_4bdd9e74","t_1b6a1a30","t_12c4573a","t_2f8c8594","t_ead2acb7")
foreach ($t in $aArchiver) { Run "hermes kanban --board $Board archive $t" }

# ---------------------------------------------------------------- 2. Code
Write-Host ""
Write-Host "=== 2. Retour du CODE a la baseline (contrats de l'architecte conserves) ===" -ForegroundColor Cyan
Write-Host "  Restaure front/ et shared/ tels qu'ils etaient au commit $($Baseline.Substring(0,7))."
Run "git checkout $Baseline -- front/ shared/"

Write-Host "  Suppression des fichiers non suivis crees par les workers :"
$orphelins = @(
  "front\src\pages\profile\friends\_internal\hooks\use-friend-remove-modal.ts",
  "front\src\pages\profile\friends\_internal\queries\use-remove-friend.test.ts"
)
foreach ($f in $orphelins) {
  if (Test-Path $f) { Run "Remove-Item -Force '$f'" } else { Write-Host "    (deja absent) $f" -ForegroundColor DarkGray }
}
Write-Host "  Verification qu'il ne reste aucun fichier front non suivi :"
Run "git status --short -- front/ shared/"

# ---------------------------------------------------------------- 3. Commit
Write-Host ""
Write-Host "=== 3. Commit du travail de pipeline (hermes, knowledges, docs) ===" -ForegroundColor Cyan
Write-Host "  Note : ~45 fichiers ne different que par leurs fins de ligne (CRLF/LF)."
Write-Host "  Ils partent dans le meme commit, c'est sans consequence."
Run "git add -A"
Run "git commit -m ""chore(agents): pipeline v3 consolide, guide Hermes, durcissement testeur"""

# ---------------------------------------------------------------- 4. Nouvelle chaine
Write-Host ""
Write-Host "=== 4. Nouvelle chaine de tickets, depuis la spec existante ===" -ForegroundColor Cyan
Write-Host "  La spec specs/003-friends-list-modal-badge.md est CONSERVEE : elle etait bonne."
Write-Host "  Les contrats Zod et le port countPendingReceived aussi (commit baseline)."
Write-Host ""
Write-Host "  Cree la chaine avec --parent A LA CREATION, dans cet ordre :" -ForegroundColor Yellow
Write-Host ""
Write-Host '  $SPEC = "<id du ticket SPEC recree, ou reutilise la spec existante>"'
Write-Host "  hermes kanban --board $Board create ""[FEAT][S] Modale de suppression d'un ami (UA-001 a UA-005)"" --assignee ouvrier --workspace dir:$Repo"
Write-Host "  hermes kanban --board $Board create ""[FEAT][S] Badge compteur demandes recues (UA-006, UA-007, UA-010)"" --assignee ouvrier --workspace dir:$Repo"
Write-Host "  hermes kanban --board $Board create ""[FEAT][S] Requete et refetch des demandes (UA-008, UA-009)"" --assignee ouvrier --workspace dir:$Repo"
Write-Host "  hermes kanban --board $Board create ""[TEST][S] Tests UA-001 a UA-010"" --assignee testeur --workspace dir:$Repo"
Write-Host "  # puis REVIEW avec les 3 FEAT + le TEST en parents, INTEG enfant du REVIEW,"
Write-Host "  # OPS enfant de INTEG, DOC enfant de OPS."
Write-Host ""
Write-Host "  Rappel : --parent a la creation. Si [DOC] est 'ready' juste apres, le graphe est inverse."

Write-Host ""
Write-Host "=== ENSUITE ===" -ForegroundColor Cyan
Write-Host "  1. powershell -ExecutionPolicy Bypass -File $Repo\hermes\deploy.ps1"
Write-Host "  2. hermes gateway start"
Write-Host "  3. hermes kanban watch"

Pop-Location
