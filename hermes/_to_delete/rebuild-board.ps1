# rebuild-board.ps1 - Reconstruit proprement la chaine de la feature 003 (modale + badge)
#
# CONTEXTE : les liens parent/enfant du board ont ete crees a l'envers
# (`link <nouveau> <spec>` au lieu de `link <spec> <nouveau>`), donc tous les tickets
# etaient sans parent, tous `ready` en meme temps, et lances dans un ordre arbitraire.
# Ce script archive l'existant et recree la chaine avec --parent A LA CREATION.
#
# Usage : powershell -ExecutionPolicy Bypass -File C:\_work\my_projects\donjon-dragon\hermes\rebuild-board.ps1
#         (ajouter -DryRun pour voir les commandes sans les executer)
# NOTE : fichier volontairement en ASCII pur (PowerShell 5.1 + UTF-8 sans BOM = chaines corrompues)

param(
  [string]$Repo  = "C:\_work\my_projects\donjon-dragon",
  [string]$Board = "dnd-saas",
  [switch]$DryRun
)

$WS = "dir:$Repo"
function K { param([string[]]$a)
  if ($DryRun) { Write-Host "  hermes kanban --board $Board $($a -join ' ')" -ForegroundColor DarkGray ; return "t_DRYRUN" }
  $out = & hermes kanban --board $Board @a 2>&1 | Out-String
  Write-Host $out.Trim()
  if ($out -match '(t_[0-9a-f]{8})') { return $Matches[1] } else { return $null }
}

# ---------------------------------------------------------------- 1. Archiver
Write-Host ""
Write-Host "=== 1. Archivage des tickets casses ===" -ForegroundColor Cyan
$casses = @("t_749170f0","t_b27a5bed","t_5a400a57","t_adee90ae","t_d79b2285",
            "t_9115d286","t_a64c4d04","t_b44dea60","t_f1bb38bf","t_9fd01b77")
foreach ($id in $casses) { K @("archive", $id) | Out-Null }
Write-Host "  Le ticket SPEC t_68908c1c est CONSERVE : il redevient la racine." -ForegroundColor Yellow
Write-Host "  Les livrables deja produits (specs/, contrats, code de la modale) sont dans git : rien n'est perdu."

# ---------------------------------------------------------------- 2. Recreer
Write-Host ""
Write-Host "=== 2. Reconstruction de la chaine (--parent a la creation) ===" -ForegroundColor Cyan
$SPEC = "t_68908c1c"

# Le ticket ARCH et DESIGN sont deja livres (contrats + wireframes dans git).
# On repart au niveau implementation : ce qui reste a faire.

$FEAT_BADGE = K @("create","[FEAT][S] Badge compteur demandes recues (front)","--assignee","ouvrier","--parent",$SPEC,"--workspace",$WS)
$TEST       = K @("create","[TEST][S] Tests: modale suppression et badge","--assignee","testeur","--parent",$SPEC,"--workspace",$WS)
$INTEG      = K @("create","[INTEG][S] Parcours complet: suppression ami et badge","--assignee","testeur","--parent",$FEAT_BADGE,"--workspace",$WS)
$REVIEW     = K @("create","[REVIEW] Revue: modale suppression et badge amis","--assignee","revieweur","--parent",$INTEG,"--workspace",$WS)
$OPS        = K @("create","[OPS][S] Deploy + smoke: modale et badge amis","--assignee","devops","--parent",$REVIEW,"--workspace",$WS)
$DOC        = K @("create","[DOC][S] Changelog + doc: modale et badge amis","--assignee","scribe","--parent",$OPS,"--workspace",$WS)

# Second parent : la revue attend AUSSI les tests (dual-sandbox : fusion chez le revieweur)
K @("link",$TEST,$REVIEW) | Out-Null

# ---------------------------------------------------------------- 3. Corps riches
Write-Host ""
Write-Host "=== 3. Corps des tickets (UA completes, chemins exacts) ===" -ForegroundColor Cyan

$corpsFeat = @"
## Objectif
Badge compteur de demandes recues sur l'onglet "Recues" de la page Amis.

## UA a implementer (texte integral de specs/003-friends-list-modal-badge.md)

### UA-006 - Affichage du badge sur l'onglet "Recues"
QUAND la page "Amis" est chargee, SI le nombre de demandes d'ami recues est > 0,
le systeme DOIT afficher un badge numerique a cote du label "Recues" dans le TabsTrigger.
| Demandes recues | Etat du badge | Affichage |
| 1 | visible | badge "1" a cote de "Recues" |
| 3 | visible | badge "3" a cote de "Recues" |
| 9 | visible | badge "9" a cote de "Recues" |

### UA-007 - Truncation a "9+"  [depend de UA-006]
QUAND le badge est affiche, SI le nombre de demandes recues est > 9,
le systeme DOIT afficher "9+" au lieu du nombre exact.
| 10 | "9+" |  | 15 | "9+" |  | 99 | "9+" |

