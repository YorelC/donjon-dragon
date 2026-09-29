# Spec 013 — Le journal de bord du personnage

## Statut

**SPEC — décisions arrêtées avec Charly le 29/09/2026.** Elle ouvre le « journal de bord » jusque-là
rangé dans les fonctions différées (`docs/PRODUCT.md`) : un carnet de notes que le
joueur tient au fil de la campagne, découpé en chapitres, dans la fiche de son
personnage. Conformément à `docs/README.md`, l'ordre reste
`SPEC → PLAN → CODE → TEST → REVIEW`.

## Références normatives

- `SF-001`, section « Visibilité », et `DEC-002` : qui lit la fiche d'un personnage ;
- `SF-002`, section « Journal de bord » (`docs/REQUIREMENTS.md`) ;
- `DEC-015` et `DEC-016` : toute commande mutante est atomique, idempotente et
  versionnée, et porte son reçu et son audit ;
- `specs/012-character-sheet-play-surface.md` : cadre, onglets, hauteur et défilement de
  la fiche, écran de référence.

## Périmètre

Le journal d'un personnage de campagne, lu et écrit depuis un onglet de sa fiche.

## Hors périmètre volontaire

- la rédaction de campagne par le MJ et l'import Markdown de campagne ;
- les notes partagées entre joueurs, ou partagées au cas par cas avec le MJ ;
- les dossiers, sous-chapitres, épingles et la recherche dans le journal ;
- la corbeille : une suppression est définitive ;
- la diffusion temps réel d'une modification à un autre lecteur.

## Le modèle

Un personnage a un seul journal. Le journal est une liste ordonnée de **chapitres**.
Un chapitre a un titre et un texte au format Markdown.

| Élément | Règle |
|---|---|
| Chapitres par personnage | 200 au plus |
| Titre | 80 caractères au plus ; vide, il s'affiche « Sans titre » |
| Texte | 20 000 caractères au plus, Markdown avec les extensions GFM (cases à cocher, tableaux, barré) |
| Ordre | choisi par l'auteur ; un nouveau chapitre s'ajoute en dernier |

Le journal appartient au **personnage**, pas au joueur : il le suit quand un MJ le
réattribue, et le nouveau joueur assigné en hérite.

## Qui lit, qui écrit

