# B08 — Registre des monstres et profils de créatures

## Statut

**REGISTRE VALIDÉ PAR LE PROPRIÉTAIRE LE 20 AOÛT 2026.**

Ce registre accompagne la [matrice B08](B08-MONSTERS-NPCS-AND-SUMMONED-CREATURES.md).
Il inventorie les identités et la qualité des données sans reproduire les textes
descriptifs ou mécaniques des ouvrages.

## Références de données

- [Monster Manual 2025 dans 5e.tools](https://5e.tools/book.html#xmm,1),
  référence désignée par le propriétaire ;
- [release 5e.tools v2.33.3](https://github.com/5etools-mirror-3/5etools-src/releases/tag/v2.33.3),
  version figée contrôlée le 20 août 2026 ;
- [profils XMM v2.33.3](https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/v2.33.3/data/bestiary/bestiary-xmm.json),
  1 276 203 octets, SHA-256
  `f798d3294092ea9bd7b1e081b68e3c1d514c12f14d1b6817a1d9f6f9dd591b47` ;
- [descriptions et illustrations XMM v2.33.3](https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/v2.33.3/data/bestiary/fluff-bestiary-xmm.json) ;
- [groupes légendaires v2.33.3](https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/v2.33.3/data/bestiary/legendarygroups.json) ;
- [errata officiel MM v1](https://media.dndbeyond.com/compendium-images/errata/MM-25/MM-2025_v1.pdf),
  prioritaire en cas de contradiction.

5e.tools est une référence tierce et versionnée, pas une publication officielle de
Wizards of the Coast. La décision du propriétaire autorise son emploi comme source de
contrôle et de reprise des données pour B08. Les règles PHB/DMG locales et les errata
officiels restent prioritaires.

## Synthèse contrôlée

| Périmètre | Total | Qualification |
|---|---:|---|
| Profils XMM uniques | 503 | Inventaire complet de la release |
| Profils XMM avec empreinte locale concordante | 496 | 408 intacts, 88 tronqués |
| Profils XMM présents mais divergents | 2 | Blink Dog ; Faerie Dragon Adult |
| Profils XMM absents localement | 5 | Les cinq Modrons |
| Profils locaux avec règle vide ou réduite à son titre | 89 | 88 concordants + Faerie Dragon Adult |
| Profils PHB paramétrés | 15 | Présents mais non exécutables |
| Entrées descriptives XMM | 588 | Référence externe, non recopiée |
| Groupes légendaires XMM | 23 | Repaires et effets régionaux disponibles |

Le rapprochement local emploie en premier le nom anglais conservé dans le champ
`source`, puis une empreinte composée des PV, dés de vie, six caractéristiques,
Perception passive et FP. Les homonymies mécaniques ont été levées par la clé locale.

## Légende des états locaux

- `PRÉSENT` : identité et empreinte scalaire concordantes ; le texte reste non
  exécutable ;
- `TRONQUÉ` : au moins une description locale est vide ou identique à son titre ;
- `DIVERGENT` : une valeur scalaire locale diffère de la source XMM ;
- `DIVERGENT + TRONQUÉ` : les deux anomalies se cumulent ;
- `ABSENT` : aucune identité locale ne correspond ;
- `PARAMÉTRÉ NON EXÉCUTABLE` : profil PHB présent sans formules calculables.

## Profils XMM

| # | Profil | Page | FP | Clé locale | État local | Errata |
|---:|---|---:|---:|---|---|---|
| 1 | Aarakocra Aeromancer | 10 | 4 | aarakocre-aeromancien | PRÉSENT | — |
| 2 | Aarakocra Skirmisher | 10 | 1/4 | aarakocre-tirailleur | PRÉSENT | — |
| 3 | Aberrant Cultist | 86 | 8 | cultiste-d-aberration | PRÉSENT | — |
| 4 | Aboleth | 12 | 10 | aboleth | PRÉSENT | — |
| 5 | Abominable Yeti | 340 | 9 | yeti-abominable | PRÉSENT | — |
| 6 | Adult Black Dragon | 39 | 14 | dragon-noir-adulte | PRÉSENT | — |
| 7 | Adult Blue Dragon | 49 | 16 | dragon-bleu-adulte | TRONQUÉ | — |
| 8 | Adult Brass Dragon | 55 | 13 | dragon-d-airain-adulte | TRONQUÉ | — |
| 9 | Adult Bronze Dragon | 59 | 15 | dragon-de-bronze-adulte | PRÉSENT | — |
| 10 | Adult Copper Dragon | 79 | 14 | dragon-de-cuivre-adulte | PRÉSENT | — |
| 11 | Adult Gold Dragon | 145 | 17 | dragon-d-or-adulte | PRÉSENT | — |
| 12 | Adult Green Dragon | 153 | 15 | dragon-vert-adulte | PRÉSENT | — |
| 13 | Adult Red Dragon | 255 | 17 | dragon-rouge-adulte | TRONQUÉ | — |
| 14 | Adult Silver Dragon | 279 | 16 | dragon-d-argent-adulte | PRÉSENT | — |
| 15 | Adult White Dragon | 329 | 13 | dragon-blanc-adulte | PRÉSENT | — |
| 16 | Air Elemental | 13 | 5 | elementaire-de-l-air | PRÉSENT | — |
| 17 | Allosaurus | 348 | 2 | allosaure | PRÉSENT | — |
| 18 | Ancient Black Dragon | 40 | 21 | dragon-noir-ancien | PRÉSENT | — |
| 19 | Ancient Blue Dragon | 50 | 23 | dragon-bleu-ancien | PRÉSENT | — |
| 20 | Ancient Brass Dragon | 56 | 20 | dragon-d-airain-ancien | PRÉSENT | — |
| 21 | Ancient Bronze Dragon | 60 | 22 | dragon-de-bronze-ancien | PRÉSENT | — |
| 22 | Ancient Copper Dragon | 80 | 21 | dragon-de-cuivre-ancien | PRÉSENT | — |
| 23 | Ancient Gold Dragon | 146 | 24 | dragon-d-or-ancien | PRÉSENT | — |
| 24 | Ancient Green Dragon | 154 | 22 | dragon-vert-ancien | PRÉSENT | — |
| 25 | Ancient Red Dragon | 256 | 24 | dragon-rouge-ancien | PRÉSENT | MM v1 |
| 26 | Ancient Silver Dragon | 280 | 23 | dragon-d-argent-ancien | PRÉSENT | — |
| 27 | Ancient White Dragon | 330 | 20 | dragon-blanc-ancien | PRÉSENT | MM v1 |
| 28 | Animal Lord | 15 | 20 | seigneur-des-betes | TRONQUÉ | — |
| 29 | Animated Armor | 16 | 1 | armure-animee | PRÉSENT | — |
| 30 | Animated Broom | 16 | 1/4 | balai-anime | PRÉSENT | — |
| 31 | Animated Flying Sword | 17 | 1/4 | epee-volante-animee | PRÉSENT | — |
| 32 | Animated Rug of Smothering | 17 | 2 | tapis-etrangleur-anime | PRÉSENT | — |
| 33 | Ankheg | 18 | 2 | ankheg | PRÉSENT | — |
| 34 | Ankylosaurus | 348 | 3 | ankylosaure | PRÉSENT | — |
| 35 | Ape | 348 | 1/2 | grand-singe | TRONQUÉ | — |
| 36 | Arcanaloth | 19 | 12 | arcanaloth | PRÉSENT | MM v1 |
| 37 | Arch-hag | 21 | 21 | archi-guenaude | PRÉSENT | — |
| 38 | Archelon | 349 | 4 | archelon | PRÉSENT | — |
| 39 | Archmage | 199 | 12 | archimage | PRÉSENT | — |
| 40 | Archpriest | 248 | 12 | archipretre | PRÉSENT | — |
| 41 | Assassin | 22 | 8 | assassin | PRÉSENT | — |
| 42 | Awakened Shrub | 23 | 0 | arbuste-eveille | PRÉSENT | — |
| 43 | Awakened Tree | 23 | 2 | arbre-eveille | PRÉSENT | — |
| 44 | Axe Beak | 24 | 1/4 | bec-de-hache-autrache | PRÉSENT | — |
| 45 | Azer Pyromancer | 25 | 6 | azer-pyromancien | PRÉSENT | — |
| 46 | Azer Sentinel | 25 | 2 | azer-sentinelle | PRÉSENT | — |
| 47 | Baboon | 349 | 0 | babouin | PRÉSENT | — |
| 48 | Badger | 349 | 0 | blaireau | PRÉSENT | — |
| 49 | Balor | 26 | 19 | balor | PRÉSENT | MM v1 |
| 50 | Bandit | 27 | 1/8 | bandit | PRÉSENT | — |
| 51 | Bandit Captain | 27 | 2 | bandit-capitaine | PRÉSENT | — |
| 52 | Bandit Crime Lord | 28 | 11 | bandit-baron-du-crime | PRÉSENT | — |
| 53 | Bandit Deceiver | 28 | 7 | bandit-embrouilleur | PRÉSENT | — |
| 54 | Banshee | 29 | 4 | banshie | PRÉSENT | — |
| 55 | Barbed Devil | 30 | 5 | diable-barbele | PRÉSENT | — |
| 56 | Barlgura | 31 | 5 | barlgura | PRÉSENT | — |
| 57 | Basilisk | 32 | 3 | basilic | PRÉSENT | — |
| 58 | Bat | 349 | 0 | chauve-souris | PRÉSENT | — |
| 59 | Bearded Devil | 33 | 3 | diable-barbu | PRÉSENT | — |
| 60 | Behir | 34 | 11 | behir | PRÉSENT | — |
| 61 | Beholder | 36 | 13 | tyrannoeil | TRONQUÉ | — |
| 62 | Beholder Zombie | 347 | 5 | tyrannoeil-zombi | PRÉSENT | — |
| 63 | Berserker | 37 | 2 | berserker | PRÉSENT | — |
| 64 | Berserker Commander | 37 | 8 | berserker-chef | PRÉSENT | — |
| 65 | Black Bear | 349 | 1/2 | ours-noir | PRÉSENT | — |
| 66 | Black Dragon Wyrmling | 38 | 2 | dragon-noir-dragonnet | PRÉSENT | — |
| 67 | Black Pudding | 42 | 4 | pouding-noir | PRÉSENT | — |
| 68 | Blink Dog | 46 | 1/4 | chien-esquiveur | DIVERGENT — PV/dés de vie | — |
| 69 | Blob of Annihilation | 47 | 23 | blob-d-annihilation | PRÉSENT | — |
| 70 | Blood Hawk | 350 | 1/8 | faucon-de-sang | PRÉSENT | — |
| 71 | Blue Dragon Wyrmling | 48 | 3 | dragon-bleu-dragonnet | PRÉSENT | — |
| 72 | Blue Slaad | 285 | 7 | slaad-bleu | PRÉSENT | — |
| 73 | Boar | 350 | 1/4 | sanglier | PRÉSENT | — |
| 74 | Bone Devil | 52 | 9 | diable-osseux | PRÉSENT | — |
| 75 | Bone Naga | 53 | 4 | naga-osseux | PRÉSENT | — |
| 76 | Brass Dragon Wyrmling | 54 | 1 | dragon-d-airain-dragonnet | PRÉSENT | — |
| 77 | Brazen Gorgon | 149 | 9 | gorgone-ardente | PRÉSENT | — |
| 78 | Bronze Dragon Wyrmling | 58 | 2 | dragon-de-bronze-dragonnet | PRÉSENT | — |
| 79 | Brown Bear | 350 | 1 | ours-brun | PRÉSENT | — |
| 80 | Bugbear Stalker | 62 | 3 | gobelours-traqueur | PRÉSENT | — |
| 81 | Bugbear Warrior | 62 | 1 | gobelours-combattant | PRÉSENT | — |
| 82 | Bulette | 63 | 5 | bulette | PRÉSENT | — |
| 83 | Bulette Pup | 63 | 2 | bulettiot | PRÉSENT | — |
| 84 | Bullywug Bog Sage | 64 | 4 | brutacien-sage-du-marais | PRÉSENT | — |
| 85 | Bullywug Warrior | 64 | 1/4 | brutacien-combattant | PRÉSENT | — |
| 86 | Cambion | 65 | 5 | cambion | PRÉSENT | — |
| 87 | Camel | 351 | 1/8 | chameau | PRÉSENT | — |
| 88 | Carrion Crawler | 66 | 2 | charognard-rampant | PRÉSENT | MM v1 |
| 89 | Cat | 351 | 0 | chat | PRÉSENT | — |
| 90 | Centaur Trooper | 67 | 2 | centaure-soldat | PRÉSENT | — |
| 91 | Centaur Warden | 67 | 7 | centaure-gardien | PRÉSENT | — |
| 92 | Chain Devil | 68 | 8 | diable-des-chaines | PRÉSENT | — |
| 93 | Chasme | 69 | 6 | chasme | PRÉSENT | — |
| 94 | Chimera | 70 | 6 | chimere | PRÉSENT | — |
| 95 | Chuul | 71 | 4 | chuul | PRÉSENT | — |
| 96 | Clay Golem | 72 | 9 | golem-d-argile | PRÉSENT | — |
| 97 | Cloaker | 73 | 8 | manteleur | TRONQUÉ | MM v1 |
| 98 | Cloud Giant | 74 | 9 | geant-des-nuages | PRÉSENT | — |
| 99 | Cockatrice | 75 | 1/2 | cockatrice | PRÉSENT | — |
| 100 | Cockatrice Regent | 75 | 8 | cockatrice-souveraine | TRONQUÉ | — |
| 101 | Colossus | 76 | 25 | colosse | TRONQUÉ | — |
| 102 | Commoner | 77 | 0 | roturier | PRÉSENT | — |
| 103 | Constrictor Snake | 351 | 1/4 | serpent-constricteur | PRÉSENT | — |
| 104 | Copper Dragon Wyrmling | 78 | 1 | dragon-de-cuivre-dragonnet | PRÉSENT | — |
| 105 | Couatl | 82 | 4 | couatl | PRÉSENT | — |
| 106 | Crab | 351 | 0 | crabe | PRÉSENT | — |
| 107 | Crawling Claw | 83 | 0 | griffe-rampante-senestre | PRÉSENT | — |
| 108 | Crocodile | 352 | 1/2 | crocodile | PRÉSENT | — |
| 109 | Cultist | 84 | 1/8 | cultiste-sectateur | PRÉSENT | — |
| 110 | Cultist Fanatic | 85 | 2 | cultiste-fanatique | PRÉSENT | — |
| 111 | Cultist Hierophant | 85 | 10 | cultiste-hierophante | PRÉSENT | MM v1 |
| 112 | Cyclops Oracle | 88 | 10 | cyclope-oracle | TRONQUÉ | — |
| 113 | Cyclops Sentry | 88 | 6 | cyclope-sentinelle | PRÉSENT | MM v1 |
| 114 | Dao | 89 | 11 | dao | TRONQUÉ | — |
| 115 | Darkmantle | 90 | 1/2 | mante-obscure | PRÉSENT | — |
| 116 | Death Cultist | 86 | 8 | cultiste-funeste | PRÉSENT | — |
| 117 | Death Dog | 91 | 1 | chien-du-trepas | PRÉSENT | — |
| 118 | Death Knight | 92 | 17 | chevalier-de-la-mort | PRÉSENT | MM v1 |
| 119 | Death Knight Aspirant | 93 | 11 | chevalier-de-la-mort-aspirant | PRÉSENT | MM v1 |
| 120 | Death Slaad | 287 | 10 | slaad-funeste | PRÉSENT | — |
| 121 | Death Tyrant | 95 | 14 | tyramort | TRONQUÉ | — |
| 122 | Deer | 352 | 0 | cerf-petit-cervide | PRÉSENT | — |
| 123 | Demilich | 96 | 18 | demi-liche | PRÉSENT | — |
| 124 | Deva | 97 | 10 | deva | PRÉSENT | — |
| 125 | Dire Wolf | 352 | 1 | loup-sanguinaire | PRÉSENT | — |
| 126 | Dire Worg | 335 | 10 | worg-sanguinaire | PRÉSENT | — |
| 127 | Displacer Beast | 98 | 3 | bete-eclipsante | PRÉSENT | — |
| 128 | Djinni | 99 | 11 | djinn | PRÉSENT | — |
| 129 | Doppelganger | 100 | 3 | doppelganger | PRÉSENT | — |
| 130 | Dracolich | 102 | 17 | dracoliche | TRONQUÉ | — |
| 131 | Draft Horse | 352 | 1/4 | cheval-de-trait | PRÉSENT | — |
| 132 | Dragon Turtle | 103 | 17 | dragon-tortue | PRÉSENT | — |
| 133 | Dretch | 103 | 1/4 | dretch | PRÉSENT | — |
| 134 | Drider | 105 | 6 | drider | PRÉSENT | — |
| 135 | Druid | 106 | 2 | druide | PRÉSENT | — |
| 136 | Dryad | 107 | 1 | dryade | PRÉSENT | — |
| 137 | Dust Mephit | 206 | 1/2 | mephite-poussiereux | TRONQUÉ | — |
| 138 | Eagle | 353 | 0 | aigle | PRÉSENT | — |
| 139 | Earth Elemental | 108 | 5 | elementaire-de-la-terre | PRÉSENT | — |
| 140 | Efreeti | 109 | 11 | efrit | PRÉSENT | — |
| 141 | Elemental Cataclysm | 111 | 22 | cataclysme-elementaire | PRÉSENT | — |
| 142 | Elemental Cultist | 87 | 8 | cultiste-d-elementaire | PRÉSENT | — |
| 143 | Elephant | 353 | 4 | elephant | PRÉSENT | — |
| 144 | Elk | 353 | 1/4 | elan-grand-cervide | PRÉSENT | — |
| 145 | Empyrean | 113 | 23 | empyreen | TRONQUÉ | — |
| 146 | Empyrean Iota | 112 | 1 | empyreen-iota | TRONQUÉ | — |
| 147 | Erinyes | 114 | 12 | erinye | PRÉSENT | — |
| 148 | Ettercap | 115 | 2 | ettercap | PRÉSENT | — |
| 149 | Ettin | 116 | 4 | ettin | PRÉSENT | — |
| 150 | Faerie Dragon Adult | 117 | 2 | dragon-feerique-adulte | DIVERGENT + TRONQUÉ — INT/CHA et 5 règles | — |
| 151 | Faerie Dragon Youth | 117 | 1 | dragon-feerique-juvenile | TRONQUÉ | — |
| 152 | Fiend Cultist | 87 | 8 | cultiste-de-fielon | PRÉSENT | — |
| 153 | Fire Elemental | 118 | 5 | elementaire-du-feu | PRÉSENT | — |
| 154 | Fire Giant | 119 | 9 | geant-du-feu | PRÉSENT | — |
| 155 | Flameskull | 120 | 4 | cranefeu | PRÉSENT | — |
| 156 | Flaming Skeleton | 283 | 3 | squelette-enflamme | PRÉSENT | — |
| 157 | Flesh Golem | 121 | 5 | golem-de-chair | PRÉSENT | — |
| 158 | Flumph | 122 | 1/8 | flumph | PRÉSENT | — |
| 159 | Flying Snake | 353 | 1/8 | serpent-volant | PRÉSENT | — |
| 160 | Fomorian | 123 | 8 | fomoire | PRÉSENT | MM v1 |
| 161 | Frog | 354 | 0 | grenouille | PRÉSENT | — |
| 162 | Frost Giant | 124 | 8 | geant-du-givre | PRÉSENT | — |
| 163 | Galeb Duhr | 127 | 6 | galeb-duhr | PRÉSENT | MM v1 |
| 164 | Gargoyle | 128 | 2 | gargouille | PRÉSENT | — |
| 165 | Gas Spore Fungus | 125 | 1/2 | thallophyte-spore-gazeuse | PRÉSENT | — |
| 166 | Gelatinous Cube | 129 | 2 | cube-gelatineux | PRÉSENT | — |
| 167 | Ghast | 130 | 2 | bleme | PRÉSENT | — |
| 168 | Ghast Gravecaller | 130 | 6 | bleme-fossoyeuse | PRÉSENT | — |
| 169 | Ghost | 131 | 4 | fantome | PRÉSENT | — |
| 170 | Ghoul | 132 | 1 | goule | TRONQUÉ | — |
| 171 | Giant Ape | 354 | 7 | singe-geant | PRÉSENT | — |
| 172 | Giant Axe Beak | 24 | 5 | bec-de-hache-geant-autrache-geante | PRÉSENT | — |
| 173 | Giant Badger | 354 | 1/4 | blaireau-geant | PRÉSENT | — |
| 174 | Giant Bat | 355 | 1/4 | chauve-souris-geante | PRÉSENT | — |
| 175 | Giant Boar | 355 | 2 | sanglier-geant | PRÉSENT | — |
| 176 | Giant Centipede | 355 | 1/4 | mille-pattes-geant | PRÉSENT | — |
| 177 | Giant Constrictor Snake | 355 | 2 | serpent-constricteur-geant | PRÉSENT | — |
| 178 | Giant Crab | 356 | 1/8 | crabe-geant | PRÉSENT | — |
| 179 | Giant Crocodile | 356 | 5 | crocodile-geant | PRÉSENT | — |
| 180 | Giant Eagle | 356 | 1 | aigle-geant | PRÉSENT | — |
| 181 | Giant Elk | 356 | 2 | elan-geant-cervide-geant | PRÉSENT | — |
| 182 | Giant Fire Beetle | 357 | 0 | scarabee-de-feu-geant | PRÉSENT | — |
| 183 | Giant Frog | 357 | 1/4 | grenouille-geante | TRONQUÉ | MM v1 |
| 184 | Giant Goat | 357 | 1/2 | chevre-geante | PRÉSENT | — |
| 185 | Giant Hyena | 357 | 1 | hyene-geante | PRÉSENT | — |
| 186 | Giant Lizard | 358 | 1/4 | lezard-geant | PRÉSENT | — |
| 187 | Giant Octopus | 358 | 1 | pieuvre-geante | PRÉSENT | — |
| 188 | Giant Owl | 358 | 1/4 | chouette-geante | PRÉSENT | — |
| 189 | Giant Rat | 358 | 1/8 | rat-geant | PRÉSENT | — |
| 190 | Giant Scorpion | 359 | 3 | scorpion-geant | PRÉSENT | — |
| 191 | Giant Seahorse | 359 | 1/2 | hippocampe-geant | PRÉSENT | — |
| 192 | Giant Shark | 359 | 5 | requin-geant | PRÉSENT | — |
| 193 | Giant Spider | 359 | 1 | araignee-geante | PRÉSENT | — |
| 194 | Giant Squid | 360 | 6 | calamar-geant | PRÉSENT | — |
| 195 | Giant Toad | 360 | 1 | crapaud-geant | PRÉSENT | — |
| 196 | Giant Venomous Snake | 361 | 1/4 | serpent-venimeux-geant | PRÉSENT | — |
| 197 | Giant Vulture | 361 | 1 | vautour-geant | PRÉSENT | — |
| 198 | Giant Wasp | 361 | 1/2 | guepe-geante | PRÉSENT | — |
| 199 | Giant Weasel | 361 | 1/8 | belette-geante | PRÉSENT | — |
| 200 | Giant Wolf Spider | 362 | 1/4 | araignee-loup-geante | PRÉSENT | — |
| 201 | Gibbering Mouther | 133 | 2 | babelien | PRÉSENT | — |
| 202 | Githyanki Dracomancer | 135 | 16 | githyanki-dracomancien | TRONQUÉ | — |
| 203 | Githyanki Knight | 135 | 8 | githyanki-chevalier | TRONQUÉ | — |
| 204 | Githyanki Warrior | 134 | 3 | githyanki-combattant | TRONQUÉ | MM v1 |
| 205 | Githzerai Monk | 136 | 2 | githzerai-moine | TRONQUÉ | — |
| 206 | Githzerai Psion | 137 | 12 | githzerai-psion | TRONQUÉ | — |
| 207 | Githzerai Zerth | 137 | 6 | githzerai-zerth | TRONQUÉ | — |
| 208 | Glabrezu | 138 | 9 | glabrezu | PRÉSENT | — |
| 209 | Gladiator | 139 | 5 | gladiateur | PRÉSENT | — |
| 210 | Gnoll Demoniac | 141 | 8 | gnoll-demoniaque | PRÉSENT | — |
| 211 | Gnoll Fang of Yeenoghu | 141 | 4 | gnoll-croc-de-yeenoghu | PRÉSENT | — |
| 212 | Gnoll Pack Lord | 140 | 2 | gnoll-chef-de-meute | PRÉSENT | — |
| 213 | Gnoll Warrior | 140 | 1/2 | gnoll-combattant | PRÉSENT | — |
| 214 | Goat | 362 | 0 | chevre | PRÉSENT | — |
| 215 | Goblin Boss | 143 | 1 | gobelin-chef | PRÉSENT | MM v1 |
| 216 | Goblin Hexer | 143 | 3 | gobelin-maleficeur | PRÉSENT | — |
| 217 | Goblin Minion | 142 | 1/8 | gobelin-sbire | PRÉSENT | — |
| 218 | Goblin Warrior | 142 | 1/4 | gobelin-combattant | PRÉSENT | — |
| 219 | Gold Dragon Wyrmling | 144 | 3 | dragon-d-or-dragonnet | PRÉSENT | — |
| 220 | Gorgon | 148 | 5 | gorgone | PRÉSENT | — |
| 221 | Goristro | 150 | 17 | goristro | PRÉSENT | — |
| 222 | Graveyard Revenant | 260 | 7 | revenant-charnier | TRONQUÉ | — |
| 223 | Gray Ooze | 151 | 1/2 | vase-grise | PRÉSENT | — |
| 224 | Gray Slaad | 286 | 9 | slaad-gris | PRÉSENT | — |
| 225 | Green Dragon Wyrmling | 152 | 2 | dragon-vert-dragonnet | PRÉSENT | — |
| 226 | Green Hag | 156 | 3 | guenaude-verte | TRONQUÉ | — |
| 227 | Green Slaad | 286 | 8 | slaad-vert | PRÉSENT | MM v1 |
| 228 | Grell | 157 | 3 | grell | TRONQUÉ | — |
| 229 | Grick | 158 | 2 | grick | TRONQUÉ | — |
| 230 | Grick Ancient | 158 | 7 | grick-venerable | TRONQUÉ | — |
| 231 | Griffon | 159 | 2 | griffon | TRONQUÉ | — |
| 232 | Grimlock | 160 | 1/4 | torve | PRÉSENT | — |
| 233 | Guard | 162 | 1/8 | garde | PRÉSENT | — |
| 234 | Guard Captain | 162 | 4 | garde-capitaine | PRÉSENT | — |
| 235 | Guardian Naga | 161 | 10 | naga-gardien | PRÉSENT | — |
| 236 | Gulthias Blight | 45 | 16 | rouilleux-de-gulthias | PRÉSENT | — |
| 237 | Half-Dragon | 163 | 5 | demi-dragon | PRÉSENT | — |
| 238 | Harpy | 164 | 1 | harpie | PRÉSENT | — |
| 239 | Haunting Revenant | 260 | 10 | revenant-tourmenteur | TRONQUÉ | — |
| 240 | Hawk | 362 | 0 | faucon | PRÉSENT | — |
| 241 | Hell Hound | 165 | 3 | molosse-infernal | TRONQUÉ | — |
| 242 | Helmed Horror | 166 | 4 | horreur-casquee | TRONQUÉ | — |
| 243 | Hezrou | 167 | 8 | hezrou | TRONQUÉ | — |
| 244 | Hill Giant | 168 | 5 | geant-des-collines | PRÉSENT | — |
| 245 | Hippogriff | 169 | 1 | hippogriffe | TRONQUÉ | — |
| 246 | Hippopotamus | 362 | 4 | hippopotame | TRONQUÉ | — |
| 247 | Hobgoblin Captain | 171 | 3 | hobgobelin-capitaine | TRONQUÉ | — |
| 248 | Hobgoblin Warlord | 171 | 6 | hobgobelin-seigneur-de-guerre | TRONQUÉ | — |
| 249 | Hobgoblin Warrior | 170 | 1/2 | hobgobelin-combattant | PRÉSENT | — |
| 250 | Homunculus | 172 | 0 | homoncule | PRÉSENT | — |
| 251 | Hook Horror | 173 | 3 | horreur-crochue | TRONQUÉ | — |
| 252 | Horned Devil | 174 | 11 | diable-cornu | PRÉSENT | — |
| 253 | Hunter Shark | 363 | 2 | requin-chasseur | PRÉSENT | — |
| 254 | Hydra | 175 | 8 | hydre | PRÉSENT | — |
| 255 | Hyena | 363 | 0 | hyene | PRÉSENT | — |
| 256 | Ice Devil | 176 | 14 | diable-gele | PRÉSENT | MM v1 |
| 257 | Ice Mephit | 206 | 1/2 | mephite-gele | TRONQUÉ | — |
| 258 | Imp | 177 | 1 | diablotin | PRÉSENT | — |
| 259 | Incubus | 178 | 4 | incube | TRONQUÉ | — |
| 260 | Intellect Devourer | 179 | 2 | devoreur-d-intellect | PRÉSENT | — |
| 261 | Invisible Stalker | 180 | 6 | traqueur-invisible | PRÉSENT | — |
| 262 | Iron Golem | 181 | 16 | golem-de-fer | PRÉSENT | — |
| 263 | Jackal | 364 | 0 | chacal | PRÉSENT | — |
| 264 | Jackalwere | 182 | 1/2 | garou-chacal | TRONQUÉ | — |
| 265 | Juvenile Shadow Dragon | 275 | 4 | dragon-d-ombre-immature | TRONQUÉ | — |
| 266 | Kenku | 183 | 1/4 | kenku | PRÉSENT | — |
| 267 | Killer Whale | 364 | 3 | epaulard | PRÉSENT | — |
| 268 | Knight | 184 | 3 | chevalier | PRÉSENT | — |
| 269 | Kobold Warrior | 185 | 1/8 | kobold-combattant | PRÉSENT | — |
| 270 | Kraken | 187 | 23 | kraken | TRONQUÉ | MM v1 |
| 271 | Kuo-toa | 189 | 1/4 | kuo-toa | PRÉSENT | — |
| 272 | Kuo-toa Archpriest | 191 | 6 | kuo-toa-archipretre | TRONQUÉ | — |
| 273 | Kuo-toa Monitor | 190 | 3 | kuo-toa-cornac | TRONQUÉ | — |
| 274 | Kuo-toa Whip | 190 | 1 | kuo-toa-fouet | TRONQUÉ | — |
| 275 | Lacedon Ghoul | 132 | 1 | goule-lacedone | TRONQUÉ | — |
| 276 | Lamia | 192 | 4 | lamie | TRONQUÉ | — |
| 277 | Larva | 193 | 0 | larve | PRÉSENT | — |
| 278 | Lemure | 194 | 0 | lemure | PRÉSENT | — |
| 279 | Lich | 196 | 21 | liche | TRONQUÉ | — |
| 280 | Lion | 364 | 1 | lion | TRONQUÉ | — |
| 281 | Lizard | 364 | 0 | lezard | PRÉSENT | — |
| 282 | Lizardfolk Geomancer | 197 | 2 | saurial-geomancien | PRÉSENT | — |
| 283 | Lizardfolk Sovereign | 197 | 4 | saurial-souverain | PRÉSENT | — |
| 284 | Mage | 199 | 6 | mage | TRONQUÉ | — |
| 285 | Mage Apprentice | 198 | 2 | mage-apprenti | PRÉSENT | — |
| 286 | Magma Mephit | 207 | 1/2 | mephite-magmatique | TRONQUÉ | — |
| 287 | Magmin | 200 | 1/2 | magmatique | TRONQUÉ | — |
| 288 | Mammoth | 365 | 6 | mammouth | TRONQUÉ | — |
| 289 | Manes | 201 | 1/8 | mane | PRÉSENT | — |
| 290 | Manes Vaporspawn | 201 | 1 | mane-vaporeux | TRONQUÉ | — |
| 291 | Manticore | 202 | 3 | manticore | TRONQUÉ | — |
| 292 | Marid | 203 | 11 | maride | TRONQUÉ | — |
| 293 | Marilith | 204 | 16 | marilith | TRONQUÉ | — |
| 294 | Mastiff | 365 | 1/8 | molosse | PRÉSENT | — |
| 295 | Medusa | 205 | 6 | meduse | TRONQUÉ | — |
| 296 | Merfolk Skirmisher | 209 | 1/8 | thalasseen-tirailleur | PRÉSENT | — |
| 297 | Merfolk Wavebender | 209 | 6 | thalasseen-dompteur-de-l-onde | PRÉSENT | — |
| 298 | Merrow | 210 | 2 | merrow | TRONQUÉ | — |
| 299 | Mezzoloth | 211 | 5 | mezzoloth | TRONQUÉ | — |
| 300 | Mimic | 212 | 2 | mimique | TRONQUÉ | — |
| 301 | Mind Flayer | 214 | 7 | flagelleur-mental | PRÉSENT | — |
| 302 | Mind Flayer Arcanist | 214 | 11 | flagelleur-mental-arcaniste | TRONQUÉ | — |
| 303 | Minotaur of Baphomet | 215 | 3 | minotaure-de-baphomet | PRÉSENT | — |
| 304 | Minotaur Skeleton | 283 | 2 | minotaure-squelette | PRÉSENT | — |
| 305 | Modron Duodrone | 217 | 1/4 | — | ABSENT | — |
| 306 | Modron Monodrone | 216 | 1/8 | — | ABSENT | — |
| 307 | Modron Pentadrone | 218 | 2 | — | ABSENT | — |
| 308 | Modron Quadrone | 218 | 1 | — | ABSENT | — |
| 309 | Modron Tridrone | 217 | 1/2 | — | ABSENT | — |
| 310 | Mud Mephit | 207 | 1/4 | mephite-boueux | TRONQUÉ | — |
| 311 | Mule | 365 | 1/8 | mule | PRÉSENT | — |
| 312 | Mummy | 219 | 3 | momie | TRONQUÉ | — |
| 313 | Mummy Lord | 221 | 15 | seigneur-momie-momie-auguste | TRONQUÉ | — |
| 314 | Myconid Adult | 223 | 1/2 | myconide-adulte | PRÉSENT | — |
| 315 | Myconid Sovereign | 223 | 2 | myconide-souverain | PRÉSENT | — |
| 316 | Myconid Spore Servant | 223 | 1 | myconide-serviteur-des-spores | PRÉSENT | — |
| 317 | Myconid Sprout | 222 | 0 | myconide-pousse | PRÉSENT | — |
| 318 | Nalfeshnee | 224 | 13 | nalfeshnie | PRÉSENT | — |
| 319 | Needle Blight | 43 | 1/4 | resineux | PRÉSENT | — |
| 320 | Night Hag | 225 | 5 | guenaude-nocturne | TRONQUÉ | — |
| 321 | Nightmare | 226 | 3 | horriflamme | PRÉSENT | — |
| 322 | Noble | 227 | 1/8 | noble | PRÉSENT | — |
| 323 | Noble Prodigy | 227 | 10 | noble-prodige | PRÉSENT | — |
| 324 | Nothic | 228 | 2 | nothic | PRÉSENT | — |
| 325 | Nycaloth | 229 | 9 | nycaloth | PRÉSENT | — |
| 326 | Ochre Jelly | 230 | 2 | gelee-ocre | PRÉSENT | — |
| 327 | Octopus | 365 | 0 | pieuvre | PRÉSENT | — |
| 328 | Ogre | 231 | 2 | ogre | PRÉSENT | — |
| 329 | Ogre Zombie | 346 | 2 | ogre-zombi | PRÉSENT | — |
| 330 | Ogrillon Ogre | 231 | 1 | ogrillon-ogre | PRÉSENT | — |
| 331 | Oni | 232 | 7 | oni | PRÉSENT | — |
| 332 | Otyugh | 233 | 5 | otyugh | PRÉSENT | — |
| 333 | Owl | 366 | 0 | chouette | PRÉSENT | — |
| 334 | Owlbear | 234 | 3 | ours-hibou-hibours | PRÉSENT | — |
| 335 | Panther | 366 | 1/4 | panthere | PRÉSENT | — |
| 336 | Pegasus | 235 | 2 | pegase | PRÉSENT | — |
| 337 | Performer | 236 | 1/2 | saltimbanque | PRÉSENT | — |
| 338 | Performer Legend | 237 | 10 | saltimbanque-legende | PRÉSENT | MM v1 |
| 339 | Performer Maestro | 237 | 6 | saltimbanque-maestro | PRÉSENT | MM v1 |
| 340 | Peryton | 238 | 2 | peryton | PRÉSENT | — |
| 341 | Phase Spider | 239 | 3 | araignee-de-phase | PRÉSENT | — |
| 342 | Piercer | 240 | 1/2 | perceur-perforateur | PRÉSENT | — |
| 343 | Piranha | 366 | 0 | piranha | PRÉSENT | — |
| 344 | Pirate | 241 | 1 | pirate | PRÉSENT | — |
| 345 | Pirate Admiral | 242 | 12 | pirate-amiral | PRÉSENT | — |
| 346 | Pirate Captain | 242 | 6 | pirate-capitaine | PRÉSENT | — |
| 347 | Pit Fiend | 243 | 20 | diantrefosse | PRÉSENT | — |
| 348 | Pixie | 244 | 1/4 | pixie | PRÉSENT | — |
| 349 | Pixie Wonderbringer | 244 | 5 | pixie-emerveilleuse | TRONQUÉ | — |
| 350 | Planetar | 245 | 16 | planetar | PRÉSENT | — |
| 351 | Plesiosaurus | 366 | 2 | plesiosaure | PRÉSENT | — |
| 352 | Polar Bear | 367 | 2 | ours-polaire | PRÉSENT | — |
| 353 | Poltergeist | 246 | 2 | poltergeist | PRÉSENT | — |
| 354 | Pony | 367 | 1/8 | poney | PRÉSENT | — |
| 355 | Priest | 248 | 2 | pretre | PRÉSENT | MM v1 |
| 356 | Priest Acolyte | 247 | 1/4 | pretre-acolyte | PRÉSENT | — |
| 357 | Primeval Owlbear | 234 | 7 | ours-hibou-primitif | TRONQUÉ | — |
| 358 | Pseudodragon | 249 | 1/4 | pseudodragon | PRÉSENT | MM v1 |
| 359 | Psychic Gray Ooze | 151 | 1 | vase-grise-psychique | TRONQUÉ | — |
| 360 | Pteranodon | 367 | 1/4 | pteranodon | PRÉSENT | — |
| 361 | Purple Worm | 250 | 15 | ver-pourpre | PRÉSENT | — |
| 362 | Quaggoth | 251 | 2 | quaggoth | PRÉSENT | — |
| 363 | Quaggoth Thonot | 251 | 3 | quaggoth-thonot | PRÉSENT | — |
| 364 | Quasit | 252 | 1 | quasit | PRÉSENT | — |
| 365 | Questing Knight | 184 | 12 | chevalier-errant | PRÉSENT | — |
| 366 | Rakshasa | 253 | 13 | rakshasa | PRÉSENT | — |
| 367 | Rat | 367 | 0 | rat | PRÉSENT | — |
| 368 | Raven | 368 | 0 | corbeau | PRÉSENT | — |
| 369 | Red Dragon Wyrmling | 254 | 4 | dragon-rouge-dragonnet | PRÉSENT | — |
| 370 | Red Slaad | 285 | 5 | slaad-rouge | PRÉSENT | — |
| 371 | Reef Shark | 368 | 1/2 | requin-de-recif | PRÉSENT | — |
| 372 | Remorhaz | 258 | 11 | remorhaz | PRÉSENT | — |
| 373 | Revenant | 259 | 5 | revenant | PRÉSENT | — |
| 374 | Rhinoceros | 368 | 2 | rhinoceros | PRÉSENT | — |
| 375 | Riding Horse | 368 | 1/4 | cheval-de-selle | PRÉSENT | — |
| 376 | Roc | 261 | 11 | rukh | PRÉSENT | — |
| 377 | Roper | 262 | 5 | enlaceur | PRÉSENT | — |
| 378 | Rust Monster | 263 | 1/2 | oxydeur | PRÉSENT | — |
| 379 | Saber-Toothed Tiger | 369 | 2 | tigre-a-dents-de-sabre | PRÉSENT | — |
| 380 | Sahuagin Baron | 265 | 5 | sahuagin-baron | PRÉSENT | — |
| 381 | Sahuagin Priest | 265 | 2 | sahuagin-pretre | PRÉSENT | — |
| 382 | Sahuagin Warrior | 264 | 1/2 | sahuagin-combattant | PRÉSENT | — |
| 383 | Salamander | 267 | 5 | salamandre | PRÉSENT | — |
| 384 | Salamander Fire Snake | 266 | 1 | salamandre-serpent-de-feu | PRÉSENT | — |
| 385 | Salamander Inferno Master | 267 | 15 | salamandre-maitresse-des-fournaises | PRÉSENT | — |
| 386 | Satyr | 268 | 1/2 | satyre | PRÉSENT | — |
| 387 | Satyr Revelmaster | 268 | 6 | satyre-maitre-des-rejouissances | PRÉSENT | — |
| 388 | Scarecrow | 269 | 1 | epouvantail | PRÉSENT | — |
| 389 | Scorpion | 369 | 0 | scorpion | PRÉSENT | — |
| 390 | Scout | 270 | 1/2 | eclaireur | PRÉSENT | — |
| 391 | Scout Captain | 270 | 3 | eclaireur-capitaine | PRÉSENT | — |
| 392 | Sea Hag | 271 | 2 | guenaude-marine | PRÉSENT | — |
| 393 | Seahorse | 369 | 0 | hippocampe | PRÉSENT | — |
| 394 | Shadow | 272 | 1/2 | ombre | PRÉSENT | — |
| 395 | Shadow Demon | 273 | 4 | demon-des-ombres | PRÉSENT | — |
| 396 | Shadow Dragon | 275 | 13 | dragon-d-ombre | TRONQUÉ | — |
| 397 | Shambling Mound | 276 | 5 | tertre-errant | PRÉSENT | — |
| 398 | Shield Guardian | 277 | 7 | garde-bouclier-anime | PRÉSENT | — |
| 399 | Shrieker Fungus | 125 | 0 | thallophyte-criard | PRÉSENT | — |
| 400 | Silver Dragon Wyrmling | 278 | 2 | dragon-d-argent-dragonnet | PRÉSENT | — |
| 401 | Skeleton | 282 | 1/4 | squelette | PRÉSENT | — |
| 402 | Slaad Tadpole | 284 | 1/8 | slaad-tetard | PRÉSENT | — |
| 403 | Smoke Mephit | 208 | 1/4 | mephite-fumant | TRONQUÉ | — |
| 404 | Solar | 288 | 21 | solar | TRONQUÉ | — |
| 405 | Spectator | 289 | 3 | spectateur | PRÉSENT | — |
| 406 | Specter | 290 | 1 | spectre | PRÉSENT | — |
| 407 | Sphinx of Lore | 293 | 11 | sphinx-erudit | TRONQUÉ | — |
| 408 | Sphinx of Secrets | 292 | 8 | sphinx-mysterieux | TRONQUÉ | — |
| 409 | Sphinx of Valor | 294 | 17 | sphinx-valeureux | TRONQUÉ | — |
| 410 | Sphinx of Wonder | 291 | 1 | sphinx-merveilleux | PRÉSENT | — |
| 411 | Spider | 369 | 0 | araignee | PRÉSENT | — |
| 412 | Spined Devil | 296 | 2 | diable-epineux | PRÉSENT | — |
| 413 | Spirit Naga | 297 | 8 | naga-corrupteur | PRÉSENT | — |
| 414 | Sprite | 298 | 1/4 | esprit-follet | PRÉSENT | — |
| 415 | Spy | 295 | 1 | espion | PRÉSENT | — |
| 416 | Spy Master | 295 | 10 | espion-maitre | PRÉSENT | — |
| 417 | Steam Mephit | 208 | 1/4 | mephite-vaporeux | TRONQUÉ | — |
| 418 | Stirge | 299 | 1/8 | strige | PRÉSENT | — |
| 419 | Stone Giant | 300 | 7 | geant-des-pierres | PRÉSENT | — |
| 420 | Stone Golem | 301 | 10 | golem-de-pierre | PRÉSENT | — |
| 421 | Storm Giant | 302 | 13 | geant-des-tempetes | PRÉSENT | — |
| 422 | Succubus | 303 | 4 | succube | PRÉSENT | — |
| 423 | Swarm of Bats | 370 | 1/4 | nuee-de-chauves-souris | PRÉSENT | — |
| 424 | Swarm of Crawling Claws | 83 | 3 | nuee-de-griffes-rampantes-senestres | PRÉSENT | — |
| 425 | Swarm of Dretches | 104 | 4 | nuee-de-dretches | PRÉSENT | — |
| 426 | Swarm of Insects | 370 | 1/2 | nuee-d-insectes | TRONQUÉ | — |
| 427 | Swarm of Larvae | 193 | 1 | nuee-de-larves | PRÉSENT | — |
| 428 | Swarm of Lemures | 194 | 3 | nuee-de-lemures | PRÉSENT | MM v1 |
| 429 | Swarm of Piranhas | 370 | 1 | nuee-de-piranhas | PRÉSENT | — |
| 430 | Swarm of Rats | 370 | 1/4 | nuee-de-rats | PRÉSENT | — |
| 431 | Swarm of Ravens | 371 | 1/4 | nuee-de-corbeaux | PRÉSENT | — |
| 432 | Swarm of Stirges | 299 | 2 | nuee-de-striges | PRÉSENT | — |
| 433 | Swarm of Venomous Snakes | 371 | 2 | nuee-de-serpents-venimeux | PRÉSENT | — |
| 434 | Tarrasque | 305 | 30 | tarasque | PRÉSENT | — |
| 435 | Thri-kreen Marauder | 306 | 1 | thri-kreen-maraudeur | PRÉSENT | — |
| 436 | Thri-kreen Psion | 306 | 8 | thri-kreen-psion | PRÉSENT | — |
| 437 | Tiger | 371 | 1 | tigre | PRÉSENT | — |
| 438 | Tough | 307 | 1/2 | gros-bras | PRÉSENT | — |
| 439 | Tough Boss | 307 | 4 | gros-bras-chef | TRONQUÉ | — |
| 440 | Treant | 308 | 9 | sylvanien | PRÉSENT | — |
| 441 | Tree Blight | 44 | 7 | arbroyeux | PRÉSENT | — |
| 442 | Triceratops | 372 | 5 | triceratops | PRÉSENT | — |
| 443 | Troglodyte | 309 | 1/4 | troglodyte | PRÉSENT | — |
| 444 | Troll | 310 | 5 | troll | PRÉSENT | — |
| 445 | Troll Limb | 310 | 1/2 | abattis-de-troll | PRÉSENT | — |
| 446 | Twig Blight | 43 | 1/8 | nielleux | PRÉSENT | — |
| 447 | Tyrannosaurus Rex | 372 | 8 | tyrannosaure-rex | PRÉSENT | — |
| 448 | Ultroloth | 311 | 13 | ultroloth | PRÉSENT | — |
| 449 | Umber Hulk | 312 | 5 | mastodonte-des-ombres | TRONQUÉ | — |
| 450 | Unicorn | 313 | 5 | licorne | TRONQUÉ | — |
| 451 | Vampire | 317 | 13 | vampire | PRÉSENT | — |
| 452 | Vampire Familiar | 314 | 3 | familier-de-vampire | PRÉSENT | — |
| 453 | Vampire Nightbringer | 316 | 8 | vampire-heraut-de-la-nuit | TRONQUÉ | — |
| 454 | Vampire Spawn | 315 | 5 | vampirien | PRÉSENT | — |
| 455 | Vampire Umbral Lord | 318 | 15 | vampire-seigneur-des-ombres | TRONQUÉ | — |
| 456 | Venomous Snake | 372 | 1/8 | serpent-venimeux | PRÉSENT | — |
| 457 | Vine Blight | 44 | 1/2 | lierreux | TRONQUÉ | — |
| 458 | Violet Fungus | 126 | 1/4 | thallophyte-violette | PRÉSENT | MM v1 |
| 459 | Violet Fungus Necrohulk | 126 | 7 | thallophyte-mastonecrofonge | PRÉSENT | — |
| 460 | Vrock | 319 | 6 | vrock | PRÉSENT | — |
| 461 | Vulture | 372 | 0 | vautour | PRÉSENT | — |
| 462 | Warhorse | 373 | 1/2 | cheval-de-guerre-destrier | PRÉSENT | — |
| 463 | Warhorse Skeleton | 282 | 1/2 | cheval-de-guerre-squelette | PRÉSENT | — |
| 464 | Warrior Commander | 321 | 10 | combattant-commandant | PRÉSENT | — |
| 465 | Warrior Infantry | 320 | 1/8 | combattant-fantassin | PRÉSENT | — |
| 466 | Warrior Veteran | 320 | 3 | combattant-veteran | PRÉSENT | — |
| 467 | Water Elemental | 322 | 5 | elementaire-de-l-eau | PRÉSENT | — |
| 468 | Water Weird | 323 | 3 | sibylle-de-l-eau | PRÉSENT | — |
| 469 | Weasel | 372 | 0 | belette | PRÉSENT | — |
| 470 | Werebear | 324 | 5 | ours-garou | PRÉSENT | — |
| 471 | Wereboar | 325 | 4 | sanglier-garou | PRÉSENT | — |
| 472 | Wererat | 325 | 2 | rat-garou | PRÉSENT | — |
| 473 | Weretiger | 326 | 4 | tigre-garou | PRÉSENT | — |
| 474 | Werewolf | 327 | 3 | loup-garou | TRONQUÉ | — |
| 475 | White Dragon Wyrmling | 328 | 2 | dragon-blanc-dragonnet | PRÉSENT | — |
| 476 | Wight | 332 | 3 | necrophage-necronte | PRÉSENT | — |
| 477 | Will-o'-Wisp | 333 | 2 | feu-follet | PRÉSENT | — |
| 478 | Winged Kobold | 185 | 1/4 | kobold-aile | PRÉSENT | — |
| 479 | Winter Wolf | 334 | 3 | loup-arctique | PRÉSENT | — |
| 480 | Wolf | 373 | 1/4 | loup | PRÉSENT | — |
| 481 | Worg | 335 | 1/2 | worg | PRÉSENT | — |
| 482 | Wraith | 336 | 5 | ame-en-peine | PRÉSENT | — |
| 483 | Wyvern | 337 | 6 | wyverne-vouivre | PRÉSENT | — |
| 484 | Xorn | 338 | 5 | xorn | PRÉSENT | — |
| 485 | Yeti | 339 | 3 | yeti | PRÉSENT | — |
| 486 | Yochlol | 341 | 10 | yochlol | PRÉSENT | — |
| 487 | Young Black Dragon | 38 | 7 | dragon-noir-jeune | PRÉSENT | — |
| 488 | Young Blue Dragon | 48 | 9 | dragon-bleu-jeune | PRÉSENT | — |
| 489 | Young Brass Dragon | 54 | 6 | dragon-d-airain-jeune | PRÉSENT | — |
| 490 | Young Bronze Dragon | 58 | 8 | dragon-de-bronze-jeune | PRÉSENT | — |
| 491 | Young Copper Dragon | 78 | 7 | dragon-de-cuivre-jeune | PRÉSENT | — |
| 492 | Young Gold Dragon | 144 | 10 | dragon-d-or-jeune | PRÉSENT | — |
| 493 | Young Green Dragon | 152 | 8 | dragon-vert-jeune | PRÉSENT | — |
| 494 | Young Red Dragon | 254 | 10 | dragon-rouge-jeune | PRÉSENT | — |
| 495 | Young Remorhaz | 258 | 5 | remorhaz-jeune | TRONQUÉ | — |
| 496 | Young Silver Dragon | 278 | 9 | dragon-d-argent-jeune | PRÉSENT | — |
| 497 | Young White Dragon | 328 | 6 | dragon-blanc-jeune | PRÉSENT | — |
| 498 | Yuan-ti Abomination | 345 | 7 | yuan-ti-abomination | PRÉSENT | — |
| 499 | Yuan-ti Infiltrator | 342 | 1 | yuan-ti-infiltrateur | PRÉSENT | — |
| 500 | Yuan-ti Malison (Type 1) | 343 | 3 | yuan-ti-malfice-type-1 | PRÉSENT | — |
| 501 | Yuan-ti Malison (Type 2) | 343 | 3 | yuan-ti-malfice-type-2 | PRÉSENT | — |
| 502 | Yuan-ti Malison (Type 3) | 344 | 3 | yuan-ti-malfice-type-3 | PRÉSENT | — |
| 503 | Zombie | 346 | 1/4 | zombi | PRÉSENT | — |

## Profils PHB paramétrés

| Profil local | Clé locale | Source | Famille B08 | État local |
|---|---|---|---|---|
| Bête des cieux | `bete-des-cieux` | PHB24 p. 123–124 | SUM-006 | PARAMÉTRÉ NON EXÉCUTABLE |
| Bête des mers | `bete-des-mers` | PHB24 p. 123–124 | SUM-006 | PARAMÉTRÉ NON EXÉCUTABLE |
| Bête des terres | `bete-des-terres` | PHB24 p. 123–124 | SUM-006 | PARAMÉTRÉ NON EXÉCUTABLE |
| Esprit aberrant | `esprit-aberrant` | PHB24 p. 322 | SUM-002 à SUM-005 | PARAMÉTRÉ NON EXÉCUTABLE |
| Esprit artificiel | `esprit-artificiel` | PHB24 p. 324 | SUM-002 à SUM-005 | PARAMÉTRÉ NON EXÉCUTABLE |
| Esprit bestial | `esprit-bestial` | PHB24 p. 323 | SUM-002 à SUM-005 | PARAMÉTRÉ NON EXÉCUTABLE |
| Esprit céleste | `esprit-celeste` | PHB24 p. 323 | SUM-002 à SUM-005 | PARAMÉTRÉ NON EXÉCUTABLE |
| Esprit draconique | `esprit-draconique` | PHB24 p. 325 | SUM-002 à SUM-005 | PARAMÉTRÉ NON EXÉCUTABLE |
| Esprit élémentaire | `esprit-elementaire` | PHB24 p. 325 | SUM-002 à SUM-005 | PARAMÉTRÉ NON EXÉCUTABLE |
| Esprit féerique | `esprit-feerique` | PHB24 p. 326 | SUM-002 à SUM-005 | PARAMÉTRÉ NON EXÉCUTABLE |
| Esprit fiélon | `esprit-fielon` | PHB24 p. 327 | SUM-002 à SUM-005 | PARAMÉTRÉ NON EXÉCUTABLE |
| Esprit mort-vivant | `esprit-mort-vivant` | PHB24 p. 328 | SUM-002 à SUM-005 | PARAMÉTRÉ NON EXÉCUTABLE |
| Insecte géant | `insecte-geant` | PHB24 p. 278–279 | SUM-009 | PARAMÉTRÉ NON EXÉCUTABLE |
| Monture d’Outremonde | `monture-d-outremonde` | PHB24 p. 272–273 | SUM-008 | PARAMÉTRÉ NON EXÉCUTABLE |
| Objet animé | `objet-anime` | PHB24 p. 242 | SUM-010 | PARAMÉTRÉ NON EXÉCUTABLE |

## Règle de maintenance

Une mise à jour de 5e.tools ne modifie jamais silencieusement ce registre. Elle doit
indiquer la nouvelle release, recalculer le SHA-256, comparer les 503 identités et
qualifier chaque ajout, retrait ou modification. Une correction officielle ultérieure
à MM v1 est prioritaire et produit une nouvelle version de profil.