### UA-010 - Masquage a zero demande  [depend de UA-006]
QUAND le nombre de demandes recues est de 0, le systeme DOIT masquer le badge.
| 0 | cache (aucun badge visible) |

## Perimetre
UA-008 et UA-009 (requete au montage et refetch au clic) sont dans un ticket separe :
ne les implemente PAS ici, consomme le hook tel qu'il existe.

## Contraintes
Front uniquement. TanStack Query pour la donnee, shadcn Tabs + Badge pour l'UI.
Architecture : .page.tsx / .container.tsx / .view.tsx, dossier _internal/ de la page.
Le badge est un element visuel : il vit dans une view PURE, la donnee vient du container.
Fonctions et hooks <= 20 lignes. Composants depuis shared/components uniquement.
DoD : pnpm typecheck -> pnpm lint -> pnpm test, verification par git diff.
Lire MODE a la racine avant de commencer.
Ticket flou ou > 3 UA : bloque avec "dependency: ticket a redecouper".
"@

$corpsTest = @"
## Objectif
Tests des UA-001 a UA-010 de specs/003-friends-list-modal-badge.md.

## Regle dual-sandbox (absolue)
Tu lis UNIQUEMENT : ce ticket, specs/003-friends-list-modal-badge.md, les schemas Zod de shared/.
INTERDIT d'ouvrir l'implementation front. Tes tests decoulent de la spec, pas du code :
c'est ce qui leur donne leur valeur. Ils peuvent echouer si l'implementation n'existe pas encore.

## Nommage impose
Un test par UA, l'ID en tete du nom :
  it("UA-004: affiche un toast vert 'Ami supprime' pendant 3 secondes")
Les tables de valeurs de la spec deviennent des it.each avec les valeurs EXACTES,
messages d'erreur compris ("Erreur lors de la suppression. Veuillez reessayer.").

## Couverture attendue
UA-001 a UA-005 : modale de suppression (ouverture, annulation, optimiste, toast succes, rollback)
UA-006, UA-007, UA-010 : badge (affichage, truncation 9+, masquage a 0)
UA-008, UA-009 : requete au montage et refetch au clic

## Contraintes
Vitest + Testing Library. Termine par un commentaire listant les UA couvertes / non couvertes.
DoD : pnpm typecheck -> pnpm lint -> pnpm test.
"@

$corpsInteg = @"
## Objectif
Filet anti-couture : verifier que l'assemblage fonctionne, pas les UA une a une.

## Perimetre
Rejoue les deux parcours Gherkin du "Parcours nominal" de specs/003-friends-list-modal-badge.md,
de bout en bout : suppression d'un ami avec confirmation puis toast, et affichage du badge
au chargement puis mise a jour au clic sur l'onglet.

Tu testes les jointures entre les tickets FEAT, pas leurs details internes.

## Contraintes
DoD : pnpm typecheck -> pnpm lint -> pnpm test.
"@

$corpsReview = @"
## Objectif
Point de fusion du dual-sandbox : faire tourner les tests du testeur contre l'implementation.

## Procedure
1. AVANT tout appel claude -p (gratuit) : pnpm typecheck puis pnpm test.
   Chaque echec est soit un bug d'implementation, soit une ambiguite de spec. Classe chaque ecart.
2. Controle de tracabilite : chaque UA de la spec a-t-elle un test nomme "UA-NNN:" qui passe ?
   Chaque commit porte-t-il ses tags [t_xxxx][UA-NNN] ? Du code sans UA = refactor non demande = refus.
3. Revue Claude seulement si les tests passent (lire MODE avant).

## Contraintes
Verifier aussi : architecture .page/.container/.view respectee, aucune view n'importe de container,
fonctions et hooks <= 20 lignes, composants issus de shared/components.
"@

if (-not $DryRun) {
  if ($FEAT_BADGE) { K @("comment",$FEAT_BADGE,$corpsFeat)  | Out-Null }
  if ($TEST)       { K @("comment",$TEST,$corpsTest)        | Out-Null }
  if ($INTEG)      { K @("comment",$INTEG,$corpsInteg)      | Out-Null }
  if ($REVIEW)     { K @("comment",$REVIEW,$corpsReview)    | Out-Null }
}

# ---------------------------------------------------------------- 4. Verification
Write-Host ""
Write-Host "=== 4. VERIFICATION DU GRAPHE (le test qui compte) ===" -ForegroundColor Cyan
Write-Host "Attendu : SEULS le FEAT et le TEST sont 'ready'. Tout le reste en 'todo'."
Write-Host "Si [DOC] ou [OPS] apparait 'ready', le graphe est encore inverse : STOP." -ForegroundColor Yellow
Write-Host ""
hermes kanban --board $Board list
