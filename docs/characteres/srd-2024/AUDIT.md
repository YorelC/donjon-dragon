# Audit de divergence — projet vs SRD 5.2

Généré par `scripts/srd/audit.ts`. Ne pas éditer à la main.

## items

159 côté projet, 182 côté SRD, 54 appariés.

### Divergences (15)

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
| `robe` | weightInKg | 2 | 0.5 |

### Au projet, sans correspondance SRD (105)

| clé projet | nom | candidat SRD |
|---|---|---|
| `acide` | Acide | — |
| `antidote` | Antidote | spell-scroll-level-1 (Spell Scroll, Level 1) |
| `beaux-habits` | Beaux habits | cartographer-tools (Cartographer's Tools) |
| `belier-portable` | Bélier portable | ram-portable (Ram, Portable) |
| `billes` | Billes | — |
| `boite-amadou` | Boîte à amadou | — |
| `bougie` | Bougie | candle (Candle) |
| `bouteille-verre` | Bouteille, verre | — |
| `cadenas` | Cadenas | — |
| `carquois` | Carquois | — |
| `carte` | Carte | — |
| `chaine` | Chaîne | — |
| `chausse-trappes` | Chausse-trappes | — |
| `cloche` | Cloche | — |
| `coffre` | Coffre | hunting-trap (Hunting Trap) |
| `corde` | Corde | — |
| `couverture` | Couverture | — |
| `cruche` | Cruche | jug (Jug) |
| `eau-benite` | Eau bénite | — |
| `echelle` | Échelle | ladder (Ladder) |
| `encre` | Encre | ink (Ink) |
| `etui-cartes-ou-parchemins` | Étui à cartes ou à parchemins | — |
| `etui-pour-carreaux-arbalete` | Étui pour carreaux d’arbalète | — |
| `feu-gregeois` | Feu grégeois | antitoxin (Antitoxin) |
| `ficelle` | Ficelle | — |
| `filet` | Filet | net (Net) |
| `fiole` | Fiole | — |
| `flasque` | Flasque | flask (Flask) |
| `focaliseur-arcanique` | Focaliseur arcanique | — |
| `focaliseur-druidique` | Focaliseur druidique | — |
| `grappin` | Grappin | grappling-hook (Grappling Hook) |
| `grimoire` | Grimoire | spellbook (Spellbook) |
| `huile` | Huile | oil (Oil) |
| `lampe` | Lampe | — |
| `lanterne-capote` | Lanterne à capote | — |
| `lanterne-sourde` | Lanterne sourde | — |
| `livre` | Livre | — |
| `longue-vue` | Longue-vue | spyglass (Spyglass) |
| `loupe` | Loupe | — |
| `materiel-escalade` | Matériel d’escalade | — |
| `menottes` | Menottes | manacles (Manacles) |
| `miroir` | Miroir | mirror (Mirror) |
| `munitions` | Munitions | — |
| `outre-pleine` | Outre (pleine) | waterskin (Waterskin) |
| `palan` | Palan | — |
| `panier` | Panier | — |
| `papier` | Papier | paper (Paper) |
| `parchemin` | Parchemin | — |
| `parchemin-de-sort-1er-niveau` | Parchemin de sort (1er niveau) | spell-scroll-level-1 (Spell Scroll, Level 1) |
| `parchemin-de-sort-sort-mineur` | Parchemin de sort (sort mineur) | spell-scroll-cantrip (Spell Scroll, Cantrip) |
| `parfum` | Parfum | — |
| `pelle` | Pelle | — |
| `perche` | Perche | pole (Pole) |
| `pied-de-biche` | Pied-de-biche | — |
| `piege-machoires` | Piège à mâchoires | hunting-trap (Hunting Trap) |
| `pointes-en-fer` | Pointes en fer | — |
| `poison-standard` | Poison standard | — |
| `porte-plume` | Porte-plume | ink-pen (Ink Pen) |
| `pot-en-fer` | Pot en fer | pot-iron (Pot, Iron) |
| `potion-de-guerison` | Potion de guérison | potion-of-healing (Potion of Healing) |
| `sac` | Sac | — |
| `sac-de-couchage` | Sac de couchage | — |
| `sac-dos` | Sac à dos | — |
| `sacoche` | Sacoche | — |
| `sacoche-composantes` | Sacoche à composantes | — |
| `seau` | Seau | bucket (Bucket) |
| `sifflet` | Sifflet | signal-whistle (Signal Whistle) |
| `symbole-sacre` | Symbole sacré | — |
| `tente` | Tente | tent (Tent) |
| `tenue-de-voyage` | Tenue de voyage | grappling-hook (Grappling Hook) |
| `tonneau` | Tonneau | barrel (Barrel) |
| `torche` | Torche | — |
| `trousse-de-soins` | Trousse de soins | — |
| `paquetage-artiste` | Paquetage d’artiste | — |
| `paquetage-de-cambrioleur` | Paquetage de cambrioleur | — |
| `paquetage-de-diplomate` | Paquetage de diplomate | — |
| `paquetage-ecclesiastique` | Paquetage d’ecclésiastique | priests-pack (Priest's Pack) |
| `paquetage-erudit` | Paquetage d’érudit | scholars-pack (Scholar's Pack) |
| `paquetage-explorateur` | Paquetage d’explorateur | explorers-pack (Explorer's Pack) |
| `paquetage-exploration-souterraine` | Paquetage d’exploration souterraine | dungeoneer-pack (Dungeoneer's Pack) |
| `accessoires-de-deguisement` | Accessoires de déguisement | — |
| `boite-de-jeux` | Boîte de jeux | — |
| `instrument-de-musique` | Instrument de musique | — |
| `instruments-de-navigateur` | Instruments de navigateur | — |
| `materiel-alchimiste` | Matériel d'alchimiste | alchemists-supplies (Alchemist's Supplies) |
| `materiel-de-brasseur` | Matériel de brasseur | brewers-supplies (Brewer's Supplies) |
| `materiel-de-calligraphe` | Matériel de calligraphe | — |
| `materiel-de-contrefacon` | Matériel de contrefaçon | — |
| `materiel-de-peintre` | Matériel de peintre | — |
| `materiel-empoisonneur` | Matériel d'empoisonneur | — |
| `materiel-herboriste` | Matériel d'herboriste | — |
| `outils-de-bricoleur` | Outils de bricoleur | tinkers-tools (Tinker's Tools) |
| `outils-de-cartographe` | Outils de cartographe | cartographer-tools (Cartographer's Tools) |
| `outils-de-charpentier` | Outils de charpentier | carpenters-tools (Carpenter's Tools) |
| `outils-de-cordonnier` | Outils de cordonnier | — |
| `outils-de-forgeron` | Outils de forgeron | smiths-tools (Smith's Tools) |
| `outils-de-joaillier` | Outils de joaillier | — |
| `outils-de-macon` | Outils de maçon | masons-tools (Mason's Tools) |
| `outils-de-menuisier` | Outils de menuisier | — |
| `outils-de-potier` | Outils de potier | potters-tools (Potter's Tools) |
| `outils-de-souffleur-de-verre` | Outils de souffleur de verre | glassblowers-tools (Glassblower's Tools) |
| `outils-de-tanneur` | Outils de tanneur | — |
| `outils-de-tisserand` | Outils de tisserand | — |
| `outils-de-voleur` | Outils de voleur | — |
| `ustensiles-de-cuisinier` | Ustensiles de cuisinier | cooks-utensils (Cook's Utensils) |

### Au SRD, absents du projet (128)

| clé SRD | nom |
|---|---|
| `acid` | Acid |
| `alchemists-fire` | Alchemist's Fire |
| `alchemists-supplies` | Alchemist's Supplies |
| `amulet` | Amulet |
| `antitoxin` | Antitoxin |
| `arrows` | Arrows |
| `backpack` | Backpack |
| `bagpipes` | Bagpipes |
| `ball-bearings` | Ball bearings |
| `barrel` | Barrel |
| `basket` | Basket |
| `bedroll` | Bedroll |
| `bell` | Bell |
| `blanket` | Blanket |
| `block-and-tackle` | Block and tackle |
| `book` | Book |
| `bolts` | Bolts |
| `bottle-glass` | Bottle, Glass |
| `brewers-supplies` | Brewer's Supplies |
| `bucket` | Bucket |
| `bullets-firearm` | Bullets, Firearm |
| `bullets-sling` | Bullets, Sling |
| `burglars-pack` | Burglar's Pack |
| `calligraphers-supplies` | Calligrapher's Supplies |
| `caltrops` | Caltrops |
| `candle` | Candle |
| `carpenters-tools` | Carpenter's Tools |
| `cartographer-tools` | Cartographer's Tools |
| `case-crossbow-bolt` | Case, Crossbow Bolt |
| `case-map-or-scroll` | Case, Map or Scroll |
| `chain` | Chain |
| `chest` | Chest |
| `climbers-kit` | Climber's Kit |
| `clothes-fine` | Clothes, Fine |
| `clothes-travelers` | Clothes, Traveler's |
| `cobblers-tools` | Cobbler's Tools |
| `component-pouch` | Component Pouch |
| `cooks-utensils` | Cook's Utensils |
| `crowbar` | Crowbar |
| `crystal` | Crystal |
| `dice` | Dice |
| `diplomat-pack` | Diplomat's Pack |
| `disguise-kit` | Disguise Kit |
| `dragonchess` | Dragonchess |
| `drum` | Drum |
| `dulcimer` | Dulcimer |
| `dungeoneer-pack` | Dungeoneer's Pack |
| `emblem` | Emblem |
| `entertainers-pack` | Entertainer's Pack |
| `explorers-pack` | Explorer's Pack |
| `flask` | Flask |
| `flute` | Flute |
| `forgery-kit` | Forgery Kit |
| `glassblowers-tools` | Glassblower's Tools |
| `grappling-hook` | Grappling Hook |
| `healers-kit` | Healer's Kit |
| `herbalism-kit` | Herbalism Kit |
| `holy-water` | Holy Water |
| `horn` | Horn |
| `hunting-trap` | Hunting Trap |
| `ink` | Ink |
| `ink-pen` | Ink Pen |
| `jewelers-tools` | Jeweler's Tools |
| `jug` | Jug |
| `ladder` | Ladder |
| `lamp` | Lamp |
| `lantern-bullseye` | Lantern, Bullseye |
| `lantern-hooded` | Lantern, Hooded |
| `leatherworkers-tools` | Leatherworker's Tools |
| `lock` | Lock |
| `lute` | Lute |
| `lyre` | Lyre |
| `magnifying-glass` | Magnifying Glass |
| `manacles` | Manacles |
| `masons-tools` | Mason's Tools |
| `map` | Map |
| `mirror` | Mirror |
| `navigators-tools` | Navigator's Tools |
| `needles` | Needles |
| `net` | Net |
| `oil` | Oil |
| `orb` | Orb |
| `painters-supplies` | Painter's Supplies |
| `pan-flute` | Pan flute |
| `paper` | Paper |
| `parchment` | Parchment |
| `perfume` | Perfume |
| `poisoners-kit` | Poisoner's Kit |
| `playing-cards` | Playing Cards |
| `poison-basic` | Poison, Basic |
| `pole` | Pole |
| `pot-iron` | Pot, Iron |
| `potion-of-healing` | Potion of Healing |
| `potters-tools` | Potter's Tools |
| `pouch` | Pouch |
| `priests-pack` | Priest's Pack |
| `quiver` | Quiver |
| `ram-portable` | Ram, Portable |
| `reliquary` | Reliquary |
| `rod` | Rod |
| `rope` | Rope |
| `sack` | Sack |
| `scholars-pack` | Scholar's Pack |
| `shawm` | Shawm |
| `shovel` | Shovel |
| `signal-whistle` | Signal Whistle |
| `smiths-tools` | Smith's Tools |
| `spellbook` | Spellbook |
| `spell-scroll-cantrip` | Spell Scroll, Cantrip |
| `spell-scroll-level-1` | Spell Scroll, Level 1 |
| `spikes-iron` | Spikes, Iron |
| `sprig-of-mistletoe` | Sprig of Mistletoe |
| `spyglass` | Spyglass |
| `staff` | Staff |
| `string` | String |
| `tent` | Tent |
| `thieves-tools` | Thieves' Tools |
| `three-dragon-ante` | Three-Dragon Ante |
| `tinderbox` | Tinderbox |
| `tinkers-tools` | Tinker's Tools |
| `torch` | Torch |
| `vial` | Vial |
| `viol` | Viol |
| `wand` | Wand |
| `waterskin` | Waterskin |
| `weavers-tools` | Weaver's Tools |
| `woodcarvers-tools` | Woodcarver's Tools |
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
