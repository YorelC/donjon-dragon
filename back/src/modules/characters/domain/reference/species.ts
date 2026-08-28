// Les 10 espèces de D&D 2024, niveau 1 uniquement.
// Sources : docs/characteres/races/*.json
//
// Les fichiers d'origine avaient quatre formes différentes : `traits[]` sans
// mécanique pour six d'entre eux, `features[]` avec effets pour le gnome,
// des clés françaises (`espece`, `traits_communs`, `variantes`) pour l'elfe, et
// des traits sans `key` pour le halfelin. Tout est ramené ici à une seule forme,
// et chaque trait porte enfin ses effets.
//
// En 2024 l'espèce ne donne aucun bonus de caractéristique : ils viennent de
// l'historique. Les traits de niveau 5 et plus (Vol draconique, Forme de géant)
// sont hors périmètre.

import type { Ability } from './abilities';
import type { Effect, Feature } from './effect';
import { perLevel, proficiencyBonus } from './effect';
import type { LineageKey, SpeciesKey } from './keys';
import type { CreatureSize, DamageType } from './proficiencies';

export interface Lineage {
  key: LineageKey;
  name: string;
  description: string;
  traits: readonly Feature[];
}

/**
 * Cinq espèces imposent un choix de lignage à la création. Trois d'entre elles
 * laissent en plus choisir la caractéristique d'incantation de ses sorts.
 */
export interface LineageChoice {
  label: string;
  spellcastingAbilityOptions?: readonly Ability[];
  options: readonly Lineage[];
}

export interface Species {
  key: SpeciesKey;
  name: string;
  size: CreatureSize;
  /** Le tieffelin et l'humain choisissent leur taille à la création. */
  sizeOptions?: readonly CreatureSize[];
  speed: number;
  darkvision: number;
  traits: readonly Feature[];
  lineage: LineageChoice | null;
}

const WALKING_SPEED = 9;
const FAST_WALKING_SPEED = 10.5;
const DARKVISION_SHORT = 18;
const DARKVISION_LONG = 36;
const DWARVEN_HP_PER_LEVEL = 1;
const HEALING_HANDS_DIE = 'd4';

const darkvisionTrait = (range: number): Feature => ({
  key: 'darkvision',
  name: 'Vision dans le noir',
  description: `Vous possédez la Vision dans le noir sur ${range} m.`,
  effects: [{ application: 'informational', note: `Vision dans le noir : ${range} m.` }],
});

const resistanceEffect = (damageType: DamageType): Effect => ({
  application: 'passive',
  passive: { kind: 'resistance', damageType },
});

const cantripTrait = (key: string, name: string, spellKey: string): Feature => ({
  key,
  name,
  description: `Vous connaissez le sort mineur ${name.toLowerCase()}.`,
  effects: [
    {
      application: 'grant',
      grants: { spells: [{ spellKey, frequency: 'atWill' }] },
    },
  ],
});

// ---------------------------------------------------------------------------
// Drakéide
// ---------------------------------------------------------------------------

const DRACONIC_ANCESTRIES: readonly (readonly [LineageKey, string, DamageType])[] = [
  ['black', 'Noir', 'acid'],
  ['blue', 'Bleu', 'lightning'],
  ['brass', 'Airain', 'fire'],
  ['bronze', 'Bronze', 'lightning'],
  ['copper', 'Cuivre', 'acid'],
  ['gold', 'Or', 'fire'],
  ['green', 'Vert', 'poison'],
  ['red', 'Rouge', 'fire'],
  ['silver', 'Argent', 'cold'],
  ['white', 'Blanc', 'cold'],
];

const draconicLineage = ([key, name, damageType]: readonly [
  LineageKey,
  string,
  DamageType,
]): Lineage => ({
  key,
  name,
  description: `Votre Souffle et votre Résistance sont de type ${damageType}.`,
  traits: [
    {
      key: `${key}-resistance`,
      name: 'Résistance aux dégâts',
      description: `Vous bénéficiez d'une Résistance aux dégâts déterminés par votre ascendance.`,
      effects: [resistanceEffect(damageType)],
    },
  ],
});

