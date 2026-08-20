# B06 — Registre exhaustif des sorts

## Statut et usage

Ce registre complète la [matrice B06](B06-SPELLS-AND-MAGICAL-EFFECTS.md). Il pointe
chacune des 391 identités du *Player's Handbook 2024* sans recopier son texte. Le livre
reste la source normative ; noms français, clés et marqueurs locaux servent à auditer
l'état actuel et doivent être recoupés avant implémentation.

Les marqueurs sont `C` pour Concentration, `R` pour Rituel et `N+` lorsqu'une
clause emploie un emplacement supérieur. Leur présence locale ne prouve pas que la
clause correspondante est correctement structurée.

## Critère d'acceptation partagé AC-SP

Chaque ligne satisfait AC-SP uniquement lorsque :

1. identité, niveau, école, listes, temps, portée, composantes, durée et marqueurs
   correspondent à la description PHB et aux errata applicables ;
2. chaque phrase mécanique possède paramètres, préconditions, coûts, cibles,
   déclencheurs, jets, conséquences, échéances, fins et projection autorisée ;
3. des cas automatisés couvrent nominal, refus, bornes, surclassement et exceptions ;
4. toute clause subjective désigne l'étape MJ de DEC-011 et toute dépendance de profil
   pointe B07 ou B08 ;
5. aucune note `informational`, description libre ou validation client ne tient lieu
   d'exécution ou de test.

## Registre des 391 sorts

