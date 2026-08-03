# bootstrap-board.ps1 — Initialise le board Kanban Hermès du SaaS D&D avec le premier épic
# Prérequis : profils Hermès créés (voir README §2), MODE/STATUS.md/docs ajoutés au repo existant
param([string]$Repo = "C:\_work\my_projects\donjon-dragon")

hermes kanban init
hermes kanban boards create dnd-saas --name "SaaS D&D" --description "VTT simplifie - pipeline agents autonomes"
hermes kanban boards switch dnd-saas

# --- Épic 1 : le cœur du jeu — lancer de dés partagé ---
# Le ticket [SPEC] est normalement créé par Margarette depuis Discord (skill product).
# Pour ce premier épic de validation, on le crée à la main :

hermes kanban create "[SPEC][M] Spec: lancer de des partage en temps reel" `
  --assignee bernadette --workspace dir:$Repo

# Remplace t_SPEC par l'ID affiché ci-dessus, puis enchaîne :
# hermes kanban create "[ARCH][M] Schemas Zod + ports domaine: jets de des" --assignee architecte --parent t_SPEC --workspace dir:$Repo
# hermes kanban create "[DESIGN][S] UI du lancer de des (feedback anime)" --assignee designer --parent t_SPEC --workspace dir:$Repo
# hermes kanban create "[TEST][M] Tests contrat des (property-based, dual-sandbox)" --assignee testeur --parent t_ARCH --workspace dir:$Repo
# hermes kanban create "[FEAT][L] Moteur de des + diffusion Socket.IO" --assignee dev-senior --parent t_ARCH --workspace dir:$Repo
# hermes kanban create "[REVIEW] Revue: feature des" --assignee revieweur --parent t_FEAT --workspace dir:$Repo
# hermes kanban link t_TEST t_REVIEW
# hermes kanban create "[OPS][S] CI + premier deploiement en ligne" --assignee devops --parent t_REVIEW --workspace dir:$Repo
# hermes kanban create "[SEC][M] Audit pre-release v0.1" --assignee securite --parent t_OPS --workspace dir:$Repo
# hermes kanban create "[DOC][S] Changelog + guide 'lancer un de'" --assignee scribe --parent t_OPS --workspace dir:$Repo

Write-Host "Board dnd-saas initialise. Cree le ticket SPEC, recupere son ID, puis decommente et complete la chaine."
Write-Host "Suivi en direct : hermes kanban watch"
