# fix-feat-badge.ps1 - Debloque la chaine de la feature 003 (modale + badge)
#
# CONTEXTE : l'ouvrier a bloque le FEAT t_220dd634 avec "review-required:" parce que
# pnpm typecheck et pnpm lint echouent sur les fichiers du TESTEUR, auxquels il n'a
# pas le droit de toucher (dual-sandbox). Le revieweur ne pouvait pas trancher car
# son ticket attendait INTEG, qui attendait le FEAT bloque : impasse.
#
# Ce script : corrige l'ordre de la chaine (REVIEW avant INTEG) et cree le ticket
# de correction pour le testeur, seul proprietaire de ses fichiers de test.
#
# Usage : powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\fix-feat-badge.ps1
# NOTE : fichier volontairement en ASCII pur (PowerShell 5.1 + UTF-8 sans BOM = chaines corrompues)

param(
  [string]$Repo   = "C:\_work\my_projects\donjon-dragon",
  [string]$Board  = "dnd-saas",
  [string]$Feat   = "t_220dd634",   # [FEAT][S] Badge compteur (bloque)
  [string]$Test   = "t_9fb2f76d",   # [TEST][S] Tests modale et badge (done)
  [string]$Review = "t_f39879d1",   # [REVIEW]
  [string]$Integ  = "t_b45ce2ac"    # [INTEG][S]
)

Write-Host ""
Write-Host "=== 1. Correction de l'ordre : FEAT et TEST -> REVIEW -> INTEG ===" -ForegroundColor Cyan
# link <parent> <enfant> : l'enfant attend le parent
hermes kanban --board $Board link $Feat   $Review
hermes kanban --board $Board link $Test   $Review
hermes kanban --board $Board link $Review $Integ
Write-Host "  [OK] Le revieweur pourra trancher des que le FEAT sera debloque." -ForegroundColor Green

Write-Host ""
Write-Host "=== 2. Ticket de correction pour le testeur ===" -ForegroundColor Cyan
$out = hermes kanban --board $Board create "[TEST][S] Corriger 12 erreurs TS et 1 import inutilise dans les tests badge" `
       --assignee testeur --workspace "dir:$Repo" | Out-String
Write-Host $out.Trim()
$id = ([regex]'t_[0-9a-f]{8}').Match($out).Value
if (-not $id) {
  Write-Host "  [ECHEC] ID du ticket non detecte. Cree le commentaire a la main." -ForegroundColor Red
  exit 1
}
Write-Host "  [OK] Ticket cree : $id" -ForegroundColor Green

$corps = @"
## Contexte
L'ouvrier a bloque le ticket $Feat : ``pnpm typecheck`` remonte 12 erreurs TS dans TES fichiers
de test, et ``pnpm lint`` un import inutilise (waitFor) dans friends.container.test.tsx ligne 2.
Toi seul peux les corriger : les devs n'ont pas le droit de toucher aux fichiers de test.

## Objectif
``pnpm typecheck`` et ``pnpm lint`` verts, SANS affaiblir les assertions.

Regle absolue : si une erreur TS revele que ton test attend une API differente de celle que
l'implementation fournit, NE CHANGE PAS le test pour le faire passer. Commente ce ticket avec
l'ecart constate (fichier, ligne, ce que le test attend, ce que le code expose) et bloque avec
``dependency: divergence de contrat``. C'est au revieweur de trancher qui a raison, du test ou
du code. Adapter le test pour verdir la CI detruirait tout l'interet du dual-sandbox.

## Perimetre
- Fichiers autorises : uniquement tes fichiers de test
  front/src/pages/profile/friends/_internal/views/remove-friend-modal.view.test.tsx
  front/src/pages/profile/friends/_internal/containers/friends.container.test.tsx
  front/src/pages/profile/friends/_internal/views/friends-list.view.test.tsx
- Interdit : toute modification du code de production, des schemas de shared/, du CI.

## Contraintes
DoD : pnpm typecheck, puis pnpm lint, puis pnpm test, dans cet ordre. Verification par git diff.
Lire MODE a la racine avant de commencer.
"@

hermes kanban --board $Board comment $id $corps
Write-Host "  [OK] Corps attache." -ForegroundColor Green

Write-Host ""
Write-Host "=== 3. Etat du board ===" -ForegroundColor Cyan
hermes kanban --board $Board list

Write-Host ""
Write-Host "PROCHAINE ETAPE : quand $id passe en 'done', debloque le FEAT :" -ForegroundColor Yellow
Write-Host "  hermes kanban --board $Board unblock $Feat"
Write-Host ""
Write-Host "Le testeur n'a pas couvert UA-004 et UA-005 (logique useRemoveFriend) : il l'a signale"
Write-Host "lui-meme. Prevoir un ticket dedie apres le deblocage de cette chaine."