| Acteur | Lecture | Écriture |
|---|---|---|
| Joueur assigné | oui | oui |
| Autre joueur | non (le journal n'existe pas pour lui) | non |
| MJ de la campagne, personnage assigné | oui | non |
| MJ de la campagne, personnage non assigné | oui | oui |

La lecture suit la fiche : qui ne peut pas lire la fiche ne peut pas lire le journal,
et reçoit la même réponse « introuvable ». Le serveur dit au client si l'appelant peut
écrire ; l'interface n'en décide pas seule.

## L'écran

### Place dans la fiche

Un onglet « Journal », le dernier de la fiche, à droite du bloc des jets. Il reprend la
règle de défilement de la spec 012 : la page ne défile pas, et la liste des chapitres
et le chapitre ouvert défilent chacun de son côté.

Sur l'écran de référence (fenêtre 1280×700) :

```
┌ Armes  Aptitudes  Grimoire  Barda  Identité  ◆ Journal ─────────────────────┐
│ ┌ Chapitres ───── + ┐ ┌ Titre du chapitre ───────────── ✓ Enregistré 🔒 🗑 ┐ │
│ │ ◆ La taverne      │ │                                                   │ │
│ │ ◇ Le forgeron     │ │  Texte du chapitre, rendu Markdown en lecture,    │ │
│ │ ◇ Indices         │ │  source Markdown en édition.                      │ │
│ │ ◇ PNJ rencontrés  │ │                                                   │ │
│ └───────────────────┘ └───────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

- colonne des chapitres d'environ 220 px, le chapitre ouvert prend le reste ;
- aucun titre coupé sans ellipse, aucun défilement horizontal ;
- sur un écran étroit, la liste passe au-dessus du chapitre.

### Liste des chapitres

- titres dans l'ordre choisi ; le chapitre ouvert est marqué ;
- un bouton « Nouveau chapitre » crée un chapitre vide en dernier, l'ouvre et place le
  curseur dans son titre ;
- l'auteur réordonne par glisser-déposer, à la souris comme au clavier ;
- à l'ouverture de l'onglet, le premier chapitre est ouvert ;
- journal vide : un message invite à créer le premier chapitre ; pour un lecteur qui
  ne peut pas écrire, il dit seulement que le journal est vide.

### Chapitre ouvert

- en-tête : titre, état de la sauvegarde, bouton de verrou, bouton de suppression ;
- **verrouillé** : le texte est rendu en Markdown, titre et texte ne sont pas
  modifiables ;
- **déverrouillé** : le titre est un champ, le texte est une zone de saisie de la
  source Markdown ;
- le verrou est un état d'affichage, propre à l'écran et non enregistré : un chapitre
  s'ouvre verrouillé ; un chapitre qui vient d'être créé s'ouvre déverrouillé ;
- un lecteur qui ne peut pas écrire voit le chapitre verrouillé, sans bouton de verrou,
  de suppression, de création ni de glisser-déposer.

Le Markdown est rendu sans HTML brut : une balise écrite dans le texte s'affiche comme
du texte et n'est jamais interprétée. Une image Markdown n'est jamais chargée : elle
s'affiche comme un lien vers son adresse. Un lecteur, le MJ en particulier, ne fait
ainsi aucune requête vers un site choisi par l'auteur.

### Sauvegarde

La sauvegarde est automatique, comme dans Notes :

- après une pause de frappe d'environ une seconde ;
- immédiatement au verrouillage, au changement de chapitre ou d'onglet, et à la
  fermeture de l'écran ;
- une frappe faite pendant qu'une sauvegarde est en cours part dès qu'elle se termine,
  même si le chapitre a été fermé entre-temps ;
- à la fermeture de la page du navigateur, le brouillon non enregistré part en requête
  maintenue après la fermeture (`keepalive`). Cette requête est plafonnée par le
  navigateur à 64 Ko : un chapitre plus lourd (texte très accentué proche de la borne)
  peut perdre sa dernière seconde de frappe ;
- l'en-tête affiche « Enregistrement… », puis « Enregistré », ou l'échec.

Une limite atteinte (titre, texte) bloque la saisie au-delà et le dit ; le 201ᵉ chapitre
est refusé avec un message.

### Suppression

Le bouton de suppression ouvre une confirmation qui nomme le chapitre. Confirmée, la
suppression est définitive et le chapitre suivant (ou précédent) s'ouvre.

### Conflit entre deux écrans

Le même chapitre peut être ouvert sur deux écrans du même joueur (ordinateur et
téléphone, deux onglets). Chaque sauvegarde porte la version du chapitre dont elle part ;
le serveur refuse celle qui part d'une version dépassée, pour ne rien écraser en silence.

Au refus, la sauvegarde automatique s'arrête et un dialogue s'ouvre :
« Ce chapitre a été modifié ailleurs. »

- **Prendre l'autre version** : le chapitre recharge la version enregistrée, la saisie
  locale est abandonnée ;
- **Garder ma version** : la saisie locale est enregistrée par-dessus la version la plus
  récente.

Aucun texte n'est perdu sans ce choix explicite.

## Persistance et audit

- Les chapitres sont stockés à part de la fiche : écrire dans le journal ne change pas
  la révision du personnage.
- Créer, modifier, supprimer et réordonner sont des commandes idempotentes et
  versionnées, avec reçu et entrée d'audit (`DEC-015`). L'audit note l'action, le
  chapitre et l'auteur, **jamais le titre ni le texte** : le journal reste une note
  personnelle.
- Aucune diffusion temps réel : un MJ qui lit voit la version enregistrée au moment où il
  ouvre le chapitre.
- Supprimer un personnage supprime ses chapitres dans la même transaction.
- Réordonner envoie l'ordre complet ; un ordre qui ne contient pas exactement les
  chapitres existants est refusé comme un conflit.

## Critères d'acceptation

- le joueur assigné crée, titre, écrit, réordonne et supprime ses chapitres ;
- un texte tapé puis laissé une seconde est enregistré sans action, et se retrouve après
  rechargement de la page ;
- un chapitre rouvert s'affiche verrouillé, rendu en Markdown ; un chapitre créé
  s'ouvre déverrouillé ;
- une case à cocher, un tableau et du barré écrits en Markdown GFM s'affichent rendus ;
- une balise HTML écrite dans le texte n'est pas interprétée ;
- une image Markdown s'affiche en lien, sans aucune requête vers son adresse ;
- changer de chapitre juste après une pause de frappe ne perd aucun caractère ;
- réordonner le sommaire ne change pas le chapitre ouvert ;
- un MJ lit le journal d'un personnage assigné sans pouvoir le modifier ; il écrit dans
  celui d'un personnage non assigné ;
- un autre joueur reçoit « introuvable » sur le journal comme sur la fiche ;
- réattribué, le personnage garde son journal, lisible par le nouveau joueur et plus par
  l'ancien ;
- le 201ᵉ chapitre, un titre de 81 caractères et un texte de 20 001 caractères sont
  refusés ;
- deux écrans sur le même chapitre : le second à enregistrer reçoit le dialogue de
  conflit, et chacun des deux choix produit le résultat décrit ;
- aucune entrée d'audit ne contient le titre ni le texte d'un chapitre ;
- supprimer le personnage supprime ses chapitres ;
- sur l'écran de référence, la page ne défile pas et les deux colonnes du journal
  défilent chacune de son côté.
