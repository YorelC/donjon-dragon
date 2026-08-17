# Convention de clés du catalogue d'objets

## La règle

**Slug anglais, nom français.** La clé est un identifiant technique, le nom est ce que le
joueur lit.

```json
{ "key": "backpack", "name": "Sac à dos" }
{ "key": "thieves-tools", "name": "Outils de voleur" }
```

La clé ne s'affiche jamais : elle vit dans les index Mongo, dans l'équipement de départ des
classes et des historiques, et dans l'inventaire des personnages. Aucune URL n'en porte.

L'internationalisation des **noms** — plusieurs langues pour un même objet — reste à faire
et ne touchera pas les clés : c'est précisément ce que cette séparation permet.

## Pourquoi l'anglais

Avant le 17/08/2026 le catalogue parlait deux langues : les 38 armes et les 13 armures
portaient une clé anglaise, les 105 autres objets un slug français. On trouvait `leather`
et `carquois` **dans la même option d'équipement** du roublard.

L'anglais l'a emporté pour une raison mesurable : l'audit de divergence
(`scripts/srd/audit.ts`) apparie les objets du projet au SRD 5.2 **par leur clé**. Avec les
clés bilingues, il n'en surveillait que 54 sur 159. Passer tout en français l'aurait ramené
à 0 ; passer tout en anglais l'a monté à **153**.

## Comment l'appariement a été établi

Pas par empreinte automatique : le recoupement coût + poids est trop ambigu sur le petit
matériel, et proposait `antidote → spell-scroll-level-1` ou `coffre → hunting-trap`.

Chaque correspondance a été établie **nom par nom**, puis vérifiée par le coût et le poids.
L'audit a servi de contrôle : un mauvais appariement produit une divergence de statistique,
donc il se voit. Aucune n'a été détectée après le renommage.

## Les six clés forgées

Six objets n'ont pas d'entrée SRD, parce que le manuel les nomme comme des **familles** et
non comme des objets. Le projet les incarne en un objet unique ; leur clé est forgée, en
anglais comme les autres.

| clé | nom | ce que le manuel désigne |
|---|---|---|
| `ammunition` | Munitions | flèches, carreaux, billes de fronde |
| `arcane-focus` | Focaliseur arcanique | orbe, bâton, baguette, cristal |
| `druidic-focus` | Focaliseur druidique | gui, baguette d'if, bâton de bois |
| `gaming-set` | Boîte de jeux | dés, cartes, échecs draconiques |
| `holy-symbol` | Symbole sacré | amulette, emblème, reliquaire |
| `musical-instrument` | Instrument de musique | luth, flûte, cornemuse, viole |

## Le poids d'un paquetage est `null`

Un paquetage ne pèse rien par lui-même : ce qui pèse, ce sont ses lignes de `contents`.
Six des sept paquetages y comptent déjà un `backpack` de 2,5 kg — le contenant est donc
une ligne de contenu comme une autre, et donner en plus un poids propre au paquetage le
compterait deux fois.

| paquetage | poids porté par son contenu |
|---|---|
| `entertainers-pack` | 29,25 kg |
| `explorers-pack` | 27,5 kg |
| `dungeoneer-pack` | 27,5 kg |
| `burglars-pack` | 21 kg |
| `diplomat-pack` | 18 kg |
| `priests-pack` | 14,5 kg |
| `scholars-pack` | 11 kg |

Aucun code ne somme les poids aujourd'hui. Le jour où l'encombrement sera calculé, il
additionnera l'inventaire résolu, et les paquetages n'y ajouteront rien de fantôme.

## Le seed fait foi

`back/src/scripts/seed-items.script.ts` retire de la base tout objet du manuel absent du
fichier (`pruneReferenceItems`). Sans ça, ce renommage aurait laissé 105 clés françaises
orphelines en base, invisibles et jamais référencées. Ce qu'une campagne a inventé
(`source: 'campaign'`) n'est jamais touché.
