# Audit de divergence — projet vs SRD 5.2

Généré par `scripts/srd/audit.ts`. Ne pas éditer à la main.

## items

159 côté projet, 182 côté SRD, 153 appariés.

### Divergences (40)

| clé | champ | projet | SRD |
|---|---|---|---|
| `dart` | costInCopper | 5 | 500 |
| `hand-crossbow` | costInCopper | 7500 | 2500 |
| `hand-crossbow` | weightInKg | 1.5 | 1 |
| `javelin` | costInCopper | 50 | 500 |
| `longbow` | costInCopper | 5000 | 500 |
| `mace` | weightInKg | 2 | 1 |
| `pike` | weightInKg | 9 | 3 |
| `sling` | weapon.damageType | bludgeoning | piercing |
| `spear` | costInCopper | 100 | 500 |
| `spear` | weightInKg | 1.5 | 1 |
| `trident` | weapon.damageDice | 1d8 | 1d6 |
| `trident` | weapon.versatileDice | 1d10 | 1d8 |
| `chain-shirt` | weightInKg | 10 | 7 |
| `hide` | armor.training | medium | light |
| `antitoxin` | weightInKg | — | 0.5 |
| `clothes-fine` | weightInKg | 3 | 1.5 |
| `chain` | weightInKg | 5 | 3 |
| `caltrops` | costInCopper | 100 | 200 |
| `bell` | weightInKg | — | 0.5 |
| `chest` | costInCopper | 500 | 5000 |
| `chest` | weightInKg | 12.5 | 10 |
| `blanket` | costInCopper | 50 | 500 |
| `alchemists-fire` | costInCopper | 5000 | 2500 |
| `climbers-kit` | weightInKg | 6 | 4 |
| `basket` | costInCopper | 40 | 200 |
| `parchment` | costInCopper | 10 | 300 |
| `spikes-iron` | weightInKg | 2.5 | 1 |
| `robe` | weightInKg | 2 | 0.5 |
| `sack` | weightInKg | 0.25 | 0.5 |
| `bedroll` | costInCopper | 100 | 200 |
| `bedroll` | weightInKg | 3.5 | 12.5 |
| `component-pouch` | costInCopper | 2500 | 200 |
| `component-pouch` | weightInKg | 1 | 0.5 |
| `clothes-travelers` | costInCopper | 200 | 500 |
| `entertainers-pack` | type | pack | gear |
| `entertainers-pack` | weightInKg | 29 | — |
| `burglars-pack` | weightInKg | 21 | 10 |
| `diplomat-pack` | weightInKg | 19.5 | 10 |
| `explorers-pack` | type | pack | gear |
| `poisoners-kit` | costInCopper | 5000 | 500 |

### Au projet, sans correspondance SRD (6)

| clé projet | nom | candidat SRD |
|---|---|---|
| `arcane-focus` | Focaliseur arcanique | — |
| `druidic-focus` | Focaliseur druidique | — |
| `ammunition` | Munitions | — |
| `holy-symbol` | Symbole sacré | — |
| `gaming-set` | Boîte de jeux | — |
| `musical-instrument` | Instrument de musique | — |

### Au SRD, absents du projet (29)

| clé SRD | nom |
|---|---|
| `amulet` | Amulet |
| `arrows` | Arrows |
| `bagpipes` | Bagpipes |
| `bolts` | Bolts |
| `bullets-firearm` | Bullets, Firearm |
| `bullets-sling` | Bullets, Sling |
| `crystal` | Crystal |
| `dice` | Dice |
| `dragonchess` | Dragonchess |
| `drum` | Drum |
| `dulcimer` | Dulcimer |
| `emblem` | Emblem |
| `flute` | Flute |
| `horn` | Horn |
| `lute` | Lute |
| `lyre` | Lyre |
| `needles` | Needles |
| `orb` | Orb |
| `pan-flute` | Pan flute |
| `playing-cards` | Playing Cards |
| `reliquary` | Reliquary |
| `rod` | Rod |
| `shawm` | Shawm |
| `sprig-of-mistletoe` | Sprig of Mistletoe |
| `staff` | Staff |
| `three-dragon-ante` | Three-Dragon Ante |
| `viol` | Viol |
| `wand` | Wand |
| `yew-wand` | Yew Wand |

## species

9 côté projet, 9 côté SRD, 9 appariés.

### Divergences (1)

| clé | champ | projet | SRD |
|---|---|---|---|
| `tiefling` | size | Medium | — |

### Au projet, sans correspondance SRD

Aucun.

### Au SRD, absents du projet

Aucun.

## classes

12 côté projet, 12 côté SRD, 12 appariés.

### Divergences (4)

| clé | champ | projet | SRD |
|---|---|---|---|
| `fighter` | skillChoice.options | ["acrobatics","animalHandling","athletics","history","insight","intimidation","perception","persuasion","survival"] | ["acrobatics","animalHandling","athletics","history","insight","intimidation","perception","survival"] |
| `monk` | weaponProficiencies | ["simple","martialLight"] | ["simple"] |
| `rogue` | weaponProficiencies | ["simple","martialFinesseOrLight"] | ["simple"] |
| `wizard` | skillChoice.options | ["arcana","history","insight","investigation","medicine","nature","religion"] | ["arcana","history","insight","investigation","medicine","religion"] |

### Au projet, sans correspondance SRD

Aucun.

### Au SRD, absents du projet

Aucun.