// ---------------------------------------------------------------------------
// Le catalogue
// ---------------------------------------------------------------------------

const SPECIES_LIST: readonly Species[] = [
  {
    key: 'aasimar',
    name: 'Aasimar',
    size: 'Medium',
    sizeOptions: ['Small', 'Medium'],
    speed: WALKING_SPEED,
    darkvision: DARKVISION_SHORT,
    traits: [
      darkvisionTrait(DARKVISION_SHORT),
      {
        key: 'celestial-resistance',
        name: 'Résistance céleste',
        description: 'Résistance aux dégâts nécrotiques et radiants.',
        effects: [resistanceEffect('necrotic'), resistanceEffect('radiant')],
      },
      {
        key: 'healing-hands',
        name: 'Mains guérisseuses',
        description:
          'Par une action Magie, rend un nombre de d4 égal au bonus de maîtrise, une fois par Repos long.',
        effects: [
          {
            application: 'active',
            resource: {
              key: 'healingHands',
              max: { kind: 'constant', value: 1 },
              recovery: 'longRest',
            },
            note: `Soin : bonus de maîtrise ${HEALING_HANDS_DIE}.`,
          },
        ],
      },
      {
        key: 'light-bearer',
        name: 'Porteur de lumière',
        description: 'Vous connaissez le sort mineur Lumière avec le Charisme.',
        effects: [
          {
            application: 'grant',
            grants: {
              spells: [{ spellKey: 'light', frequency: 'atWill', ability: 'charisma' }],
            },
          },
        ],
      },
    ],
    lineage: null,
  },
  {
    key: 'dragonborn',
    name: 'Drakéide',
    size: 'Medium',
    speed: WALKING_SPEED,
    darkvision: DARKVISION_SHORT,
    traits: [
      darkvisionTrait(DARKVISION_SHORT),
      {
        key: 'breath-weapon',
        name: 'Souffle',
        description:
          "En remplacement d'une attaque, vous expirez une énergie magique en Cône de 4,50 m ou en Ligne de 9 m. Jet de sauvegarde de Dextérité (DD 8 + modificateur de Constitution + bonus de maîtrise), 1d10 dégâts du type de votre ascendance, moitié en cas de réussite.",
        effects: [
          {
            application: 'active',
            resource: {
              key: 'breathWeapon',
              max: proficiencyBonus(),
              recovery: 'longRest',
            },
            trigger: { event: 'onAttack', action: 'noAction' },
          },
        ],
      },
    ],
    lineage: {
      label: 'Ascendance draconique',
      options: DRACONIC_ANCESTRIES.map(draconicLineage),
    },
  },

  {
    key: 'dwarf',
    name: 'Nain',
    size: 'Medium',
    speed: WALKING_SPEED,
    darkvision: DARKVISION_LONG,
    traits: [
      darkvisionTrait(DARKVISION_LONG),
      {
        key: 'dwarven-resilience',
        name: 'Résilience naine',
        description:
          "Résistance aux dégâts de poison, et Avantage aux jets de sauvegarde pour éviter ou mettre fin à l'état Empoisonné.",
        effects: [
          resistanceEffect('poison'),
          {
            application: 'passive',
            passive: { kind: 'advantage', target: 'savingThrow', against: 'poisoned' },
          },
        ],
      },
      {
        key: 'dwarven-toughness',
        name: 'Ténacité naine',
        description:
          'Votre maximum de points de vie augmente de 1, et de 1 de plus à chaque niveau gagné.',
        effects: [
          {
            application: 'passive',
            passive: {
              kind: 'bonus',
              target: 'maxHp',
              formula: perLevel(DWARVEN_HP_PER_LEVEL),
            },
          },
        ],
      },
      {
        key: 'stonecunning',
        name: 'Connaissance de la pierre',
        description:
          "Par une action Bonus, au contact de la pierre, vous obtenez Perception des vibrations sur 18 m pendant 10 minutes.",
        effects: [
          {
            application: 'active',
            resource: {
              key: 'stonecunning',
              max: proficiencyBonus(),
              recovery: 'longRest',
            },
            trigger: { event: 'onTurnStart', action: 'bonusAction' },
          },
        ],
      },
    ],
    lineage: null,
  },

  {
    key: 'elf',
    name: 'Elfe',
    size: 'Medium',
    speed: WALKING_SPEED,
    darkvision: DARKVISION_SHORT,
    traits: [
      darkvisionTrait(DARKVISION_SHORT),
      {
        key: 'fey-ancestry',
        name: 'Ascendance féerique',
        description:
          "Avantage aux jets de sauvegarde pour éviter ou mettre fin à l'état Charmé.",
        effects: [
          {
            application: 'passive',
            passive: { kind: 'advantage', target: 'savingThrow', against: 'charmed' },
          },
        ],
      },
      {
        key: 'keen-senses',
        name: 'Sens aiguisés',
        description:
          'Vous maîtrisez la compétence Intuition, Perception ou Survie, au choix.',
        effects: [
          {
            application: 'grant',
            grants: {
              skillChoice: { count: 1, options: ['insight', 'perception', 'survival'] },
            },
          },
        ],
      },
      {
        key: 'trance',
        name: 'Transe',
        description:
          "Vous n'avez pas besoin de dormir et la magie ne peut pas vous endormir. Un Repos long vous prend 4 heures de méditation consciente.",
        effects: [
          {
            application: 'informational',
            note: 'Repos long en 4 heures de transe, immunité au sommeil magique.',
          },
        ],
      },
    ],
    lineage: {
      label: 'Lignage elfique',
      spellcastingAbilityOptions: ['intelligence', 'wisdom', 'charisma'],
      options: [
        {
          key: 'drow',
          name: 'Drow',
          description: "Vision dans le noir portée à 36 m, et le sort mineur Lumières dansantes.",
          traits: [
            {
              key: 'superior-darkvision',
              name: 'Vision dans le noir supérieure',
              description: 'La portée de votre Vision dans le noir passe à 36 m.',
              effects: [
                {
                  application: 'informational',
                  note: `Vision dans le noir portée à ${DARKVISION_LONG} m.`,
                },
              ],
            },
            cantripTrait('drow-cantrip', 'Lumières dansantes', 'dancing-lights'),
          ],
        },
        {
          key: 'high-elf',
          name: 'Haut-elfe',
          description:
            'Le sort mineur Prestidigitation, remplaçable par un autre sort mineur de magicien à chaque Repos long.',
          traits: [cantripTrait('high-elf-cantrip', 'Prestidigitation', 'prestidigitation')],
        },
        {
          key: 'wood-elf',
          name: 'Elfe des bois',
          description: 'Vitesse portée à 10,50 m, et le sort mineur Druidisme.',
          traits: [
            {
              key: 'fleet-of-foot',
              name: 'Vitesse accrue',
              description: 'Votre Vitesse passe à 10,50 m.',
              effects: [
                {
                  application: 'passive',
                  passive: {
                    kind: 'set',
                    target: 'speed',
                    formula: { kind: 'constant', value: FAST_WALKING_SPEED },
                  },
                },
              ],
            },
            cantripTrait('wood-elf-cantrip', 'Druidisme', 'druidcraft'),
          ],
        },
      ],
    },
  },

  {
    key: 'gnome',
    name: 'Gnome',
    size: 'Small',
    speed: WALKING_SPEED,
    darkvision: DARKVISION_SHORT,
    traits: [
      darkvisionTrait(DARKVISION_SHORT),
      {
        key: 'gnomish-cunning',
        name: 'Ruse gnome',
        description:
          "Avantage aux jets de sauvegarde d'Intelligence, de Sagesse et de Charisme.",
        effects: (['intelligence', 'wisdom', 'charisma'] as const).map(
          (ability): Effect => ({
            application: 'passive',
            passive: { kind: 'advantage', target: 'savingThrow', ability },
          }),
        ),
      },
    ],
    lineage: {
      label: 'Lignage gnome',
      spellcastingAbilityOptions: ['intelligence', 'wisdom', 'charisma'],
      options: [
        {
          key: 'forest-gnome',
          name: 'Gnome des forêts',
          description:
            'Le sort mineur Illusion mineure, et Communication avec les animaux toujours préparé.',
          traits: [
            cantripTrait('forest-gnome-cantrip', 'Illusion mineure', 'minor-illusion'),
            {
              key: 'forest-gnome-spell',
              name: 'Communication avec les animaux',
              description:
                "Toujours préparé. Vous pouvez le lancer sans emplacement autant de fois que votre bonus de maîtrise, récupéré au Repos long.",
              effects: [
                {
                  application: 'grant',
                  grants: {
                    spells: [
                      { spellKey: 'speak-with-animals', frequency: 'oncePerLongRest' },
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          key: 'rock-gnome',
          name: 'Gnome des roches',
          description:
            'Les sorts mineurs Réparation et Prestidigitation, et la fabrication de petits appareils mécaniques.',
          traits: [
            cantripTrait('rock-gnome-mending', 'Réparation', 'mending'),
            cantripTrait('rock-gnome-prestidigitation', 'Prestidigitation', 'prestidigitation'),
            {
              key: 'tinker',
              name: 'Bricolage',
              description:
                "En 10 minutes, vous créez un appareil mécanique de taille TP portant un effet de Prestidigitation. Trois au maximum, huit heures chacun.",
              effects: [
                {
                  application: 'informational',
                  note: 'Trois appareils mécaniques simultanés au maximum, huit heures chacun.',
                },
              ],
            },
          ],
        },
      ],
    },
  },

  {
    key: 'goliath',
    name: 'Goliath',
    size: 'Medium',
    speed: FAST_WALKING_SPEED,
    darkvision: 0,
    traits: [
      {
        key: 'powerful-build',
        name: 'Forte carrure',
        description:
          "Avantage aux jets de caractéristique pour mettre fin à l'état Agrippé, et capacité de charge d'une créature d'une taille supérieure.",
        effects: [
          {
            application: 'passive',
            passive: { kind: 'advantage', target: 'skillCheck', against: 'grappled' },
          },
          {
            application: 'informational',
            note: 'Capacité de charge calculée comme une créature de taille supérieure.',
          },
        ],
      },
    ],
    lineage: {
      label: 'Ascendance gigante',
      options: [
        {
          key: 'cloud-giant',
          name: 'Saut des nuées',
          description: 'Par une action Bonus, téléportation de 9 m vers une case libre visible.',
          traits: [giantAncestryTrait('cloud-giant', 'Saut des nuées', 'Téléportation de 9 m par une action Bonus.')],
        },
        {
          key: 'fire-giant',
          name: 'Brûlure ignée',
          description: 'Sur un coup au but, 1d10 dégâts de feu supplémentaires.',
          traits: [giantAncestryTrait('fire-giant', 'Brûlure ignée', '1d10 dégâts de feu supplémentaires sur un coup au but.')],
        },
        {
          key: 'frost-giant',
          name: 'Froid mordant',
          description: 'Sur un coup au but, 1d6 dégâts de froid et Vitesse réduite de 3 m.',
          traits: [giantAncestryTrait('frost-giant', 'Froid mordant', '1d6 dégâts de froid et Vitesse de la cible réduite de 3 m.')],
        },
        {
          key: 'hill-giant',
          name: 'Renversement des coteaux',
          description: "Sur un coup au but contre une créature de taille G ou moins, état À terre.",
          traits: [giantAncestryTrait('hill-giant', 'Renversement des coteaux', "Cible de taille G ou moins mise À terre sur un coup au but.")],
        },
        {
          key: 'stone-giant',
          name: 'Endurance de la pierre',
          description: 'En Réaction, réduisez les dégâts subis de 1d12 plus votre modificateur de Constitution.',
          traits: [giantAncestryTrait('stone-giant', 'Endurance de la pierre', 'Réaction : réduire les dégâts de 1d12 + modificateur de Constitution.')],
        },
        {
          key: 'storm-giant',
          name: 'Tonnerre des cieux',
          description: 'En Réaction contre une source de dégâts à 18 m, 1d8 dégâts de tonnerre.',
          traits: [giantAncestryTrait('storm-giant', 'Tonnerre des cieux', 'Réaction : 1d8 dégâts de tonnerre à la source, à 18 m.')],
        },
      ],
    },
  },

  {
    key: 'halfling',
    name: 'Halfelin',
    size: 'Small',
    speed: WALKING_SPEED,
    darkvision: 0,
    traits: [
      {
        key: 'brave',
        name: 'Brave',
        description:
          "Avantage aux jets de sauvegarde pour éviter ou mettre fin à l'état Effrayé.",
        effects: [
          {
            application: 'passive',
            passive: { kind: 'advantage', target: 'savingThrow', against: 'frightened' },
          },
        ],
      },
      {
        key: 'halfling-nimbleness',
        name: 'Agilité halfeline',
        description:
          "Vous traversez la case de toute créature d'une taille supérieure à la vôtre, sans pouvoir vous y arrêter.",
        effects: [
          {
            application: 'informational',
            note: "Traversée des cases occupées par une créature plus grande que soi.",
          },
        ],
      },
      {
        key: 'halfling-luck',
        name: 'Chance',
        description:
          'Lorsque vous obtenez un 1 sur un d20, vous relancez le dé et gardez le nouveau résultat.',
        effects: [
          {
            application: 'reactive',
            trigger: { event: 'onD20Test', action: 'noAction' },
            note: 'Relance obligatoire des 1 naturels ; le nouveau résultat est conservé.',
          },
        ],
      },
      {
        key: 'naturally-stealthy',
        name: 'Discrétion naturelle',
        description:
          "Vous pouvez prendre l'action Furtivité même en n'étant masqué que par une créature d'au moins une taille supérieure.",
        effects: [
          {
            application: 'informational',
            note: "Action Furtivité derrière une créature plus grande que soi.",
          },
        ],
      },
    ],
    lineage: null,
  },

  {
    key: 'human',
    name: 'Humain',
    size: 'Medium',
    sizeOptions: ['Small', 'Medium'],
    speed: WALKING_SPEED,
    darkvision: 0,
    traits: [
      {
        key: 'resourceful',
        name: 'Ingénieux',
        description: 'Vous gagnez une Inspiration héroïque à la fin de chaque Repos long.',
        effects: [
          {
            application: 'informational',
            note: 'Inspiration héroïque à la fin de chaque Repos long.',
          },
        ],
      },
      {
        key: 'skillful',
        name: 'Compétent',
        description: 'Vous maîtrisez une compétence de votre choix.',
        effects: [
          {
            application: 'grant',
            grants: { skillChoice: { count: 1, options: 'any' } },
          },
        ],
      },
      {
        key: 'versatile',
        name: 'Polyvalent',
        description: "Vous gagnez un don d'Origines de votre choix.",
        effects: [{ application: 'grant', grants: { originFeatChoice: true } }],
      },
    ],
    lineage: null,
  },

  {
    key: 'orc',
    name: 'Orc',
    size: 'Medium',
    speed: WALKING_SPEED,
    darkvision: DARKVISION_LONG,
    traits: [
      darkvisionTrait(DARKVISION_LONG),
      {
        key: 'adrenaline-rush',
        name: "Poussée d'adrénaline",
        description:
          "Par une action Bonus, vous prenez l'action Foncer et gagnez un nombre de points de vie temporaires égal à votre bonus de maîtrise.",
        effects: [
          {
            application: 'active',
            resource: {
              key: 'adrenalineRush',
              max: proficiencyBonus(),
              recovery: 'shortRest',
            },
            trigger: { event: 'onTurnStart', action: 'bonusAction' },
          },
        ],
      },
      {
        key: 'relentless-endurance',
        name: 'Acharnement',
        description:
          "Lorsque vous tombez à 0 point de vie sans être tué sur le coup, vous pouvez à la place tomber à 1 point de vie. Une fois par Repos long.",
        effects: [
          {
            application: 'reactive',
            trigger: { event: 'onDropToZeroHp', action: 'noAction' },
            resource: {
              key: 'relentlessEndurance',
              max: { kind: 'constant', value: 1 },
              recovery: 'longRest',
            },
          },
        ],
      },
    ],
    lineage: null,
  },

  {
    key: 'tiefling',
    name: 'Tieffelin',
    size: 'Medium',
    sizeOptions: ['Small', 'Medium'],
    speed: WALKING_SPEED,
    darkvision: DARKVISION_SHORT,
    traits: [
      darkvisionTrait(DARKVISION_SHORT),
      {
        key: 'otherworldly-presence',
        name: "Présence d'Outremonde",
        description:
          "Vous connaissez le sort mineur Thaumaturgie, lancé avec la caractéristique de votre Héritage fiélon.",
        effects: [
          {
            application: 'grant',
            grants: { spells: [{ spellKey: 'thaumaturgy', frequency: 'atWill' }] },
          },
        ],
      },
    ],
    lineage: {
      label: 'Héritage fiélon',
      spellcastingAbilityOptions: ['intelligence', 'wisdom', 'charisma'],
      options: [
        {
          key: 'abyssal',
          name: 'Abyssal',
          description: 'Résistance au poison et le sort mineur Bouffée de poison.',
          traits: [
            {
              key: 'abyssal-resistance',
              name: 'Résistance abyssale',
              description: 'Résistance aux dégâts de poison.',
              effects: [resistanceEffect('poison')],
            },
            cantripTrait('abyssal-cantrip', 'Bouffée de poison', 'poison-spray'),
          ],
        },
        {
          key: 'chthonian',
          name: 'Chtonien',
          description: 'Résistance au nécrotique et le sort mineur Contact glacial.',
          traits: [
            {
              key: 'chthonian-resistance',
              name: 'Résistance chtonienne',
              description: 'Résistance aux dégâts nécrotiques.',
              effects: [resistanceEffect('necrotic')],
            },
            cantripTrait('chthonian-cantrip', 'Contact glacial', 'chill-touch'),
          ],
        },
        {
          key: 'infernal',
          name: 'Infernal',
          description: 'Résistance au feu et le sort mineur Trait de feu.',
          traits: [
            {
              key: 'infernal-resistance',
              name: 'Résistance infernale',
              description: 'Résistance aux dégâts de feu.',
              effects: [resistanceEffect('fire')],
            },
            cantripTrait('infernal-cantrip', 'Trait de feu', 'fire-bolt'),
          ],
        },
      ],
    },
  },
];

function giantAncestryTrait(key: string, name: string, note: string): Feature {
  return {
    key,
    name,
    description: note,
    effects: [
      {
        application: 'active',
        resource: {
          key: 'giantAncestry',
          max: proficiencyBonus(),
          recovery: 'longRest',
        },
        note,
      },
    ],
  };
}

export const SPECIES: Readonly<Record<SpeciesKey, Species>> = Object.fromEntries(
  SPECIES_LIST.map((species) => [species.key, species]),
) as Record<SpeciesKey, Species>;