| ID | Clé locale | Nom local | Niveau | École | Marqueurs locaux | État actuel / qualification | Critère |
|---|---|---|---:|---|---|---|---|
| B06-SP-001 | `acid-splash` | Aspersion d'acide | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-002 | `aid` | Aide | 2 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-003 | `alarm` | Alarme | 1 | Abjuration | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-004 | `alter-self` | Modification d'apparence | 2 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-005 | `animal-friendship` | Amitié avec les animaux | 1 | Enchantement | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-006 | `animal-messenger` | Messager animal | 2 | Enchantement | R, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-007 | `animal-shapes` | Métamorphose animale | 8 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-008 | `animate-dead` | Animation des morts | 3 | Nécromancie | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-009 | `animate-objects` | Animation des objets | 5 | Transmutation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-010 | `antilife-shell` | Coquille antivie | 5 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-011 | `antimagic-field` | Champ antimagie | 8 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-012 | `antipathy-sympathy` | Aversion/attirance | 8 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-013 | `arcane-eye` | Oeil du mage | 4 | Divination | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-014 | `arcane-gate` | Portail arcanique | 6 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-015 | `arcane-lock` | Verrou arcanique / Verrou magique | 2 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-016 | `arcane-vigor` | Vigueur arcanique | 2 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-017 | `armor-of-agathys` | Armure d'Agathys | 1 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-018 | `arms-of-hadar` | Tentacules de Hadar | 1 | Invocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-019 | `astral-projection` | Projection astrale | 9 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-020 | `augury` | Augure | 2 | Divination | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-021 | `aura-of-life` | Aura de vie | 4 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-022 | `aura-of-purity` | Aura de pureté | 4 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-023 | `aura-of-vitality` | Aura de vitalité | 3 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-024 | `awaken` | Éveil | 5 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-025 | `bane` | Imprécation | 1 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-026 | `banishing-smite` | Châtiment du ban | 5 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-027 | `banishment` | Bannissement | 4 | Abjuration | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-028 | `barkskin` | Peau d'écorce | 2 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-029 | `beacon-of-hope` | Lueur d'espoir | 3 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-030 | `beast-sense` | Perception bestiale | 2 | Divination | C, R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-031 | `befuddlement` | Aliénation | 8 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-032 | `bestow-curse` | Malédiction | 3 | Nécromancie | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-033 | `bigby-s-hand` | Main de Bigby | 5 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-034 | `blade-barrier` | Barrière de lames | 6 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-035 | `blade-ward` | Voile défensif | 0 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-036 | `bless` | Bénédiction | 1 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-037 | `blight` | Flétrissement | 4 | Nécromancie | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-038 | `blinding-smite` | Châtiment de cécité | 3 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-039 | `blindness-deafness` | Cécité/surdité | 2 | Transmutation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-040 | `blink` | Clignotement | 3 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-041 | `blur` | Flou | 2 | Illusion | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-042 | `burning-hands` | Mains brûlantes | 1 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-043 | `call-lightning` | Appel de la foudre | 3 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-044 | `calm-emotions` | Apaisement des émotions | 2 | Enchantement | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-045 | `chain-lightning` | Chaîne d'éclairs | 6 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-046 | `charm-monster` | Charme-monstre | 4 | Enchantement | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-047 | `charm-person` | Charme-personne | 1 | Enchantement | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-048 | `chill-touch` | Contact glacial | 0 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-049 | `chromatic-orb` | Orbe chromatique | 1 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-050 | `circle-of-death` | Cercle de mort | 6 | Nécromancie | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-051 | `circle-of-power` | Cercle de pouvoir | 5 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-052 | `clairvoyance` | Clairvoyance | 3 | Divination | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-053 | `clone` | Clone | 8 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-054 | `cloud-of-daggers` | Nuée de dagues | 2 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-055 | `cloudkill` | Brume mortelle | 5 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-056 | `color-spray` | Couleurs dansantes | 1 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-057 | `command` | Injonction | 1 | Enchantement | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-058 | `commune` | Communion | 5 | Divination | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-059 | `commune-with-nature` | Communion avec la nature | 5 | Divination | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-060 | `compelled-duel` | Duel forcé | 1 | Enchantement | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-061 | `comprehend-languages` | Compréhension des langues | 1 | Divination | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-062 | `compulsion` | Compulsion | 4 | Enchantement | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-063 | `cone-of-cold` | Cône de froid | 5 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-064 | `confusion` | Confusion | 4 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-065 | `conjure-animals` | Invocation d'animaux | 3 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-066 | `conjure-barrage` | Invocation de projectiles / Hérissement | 3 | Invocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-067 | `conjure-celestial` | Invocation de céleste | 7 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-068 | `conjure-elemental` | Invocation d'élémentaire | 5 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-069 | `conjure-fey` | Invocation de fée | 6 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-070 | `conjure-minor-elementals` | Invocation d'élémentaires mineurs | 4 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-071 | `conjure-volley` | Invocation de volée | 5 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-072 | `conjure-woodland-beings` | Invocation d'êtres sylvestres | 4 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-073 | `contact-other-plane` | Contact avec les plans | 5 | Divination | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-074 | `contagion` | Contagion | 5 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-075 | `contingency` | Préméditation | 6 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-076 | `continual-flame` | Flamme éternelle | 2 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-077 | `control-water` | Contrôle de l'eau | 4 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-078 | `control-weather` | Contrôle du climat | 8 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-079 | `cordon-of-arrows` | Cordon de flèches | 2 | Transmutation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-080 | `counterspell` | Contresort | 3 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-081 | `create-food-and-water` | Création de nourriture et d'eau | 3 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-082 | `create-or-destroy-water` | Création ou destruction d'eau | 1 | Transmutation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-083 | `create-undead` | Création de mort-vivant | 6 | Nécromancie | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-084 | `creation` | Création | 5 | Illusion | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-085 | `crown-of-madness` | Couronne du dément | 2 | Enchantement | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-086 | `crusader-s-mantle` | Aura du croisé | 3 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-087 | `cure-wounds` | Soins | 1 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-088 | `dancing-lights` | Lumières dansantes | 0 | Illusion | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-089 | `darkness` | Ténèbres | 2 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-090 | `darkvision` | Vision dans le noir | 2 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-091 | `daylight` | Lumière du jour | 3 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-092 | `death-ward` | Protection contre la mort | 4 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-093 | `delayed-blast-fireball` | Boule de feu à retardement | 7 | Évocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-094 | `demiplane` | Demi-plan | 8 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-095 | `destructive-wave` | Vague destructrice | 5 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-096 | `detect-evil-and-good` | Détection du mal et du bien | 1 | Divination | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-097 | `detect-magic` | Détection de la magie | 1 | Divination | C, R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-098 | `detect-poison-and-disease` | Détection du poison et des maladies | 1 | Divination | C, R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-099 | `detect-thoughts` | Détection des pensées | 2 | Divination | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-100 | `dimension-door` | Porte dimensionnelle | 4 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-101 | `disguise-self` | Déguisement | 1 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-102 | `disintegrate` | Désintégration | 6 | Transmutation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-103 | `dispel-evil-and-good` | Dissipation du mal et du bien | 5 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-104 | `dispel-magic` | Dissipation de la magie | 3 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-105 | `dissonant-whispers` | Murmures dissonants | 1 | Enchantement | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-106 | `divination` | Divination | 4 | Divination | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-107 | `divine-favor` | Faveur divine | 1 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-108 | `divine-smite` | Châtiment divin | 1 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-109 | `divine-word` | Parole divine | 7 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-110 | `dominate-beast` | Domination de bête | 4 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-111 | `dominate-monster` | Domination de monstre | 8 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-112 | `dominate-person` | Domination de personne | 5 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-113 | `dragon-s-breath` | Souffle du dragon | 2 | Transmutation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-114 | `drawmij-s-instant-summons` | Convocations instantanées de Drawmij | 6 | Invocation | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-115 | `dream` | Songe | 5 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-116 | `druidcraft` | Druidisme | 0 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-117 | `earthquake` | Tremblement de terre | 8 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-118 | `eldritch-blast` | Décharge occulte | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-119 | `elemental-weapon` | Arme élémentaire | 3 | Transmutation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-120 | `elementalism` | Élémentalisme | 0 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-121 | `enhance-ability` | Amélioration de caractéristique | 2 | Transmutation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-122 | `enlarge-reduce` | Agrandissement/rapetissement | 2 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-123 | `ensnaring-strike` | Frappe piégeuse | 1 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-124 | `entangle` | Enchevêtrement | 1 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-125 | `enthrall` | Discours captivant | 2 | Enchantement | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-126 | `etherealness` | Forme éthérée | 7 | Invocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-127 | `evard-s-black-tentacles` | Tentacules noirs d'Evard | 4 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-128 | `expeditious-retreat` | Repli expéditif | 1 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-129 | `eyebite` | Mauvais oeil | 6 | Nécromancie | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-130 | `fabricate` | Fabrication | 4 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-131 | `faerie-fire` | Lueurs féeriques | 1 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-132 | `false-life` | Simulacre de vie | 1 | Nécromancie | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-133 | `fear` | Peur / Terreur | 3 | Illusion | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-134 | `feather-fall` | Feuille morte | 1 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-135 | `feign-death` | État cadavérique | 3 | Nécromancie | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-136 | `find-familiar` | Appel de familier | 1 | Invocation | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-137 | `find-steed` | Appel de destrier | 2 | Invocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-138 | `find-the-path` | Orientation | 6 | Divination | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-139 | `find-traps` | Détection des pièges | 2 | Divination | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-140 | `finger-of-death` | Doigt de mort | 7 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-141 | `fire-bolt` | Trait de feu | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-142 | `fire-shield` | Bouclier de feu | 4 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-143 | `fire-storm` | Tempête de feu | 7 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-144 | `fireball` | Boule de feu | 3 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-145 | `flame-blade` | Lame de feu | 2 | Évocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-146 | `flame-strike` | Colonne de flamme | 5 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-147 | `flaming-sphere` | Sphère de feu | 2 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-148 | `flesh-to-stone` | Pétrification | 6 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-149 | `fly` | Vol | 3 | Transmutation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-150 | `fog-cloud` | Nappe de brouillard | 1 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-151 | `forbiddance` | Interdiction | 6 | Abjuration | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-152 | `forcecage` | Cage de force | 7 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-153 | `foresight` | Prémonition | 9 | Divination | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-154 | `fount-of-moonlight` | Fontaine de lune | 4 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-155 | `freedom-of-movement` | Liberté de mouvement | 4 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-156 | `friends` | Amis / Faux amis | 0 | Enchantement | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-157 | `gaseous-form` | Forme gazeuse | 3 | Transmutation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-158 | `gate` | Portail | 9 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-159 | `geas` | Quête | 5 | Enchantement | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-160 | `gentle-repose` | Doux repos | 2 | Nécromancie | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-161 | `giant-insect` | Insecte géant | 4 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-162 | `glibness` | Bagou | 8 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-163 | `globe-of-invulnerability` | Globe d'invulnérabilité | 6 | Abjuration | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-164 | `glyph-of-warding` | Glyphe de garde | 3 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-165 | `goodberry` | Baies nourricières | 1 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-166 | `grasping-vine` | Liane avide | 4 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-167 | `grease` | Graisse | 1 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-168 | `greater-invisibility` | Invisibilité suprême | 4 | Illusion | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-169 | `greater-restoration` | Restauration suprême | 5 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-170 | `guardian-of-faith` | Gardien de la foi | 4 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-171 | `guards-and-wards` | Protections et sceaux | 6 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-172 | `guidance` | Assistance | 0 | Divination | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-173 | `guiding-bolt` | Rayon traçant | 1 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-174 | `gust-of-wind` | Bourrasque | 2 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-175 | `hail-of-thorns` | Grêle d'épines | 1 | Invocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-176 | `hallow` | Sanctification | 5 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-177 | `hallucinatory-terrain` | Terrain hallucinatoire | 4 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-178 | `harm` | Contamination | 6 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-179 | `haste` | Hâte | 3 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-180 | `heal` | Guérison | 6 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-181 | `healing-word` | Mot de guérison | 1 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-182 | `heat-metal` | Métal brûlant | 2 | Transmutation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-183 | `hellish-rebuke` | Représailles infernales | 1 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-184 | `heroes-feast` | Festin des héros | 6 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-185 | `heroism` | Héroïsme | 1 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-186 | `hex` | Maléfice | 1 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-187 | `hold-monster` | Immobilisation de monstre | 5 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-188 | `hold-person` | Immobilisation de personne | 2 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-189 | `holy-aura` | Aura sacrée | 8 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-190 | `hunger-of-hadar` | Voracité de Hadar | 3 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-191 | `hunter-s-mark` | Marque du chasseur | 1 | Divination | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-192 | `hypnotic-pattern` | Motif hypnotique | 3 | Illusion | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-193 | `ice-knife` | Couteau de glace | 1 | Invocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-194 | `ice-storm` | Tempête de grêle | 4 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-195 | `identify` | Identification | 1 | Divination | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-196 | `illusory-script` | Texte illusoire | 1 | Illusion | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-197 | `imprisonment` | Emprisonnement | 9 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-198 | `incendiary-cloud` | Nuage incendiaire | 8 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-199 | `inflict-wounds` | Blessure | 1 | Nécromancie | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-200 | `insect-plague` | Fléau d'insectes | 5 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-201 | `invisibility` | Invisibilité | 2 | Illusion | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-202 | `jallarzi-s-storm-of-radiance` | Tempête radieuse de Jallarzi | 5 | Évocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-203 | `jump` | Saut | 1 | Transmutation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-204 | `knock` | Déblocage | 2 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-205 | `legend-lore` | Mythes et légendes | 5 | Divination | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-206 | `leomund-s-secret-chest` | Coffre secret de Léomund | 4 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-207 | `leomund-s-tiny-hut` | Petite hutte de Léomund | 3 | Évocation | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-208 | `lesser-restoration` | Restauration partielle | 2 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-209 | `levitate` | Lévitation | 2 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-210 | `light` | Lumière | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-211 | `lightning-arrow` | Flèche de foudre | 3 | Transmutation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-212 | `lightning-bolt` | Éclair | 3 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-213 | `locate-animals-or-plants` | Localisation d'animaux ou de plantes | 2 | Divination | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-214 | `locate-creature` | Localisation de créature | 4 | Divination | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-215 | `locate-object` | Localisation d'objet | 2 | Divination | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-216 | `longstrider` | Grande foulée | 1 | Transmutation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-217 | `mage-armor` | Armure de mage | 1 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-218 | `mage-hand` | Main de mage | 0 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-219 | `magic-circle` | Cercle magique | 3 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-220 | `magic-jar` | Urne magique / Possession | 6 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-221 | `magic-missile` | Projectile magique | 1 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-222 | `magic-mouth` | Bouche magique | 2 | Illusion | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-223 | `magic-weapon` | Arme magique | 2 | Transmutation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-224 | `major-image` | Image majeure | 3 | Illusion | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-225 | `mass-cure-wounds` | Soins de groupe | 5 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-226 | `mass-heal` | Guérison de groupe | 9 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-227 | `mass-healing-word` | Mot de guérison de groupe | 3 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-228 | `mass-suggestion` | Suggestion de groupe | 6 | Enchantement | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-229 | `maze` | Dédale | 8 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-230 | `meld-into-stone` | Fusion dans la pierre | 3 | Transmutation | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-231 | `melf-s-acid-arrow` | Flèche acide de Melf | 2 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-232 | `mending` | Réparation | 0 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-233 | `message` | Message | 0 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-234 | `meteor-swarm` | Nuée de météores | 9 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-235 | `mind-blank` | Esprit impénétrable | 8 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-236 | `mind-sliver` | Piqûre mentale | 0 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-237 | `mind-spike` | Épine mentale | 2 | Divination | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-238 | `minor-illusion` | Illusion mineure | 0 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-239 | `mirage-arcane` | Mirage | 7 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-240 | `mirror-image` | Image miroir | 2 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-241 | `mislead` | Double illusoire | 5 | Illusion | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-242 | `misty-step` | Foulée brumeuse | 2 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-243 | `modify-memory` | Modification de mémoire | 5 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-244 | `moonbeam` | Rayon de lune | 2 | Évocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-245 | `mordenkainen-s-faithful-hound` | Chien de garde de Mordenkainen | 4 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-246 | `mordenkainen-s-magnificent-mansion` | Manoir somptueux de Mordenkainen | 7 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-247 | `mordenkainen-s-private-sanctum` | Sanctuaire privé de Mordenkainen | 4 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-248 | `mordenkainen-s-sword` | Épée de Mordenkainen | 7 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-249 | `move-earth` | Glissement de terrain | 6 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-250 | `nondetection` | Antidétection | 3 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-251 | `nystul-s-magic-aura` | Aura magique de Nystul | 2 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-252 | `otiluke-s-freezing-sphere` | Sphère glacée d'Otiluke | 6 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-253 | `otiluke-s-resilient-sphere` | Sphère résiliente d'Otiluke | 4 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-254 | `otto-s-irresistible-dance` | Danse irrésistible d'Otto | 6 | Enchantement | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-255 | `pass-without-trace` | Passage sans trace | 2 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-256 | `passwall` | Passe-muraille | 5 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-257 | `phantasmal-force` | Force fantasmagorique | 2 | Illusion | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-258 | `phantasmal-killer` | Assassin imaginaire | 4 | Illusion | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-259 | `phantom-steed` | Monture fantôme | 3 | Illusion | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-260 | `planar-ally` | Allié planaire | 6 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-261 | `planar-binding` | Entrave planaire | 5 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-262 | `plane-shift` | Changement de plan | 7 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-263 | `plant-growth` | Croissance végétale | 3 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-264 | `poison-spray` | Bouffée de poison | 0 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-265 | `polymorph` | Métamorphose | 4 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-266 | `power-word-fortify` | Mot de pouvoir fortifiant | 7 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-267 | `power-word-heal` | Mot de pouvoir guérisseur | 9 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-268 | `power-word-kill` | Mot de pouvoir mortel | 9 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-269 | `power-word-stun` | Mot de pouvoir étourdissant | 8 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-270 | `prayer-of-healing` | Prière de guérison | 2 | Abjuration | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-271 | `prestidigitation` | Prestidigitation | 0 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-272 | `prismatic-spray` | Embruns prismatiques | 7 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-273 | `prismatic-wall` | Mur prismatique | 9 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-274 | `produce-flame` | Flammes | 0 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-275 | `programmed-illusion` | Illusion programmée | 6 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-276 | `project-image` | Image projetée | 7 | Illusion | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-277 | `protection-from-energy` | Protection contre l'énergie | 3 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-278 | `protection-from-evil-and-good` | Protection contre le mal et le bien | 1 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-279 | `protection-from-poison` | Protection contre le poison | 2 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-280 | `purify-food-and-drink` | Purification de la nourriture et de l'eau | 1 | Transmutation | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-281 | `raise-dead` | Rappel à la vie | 5 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-282 | `rary-s-telepathic-bond` | Lien télépathique de Rary | 5 | Divination | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-283 | `ray-of-enfeeblement` | Rayon affaiblissant | 2 | Nécromancie | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-284 | `ray-of-frost` | Rayon de givre | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-285 | `ray-of-sickness` | Rayon empoisonné | 1 | Nécromancie | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-286 | `regenerate` | Régénération | 7 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-287 | `reincarnate` | Réincarnation | 5 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-288 | `remove-curse` | Délivrance des malédictions | 3 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-289 | `resistance` | Résistance | 0 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-290 | `resurrection` | Résurrection | 7 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-291 | `reverse-gravity` | Inversion de la gravité | 7 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-292 | `revivify` | Retour à la vie | 3 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-293 | `rope-trick` | Corde enchantée | 2 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-294 | `sacred-flame` | Flamme sacrée | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-295 | `sanctuary` | Sanctuaire | 1 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-296 | `scorching-ray` | Rayon ardent | 2 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-297 | `scrying` | Scrutation | 5 | Divination | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-298 | `searing-smite` | Châtiment de fournaise | 1 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-299 | `see-invisibility` | Détection de l'invisibilité | 2 | Divination | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-300 | `seeming` | Apparence trompeuse | 5 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-301 | `sending` | Communication à distance | 3 | Divination | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-302 | `sequester` | Dissimulation suprême | 7 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-303 | `shapechange` | Changement de forme | 9 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-304 | `shatter` | Fracassement | 2 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-305 | `shield` | Bouclier | 1 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-306 | `shield-of-faith` | Bouclier de la foi | 1 | Abjuration | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-307 | `shillelagh` | Crosse des druides | 0 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-308 | `shining-smite` | Châtiment de révélation | 2 | Transmutation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-309 | `shocking-grasp` | Poigne électrique | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-310 | `silence` | Silence | 2 | Illusion | C, R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-311 | `silent-image` | Image silencieuse | 1 | Illusion | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-312 | `simulacrum` | Simulacre | 7 | Illusion | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-313 | `sleep` | Sommeil | 1 | Enchantement | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-314 | `sleet-storm` | Tempête de neige | 3 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-315 | `slow` | Lenteur | 3 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-316 | `sorcerous-burst` | Éruption ensorcelée | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-317 | `spare-the-dying` | Stabilisation | 0 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-318 | `speak-with-animals` | Communication avec les animaux | 1 | Divination | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-319 | `speak-with-dead` | Communication avec les morts | 3 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-320 | `speak-with-plants` | Communication avec les plantes | 3 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-321 | `spider-climb` | Pattes d'araignée | 2 | Transmutation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-322 | `spike-growth` | Croissance d'épines | 2 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-323 | `spirit-guardians` | Esprits gardiens | 3 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-324 | `spiritual-weapon` | Arme spirituelle | 2 | Évocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-325 | `staggering-smite` | Châtiment de stupeur | 4 | Enchantement | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-326 | `starry-wisp` | Poussière d'étoile | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-327 | `steel-wind-strike` | Frappe du vent d'acier | 5 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-328 | `stinking-cloud` | Nuage nauséabond | 3 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-329 | `stone-shape` | Façonnage de la pierre | 4 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-330 | `stoneskin` | Peau de pierre | 4 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-331 | `storm-of-vengeance` | Tempête vengeresse | 9 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-332 | `suggestion` | Suggestion | 2 | Enchantement | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-333 | `summon-aberration` | Convocation d'aberration | 4 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-334 | `summon-beast` | Convocation de bête | 2 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-335 | `summon-celestial` | Convocation de céleste | 5 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-336 | `summon-construct` | Convocation d'artificiel | 4 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-337 | `summon-dragon` | Convocation de dragon | 5 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-338 | `summon-elemental` | Convocation d'élémentaire | 4 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-339 | `summon-fey` | Convocation de fée | 3 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-340 | `summon-fiend` | Convocation de fiélon | 6 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-341 | `summon-undead` | Convocation de mort-vivant | 3 | Nécromancie | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-342 | `sunbeam` | Rayon de soleil | 6 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-343 | `sunburst` | Éclat du soleil | 8 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-344 | `swift-quiver` | Vif carquois | 5 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-345 | `symbol` | Symbole | 7 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-346 | `synaptic-static` | Perturbations synaptiques | 5 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-347 | `tasha-s-bubbling-cauldron` | Chaudron bouillonnant de Tasha | 6 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-348 | `tasha-s-hideous-laughter` | Fou rire de Tasha | 1 | Enchantement | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-349 | `telekinesis` | Télékinésie | 5 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-350 | `telepathy` | Télépathie | 8 | Divination | — | **Absent** : identité manquante au seed et au runtime. | AC-SP |
| B06-SP-351 | `teleport` | Téléportation | 7 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-352 | `teleportation-circle` | Cercle de téléportation | 5 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-353 | `tenser-s-floating-disk` | Disque flottant de Tenser | 1 | Invocation | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-354 | `thaumaturgy` | Thaumaturgie | 0 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-355 | `thorn-whip` | Fouet épineux | 0 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-356 | `thunderclap` | Coup de tonnerre | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-357 | `thunderous-smite` | Châtiment de tonnerre | 1 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-358 | `thunderwave` | Vague tonnante | 1 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-359 | `time-stop` | Arrêt du temps | 9 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-360 | `toll-the-dead` | Glas | 0 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-361 | `tongues` | Don des langues | 3 | Divination | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-362 | `transport-via-plants` | Voie végétale | 6 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-363 | `tree-stride` | Passage par les arbres | 5 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-364 | `true-polymorph` | Métamorphose suprême | 9 | Transmutation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-365 | `true-resurrection` | Résurrection suprême | 9 | Nécromancie | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-366 | `true-seeing` | Vision suprême | 6 | Divination | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-367 | `true-strike` | Coup au but | 0 | Divination | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-368 | `tsunami` | Tsunami | 8 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-369 | `unseen-servant` | Serviteur invisible | 1 | Invocation | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-370 | `vampiric-touch` | Caresse du vampire | 3 | Nécromancie | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-371 | `vicious-mockery` | Moquerie cruelle | 0 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-372 | `vitriolic-sphere` | Sphère de vitriol | 4 | Évocation | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-373 | `wall-of-fire` | Mur de feu | 4 | Évocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-374 | `wall-of-force` | Mur de force | 5 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-375 | `wall-of-ice` | Mur de glace | 6 | Évocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-376 | `wall-of-stone` | Mur de pierre | 5 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-377 | `wall-of-thorns` | Mur d'épines | 6 | Invocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-378 | `warding-bond` | Lien de protection | 2 | Abjuration | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-379 | `water-breathing` | Respiration aquatique | 3 | Transmutation | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-380 | `water-walk` | Marche sur l'eau / Marche sur l'onde | 3 | Transmutation | R | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-381 | `web` | Toile d'araignée | 2 | Invocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-382 | `weird` | Ennemi subconscient | 9 | Illusion | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-383 | `wind-walk` | Vent divin | 6 | Transmutation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-384 | `wind-wall` | Mur de vent | 3 | Évocation | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-385 | `wish` | Souhait | 9 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-386 | `witch-bolt` | Trait ensorcelé | 1 | Évocation | C, N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-387 | `word-of-radiance` | Mot de radiance | 0 | Évocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-388 | `word-of-recall` | Mot de retour | 6 | Invocation | — | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-389 | `wrathful-smite` | Châtiment de courroux | 1 | Nécromancie | N+ | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-390 | `yolande-s-regal-presence` | Présence royale de Yolane | 5 | Enchantement | C | Seed descriptif ; profil exécutable absent. | AC-SP |
| B06-SP-391 | `zone-of-truth` | Zone de vérité | 2 | Enchantement | — | Seed descriptif ; profil exécutable absent. | AC-SP |

## Contrôle des totaux

| Niveau | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Cible PHB24 | 34 | 64 | 63 | 52 | 41 | 48 | 34 | 21 | 18 | 16 | 391 |
| Seed local | 34 | 64 | 63 | 52 | 41 | 48 | 34 | 21 | 17 | 16 | 390 |

L'écart unique d'identité est `telepathy`, niveau 8. La présence des 390 autres lignes
ne valide ni leur traduction, ni leurs marqueurs, ni leurs effets extraits.
