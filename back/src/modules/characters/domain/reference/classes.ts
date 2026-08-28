// Les 12 classes de D&D 2024, niveau 1 uniquement.
// Sources : docs/characteres/classes/*.json
//
// Les douze fichiers d'origine n'avaient pas deux schémas identiques :
// `skillProficiencies` contre `skillChoices`, `hitDie: "d10"` contre
// `hitDie: 10`, `armorTraining` en tableau de clés contre prose française, des
// compétences tantôt en clés anglaises, tantôt en français accentué, tantôt en
// français sans accent, le moine enveloppé dans un objet `class`, et un
// `"sagesse"` égaré au milieu des jets de sauvegarde du magicien. Tout est
// ramené ici à une seule forme.
//
// La progression 2-20 et les sous-classes sont hors périmètre : en 2024 aucune
// classe ne choisit sa sous-classe avant le niveau 3.

import type { Ability } from './abilities';
import type { Feature, SkillChoice, ToolChoice } from './effect';
import { abilityMod, constant, sum } from './effect';
import type { ClassKey } from './keys';
import type { ArmorTraining, WeaponProficiency } from './proficiencies';
import { goldOnly, type StartingEquipment } from './starting-equipment';
import { UNARMORED_BASE_ARMOR_CLASS } from './armors';

export type ClassSpellcastingKind = 'full' | 'half' | 'pact';

export interface ClassSpellcasting {
  kind: ClassSpellcastingKind;
  ability: Ability;
  cantripsKnown: number;
  spellsPrepared: number;
  level1Slots: number;
  focus: string;
}

export interface MulticlassPrerequisite {
  ability: Ability;
  minimum: number;
}

export interface CharacterClass {
  key: ClassKey;
  name: string;
  primaryAbilities: readonly Ability[];
  /** Le nombre de faces, pas la chaîne : « d10 » et 10 disaient la même chose. */
  hitDie: number;
  savingThrows: readonly [Ability, Ability];
  skillChoice: SkillChoice;
  weaponProficiencies: readonly WeaponProficiency[];
  armorTraining: readonly ArmorTraining[];
  toolProficiencies: readonly string[];
  toolChoice: ToolChoice | null;
  startingEquipment: StartingEquipment;
  spellcasting: ClassSpellcasting | null;
  level1Features: readonly Feature[];
  multiclassPrerequisites: readonly MulticlassPrerequisite[];
}

const MULTICLASS_MINIMUM = 13;

const requires = (ability: Ability): MulticlassPrerequisite => ({
  ability,
  minimum: MULTICLASS_MINIMUM,
});

/**
 * Barbare et moine partagent la même idée — troquer l'armure contre une
 * caractéristique — mais pas la même règle : le moine perd le bénéfice s'il
 * porte un bouclier.
 */
const unarmoredDefense = (ability: Ability, allowsShield: boolean): Feature => ({
  key: 'unarmored-defense',
  name: 'Défense sans armure',
  description: `Sans armure${allowsShield ? '' : ' ni bouclier'}, votre CA vaut 10 plus votre modificateur de Dextérité plus votre modificateur de ${ability === 'constitution' ? 'Constitution' : 'Sagesse'}.`,
  effects: [
    {
      application: 'passive',
      passive: {
        kind: 'set',
        target: 'armorClass',
        formula: sum(
          constant(UNARMORED_BASE_ARMOR_CLASS),
          abilityMod('dexterity'),
          abilityMod(ability),
        ),
        requires: allowsShield ? 'unarmored' : 'unarmoredWithoutShield',
      },
    },
  ],
});

const weaponMastery = (count: number): Feature => ({
  key: 'weapon-mastery',
  name: "Bottes d'arme",
  description: `Vous maîtrisez la botte de ${count} armes de votre choix parmi celles que vous savez utiliser. Vous pouvez en changer à chaque Repos long.`,
  effects: [{ application: 'grant', grants: { weaponMasteryCount: count } }],
});

const spellcastingFeature = (name: string): Feature => ({
  key: 'spellcasting',
  name: 'Sorts',
  description: `Vous savez lancer des sorts. ${name}`,
  effects: [{ application: 'informational', note: name }],
});

const CLASS_LIST: readonly CharacterClass[] = [
  {
    key: 'barbarian',
    name: 'Barbare',
    primaryAbilities: ['strength'],
    hitDie: 12,
    savingThrows: ['strength', 'constitution'],
    skillChoice: {
      count: 2,
      options: [
        'animalHandling',
        'athletics',
        'intimidation',
        'nature',
        'perception',
        'survival',
      ],
    },
    weaponProficiencies: ['simple', 'martial'],
    armorTraining: ['light', 'medium', 'shields'],
    toolProficiencies: [],
    toolChoice: null,
    startingEquipment: {
      options: [
        {
          id: 'A',
          label: "Hache à deux mains, 4 hachettes, sac d'explorateur, 15 po",
          entries: [
            { itemKey: 'greataxe', quantity: 1 },
            { itemKey: 'handaxe', quantity: 4 },
            { itemKey: 'explorers-pack', quantity: 1 },
          ],
          gold: 15,
        },
        goldOnly('B', 75),
      ],
    },
    spellcasting: null,
    level1Features: [
      {
        key: 'rage',
        name: 'Rage',
        description:
          "Par une action Bonus, vous entrez en Rage pendant 10 minutes : Avantage aux jets et sauvegardes de Force, +2 dégâts en corps à corps, Résistance aux dégâts contondants, perforants et tranchants.",
        effects: [
          {
            application: 'active',
            resource: { key: 'rageUses', max: constant(2), recovery: 'longRest' },
            trigger: { event: 'onTurnStart', action: 'bonusAction' },
          },
        ],
      },
      unarmoredDefense('constitution', true),
      weaponMastery(2),
    ],
    multiclassPrerequisites: [requires('strength')],
  },

  {
    key: 'bard',
    name: 'Barde',
    primaryAbilities: ['charisma'],
    hitDie: 8,
    savingThrows: ['dexterity', 'charisma'],
    skillChoice: { count: 3, options: 'any' },
    weaponProficiencies: ['simple'],
    armorTraining: ['light'],
    toolProficiencies: [],
    toolChoice: { count: 3, options: 'any' },
    startingEquipment: {
      options: [
        {
          id: 'A',
          label: "Armure de cuir, 2 dagues, instrument de musique au choix, sac d'artiste, 19 po",
          entries: [
            { itemKey: 'leather', quantity: 1 },
            { itemKey: 'dagger', quantity: 2 },
            { itemKey: 'musical-instrument', quantity: 1 },
            { itemKey: 'entertainers-pack', quantity: 1 },
          ],
          gold: 19,
        },
        goldOnly('B', 90),
      ],
    },
    spellcasting: {
      kind: 'full',
      ability: 'charisma',
      cantripsKnown: 2,
      spellsPrepared: 4,
      level1Slots: 2,
      focus: 'instrument de musique',
    },
    level1Features: [
      spellcastingFeature("Le Charisme est votre caractéristique d'incantation."),
      {
        key: 'bardic-inspiration',
        name: 'Inspiration bardique',
        description:
          "Par une action Bonus, vous donnez un d6 d'Inspiration bardique à un allié à 18 m, qu'il ajoute à un test, une attaque ou une sauvegarde.",
        effects: [
          {
            application: 'active',
            resource: {
              key: 'bardicInspiration',
              max: abilityMod('charisma'),
              recovery: 'longRest',
            },
            trigger: { event: 'onTurnStart', action: 'bonusAction' },
            note: "Dé d'Inspiration bardique : 1d6 au niveau 1.",
          },
        ],
      },
    ],
    multiclassPrerequisites: [requires('charisma')],
  },

  {
    key: 'cleric',
    name: 'Clerc',
    primaryAbilities: ['wisdom'],
    hitDie: 8,
    savingThrows: ['wisdom', 'charisma'],
    skillChoice: {
      count: 2,
      options: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
    },
    weaponProficiencies: ['simple'],
    armorTraining: ['light', 'medium', 'shields'],
    toolProficiencies: [],
    toolChoice: null,
    startingEquipment: {
      options: [
        {
          id: 'A',
          label:
            "Chemise de mailles, bouclier, masse d'armes, symbole sacré, sac d'ecclésiastique, 7 po",
          entries: [
            { itemKey: 'chain-shirt', quantity: 1 },
            { itemKey: 'shield', quantity: 1 },
            { itemKey: 'mace', quantity: 1 },
            { itemKey: 'holy-symbol', quantity: 1 },
            { itemKey: 'priests-pack', quantity: 1 },
          ],
          gold: 7,
        },
        goldOnly('B', 110),
      ],
    },
    spellcasting: {
      kind: 'full',
      ability: 'wisdom',
      cantripsKnown: 3,
      spellsPrepared: 4,
      level1Slots: 2,
      focus: 'symbole sacré',
    },
    level1Features: [
      spellcastingFeature("La Sagesse est votre caractéristique d'incantation."),
      {
        key: 'divine-order',
        name: 'Ordre divin',
        description:
          'Protecteur : maîtrise des armes de guerre et des armures lourdes. Thaumaturge : un sort mineur de clerc de plus, et votre modificateur de Sagesse ajouté aux tests d\'Arcanes et de Religion.',
        effects: [
          {
            application: 'informational',
            note: 'Choisir Protecteur (armes de guerre et armures lourdes) ou Thaumaturge (+1 sort mineur).',
          },
        ],
      },
    ],
    multiclassPrerequisites: [requires('wisdom')],
  },

  {
    key: 'druid',
    name: 'Druide',
    primaryAbilities: ['wisdom'],
    hitDie: 8,
    savingThrows: ['intelligence', 'wisdom'],
    skillChoice: {
      count: 2,
      options: [
        'animalHandling',
        'arcana',
        'insight',
        'medicine',
        'nature',
        'perception',
        'religion',
        'survival',
      ],
    },
    weaponProficiencies: ['simple'],
    armorTraining: ['light', 'shields'],
    toolProficiencies: ["matériel d'herboriste"],
    toolChoice: null,
    startingEquipment: {
      options: [
        {
          id: 'A',
          label:
            "Armure de cuir, bouclier, serpe, focaliseur druidique, sac d'explorateur, matériel d'herboriste, 9 po",
          entries: [
            { itemKey: 'leather', quantity: 1 },
            { itemKey: 'shield', quantity: 1 },
            { itemKey: 'sickle', quantity: 1 },
            { itemKey: 'druidic-focus', quantity: 1 },
            { itemKey: 'explorers-pack', quantity: 1 },
            { itemKey: 'herbalism-kit', quantity: 1 },
          ],
          gold: 9,
        },
        goldOnly('B', 50),
      ],
    },
    spellcasting: {
      kind: 'full',
      ability: 'wisdom',
      cantripsKnown: 2,
      spellsPrepared: 4,
      level1Slots: 2,
      focus: 'focaliseur druidique',
    },
    level1Features: [
      spellcastingFeature("La Sagesse est votre caractéristique d'incantation."),
      {
        key: 'druidic',
        name: 'Druidique',
        description:
          "Vous connaissez le druidique, langue secrète des druides, et détectez les messages druidiques cachés à 9 m.",
        effects: [{ application: 'grant', grants: { languages: ['druidic'] } }],
      },
      {
        key: 'primal-order',
        name: 'Ordre primitif',
        description:
          "Magicien : un sort mineur de plus et votre modificateur de Sagesse ajouté aux tests d'Arcanes et de Nature. Gardien : maîtrise des armes de guerre et des armures intermédiaires.",
        effects: [
          {
            application: 'informational',
            note: 'Choisir Magicien (+1 sort mineur) ou Gardien (armes de guerre et armures intermédiaires).',
          },
        ],
      },
    ],
    multiclassPrerequisites: [requires('wisdom')],
  },

  {
    key: 'fighter',
    name: 'Guerrier',
    primaryAbilities: ['strength', 'dexterity'],
    hitDie: 10,
    savingThrows: ['strength', 'constitution'],
    skillChoice: {
      count: 2,
      options: [
        'acrobatics',
        'animalHandling',
        'athletics',
        'history',
        'insight',
        'intimidation',
        'perception',
        'persuasion',
        'survival',
      ],
    },
    weaponProficiencies: ['simple', 'martial'],
    armorTraining: ['light', 'medium', 'heavy', 'shields'],
    toolProficiencies: [],
    toolChoice: null,
    // Seule classe à trois options : la deuxième vient de docs/characteres/
    // classes/fighter.json, que la forme en prose avait laissée de côté.
    startingEquipment: {
      options: [
        {
          id: 'A',
          label:
            "Cotte de mailles, épée à deux mains, fléau d'armes, 8 javelines, sac d'exploration souterraine, 4 po",
          entries: [
            { itemKey: 'chain-mail', quantity: 1 },
            { itemKey: 'greatsword', quantity: 1 },
            { itemKey: 'flail', quantity: 1 },
            { itemKey: 'javelin', quantity: 8 },
            { itemKey: 'dungeoneer-pack', quantity: 1 },
          ],
          gold: 4,
        },
        {
          id: 'B',
          label:
            "Armure de cuir clouté, cimeterre, épée courte, arc long, 20 flèches, carquois, sac d'exploration souterraine, 11 po",
          entries: [
            { itemKey: 'studded-leather', quantity: 1 },
            { itemKey: 'scimitar', quantity: 1 },
            { itemKey: 'shortsword', quantity: 1 },
            { itemKey: 'longbow', quantity: 1 },
            { itemKey: 'ammunition', quantity: 20 },
            { itemKey: 'quiver', quantity: 1 },
            { itemKey: 'dungeoneer-pack', quantity: 1 },
          ],
          gold: 11,
        },
        goldOnly('C', 155),
      ],
    },
    spellcasting: null,
    level1Features: [
      {
        key: 'fighting-style',
        name: 'Style de combat',
        description: 'Vous obtenez un don de Style de combat de votre choix.',
        effects: [{ application: 'grant', grants: { feature: 'fightingStyle' } }],
      },
      {
        key: 'second-wind',
        name: 'Second souffle',
        description:
          'Par une action Bonus, vous récupérez 1d10 plus votre niveau de guerrier en points de vie.',
        effects: [
          {
            application: 'active',
            resource: { key: 'secondWind', max: constant(2), recovery: 'shortRest' },
            trigger: { event: 'onTurnStart', action: 'bonusAction' },
          },
        ],
      },
      weaponMastery(3),
    ],
    multiclassPrerequisites: [requires('strength'), requires('dexterity')],
  },

  {
    key: 'monk',
    name: 'Moine',
    primaryAbilities: ['dexterity', 'wisdom'],
    hitDie: 8,
    savingThrows: ['strength', 'dexterity'],
    skillChoice: {
      count: 2,
      options: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
    },
    weaponProficiencies: ['simple', 'martialLight'],
    armorTraining: [],
    toolProficiencies: [],
    toolChoice: { count: 1, options: 'any' },
    startingEquipment: {
      options: [
        {
          id: 'A',
          label:
            "Lance, 5 dagues, outils d'artisan ou instrument de musique, sac d'explorateur, 11 po",
          entries: [
            { itemKey: 'spear', quantity: 1 },
            { itemKey: 'dagger', quantity: 5 },
            { itemKey: 'explorers-pack', quantity: 1 },
          ],
          gold: 11,
        },
        goldOnly('B', 50),
      ],
    },
    spellcasting: null,
    level1Features: [
      {
        key: 'martial-arts',
        name: 'Arts martiaux',
        description:
          'Votre Frappe à mains nues inflige 1d6 et peut utiliser la Dextérité. Une attaque à mains nues supplémentaire par action Bonus.',
        effects: [
          {
            application: 'passive',
            passive: {
              kind: 'set',
              target: 'unarmedDamage',
              dice: '1d6',
              formula: abilityMod('dexterity'),
            },
          },
        ],
      },
      unarmoredDefense('wisdom', false),
    ],
    multiclassPrerequisites: [requires('dexterity'), requires('wisdom')],
  },

  {
    key: 'paladin',
    name: 'Paladin',
    primaryAbilities: ['strength', 'charisma'],
    hitDie: 10,
    savingThrows: ['wisdom', 'charisma'],
    skillChoice: {
      count: 2,
      options: [
        'athletics',
        'insight',
        'intimidation',
        'medicine',
        'persuasion',
        'religion',
      ],
    },
    weaponProficiencies: ['simple', 'martial'],
    armorTraining: ['light', 'medium', 'heavy', 'shields'],
    toolProficiencies: [],
    toolChoice: null,
    startingEquipment: {
      options: [
        {
          id: 'A',
          label:
            "Cotte de mailles, bouclier, épée longue, 6 javelines, symbole sacré, sac d'ecclésiastique, 9 po",
          entries: [
            { itemKey: 'chain-mail', quantity: 1 },
            { itemKey: 'shield', quantity: 1 },
            { itemKey: 'longsword', quantity: 1 },
            { itemKey: 'javelin', quantity: 6 },
            { itemKey: 'holy-symbol', quantity: 1 },
            { itemKey: 'priests-pack', quantity: 1 },
          ],
          gold: 9,
        },
        goldOnly('B', 150),
      ],
    },
    spellcasting: {
      kind: 'half',
      ability: 'charisma',
      cantripsKnown: 0,
      spellsPrepared: 2,
      level1Slots: 2,
      focus: 'symbole sacré',
    },
    level1Features: [
      spellcastingFeature("Le Charisme est votre caractéristique d'incantation."),
      {
        key: 'lay-on-hands',
        name: 'Imposition des mains',
        description:
          "Vous disposez d'une réserve de soins égale à cinq fois votre niveau de paladin, puisée par une action Bonus au contact.",
        effects: [
          {
            application: 'active',
            resource: {
              key: 'layOnHands',
              max: { kind: 'perLevel', value: 5 },
              recovery: 'longRest',
            },
            trigger: { event: 'onTurnStart', action: 'bonusAction' },
          },
        ],
      },
      weaponMastery(2),
    ],
    multiclassPrerequisites: [requires('strength'), requires('charisma')],
  },

  {
    key: 'ranger',
    name: 'Rôdeur',
    primaryAbilities: ['dexterity', 'wisdom'],
    hitDie: 10,
    savingThrows: ['strength', 'dexterity'],
    skillChoice: {
      count: 3,
      options: [
        'animalHandling',
        'athletics',
        'insight',
        'investigation',
        'nature',
        'perception',
        'stealth',
        'survival',
      ],
    },
    weaponProficiencies: ['simple', 'martial'],
    armorTraining: ['light', 'medium', 'shields'],
    toolProficiencies: [],
    toolChoice: null,
    startingEquipment: {
      options: [
        {
          id: 'A',
          label:
            "Armure de cuir clouté, cimeterre, épée courte, arc long, 20 flèches, carquois, focaliseur druidique, sac d'explorateur, 7 po",
          entries: [
            { itemKey: 'studded-leather', quantity: 1 },
            { itemKey: 'scimitar', quantity: 1 },
            { itemKey: 'shortsword', quantity: 1 },
            { itemKey: 'longbow', quantity: 1 },
            { itemKey: 'ammunition', quantity: 20 },
            { itemKey: 'quiver', quantity: 1 },
            { itemKey: 'druidic-focus', quantity: 1 },
            { itemKey: 'explorers-pack', quantity: 1 },
          ],
          gold: 7,
        },
        goldOnly('B', 150),
      ],
    },
    spellcasting: {
      kind: 'half',
      ability: 'wisdom',
      cantripsKnown: 0,
      spellsPrepared: 2,
      level1Slots: 2,
      focus: 'focaliseur druidique',
    },
    level1Features: [
      spellcastingFeature("La Sagesse est votre caractéristique d'incantation."),
      {
        key: 'favored-enemy',
        name: 'Ennemi juré',
        description:
          'Le sort Marque du chasseur est toujours préparé et se lance deux fois par Repos long sans dépenser d\'emplacement.',
        effects: [
          {
            application: 'grant',
            grants: {
              spells: [{ spellKey: 'hunter-s-mark', frequency: 'oncePerLongRest' }],
            },
          },
        ],
      },
      weaponMastery(2),
    ],
    multiclassPrerequisites: [requires('dexterity'), requires('wisdom')],
  },

  {
    key: 'rogue',
    name: 'Roublard',
    primaryAbilities: ['dexterity'],
    hitDie: 8,
    savingThrows: ['dexterity', 'intelligence'],
    skillChoice: {
      count: 4,
      options: [
        'acrobatics',
        'athletics',
        'deception',
        'insight',
        'intimidation',
        'investigation',
        'perception',
        'performance',
        'persuasion',
        'sleightOfHand',
        'stealth',
      ],
    },
    weaponProficiencies: ['simple', 'martialFinesseOrLight'],
    armorTraining: ['light'],
    toolProficiencies: ['outils de voleur'],
    toolChoice: null,
    startingEquipment: {
      options: [
        {
          id: 'A',
          label:
            "Armure de cuir, 2 dagues, épée courte, arc court, 20 flèches, carquois, outils de voleur, sac de cambrioleur, 8 po",
          entries: [
            { itemKey: 'leather', quantity: 1 },
            { itemKey: 'dagger', quantity: 2 },
            { itemKey: 'shortsword', quantity: 1 },
            { itemKey: 'shortbow', quantity: 1 },
            { itemKey: 'ammunition', quantity: 20 },
            { itemKey: 'quiver', quantity: 1 },
            { itemKey: 'thieves-tools', quantity: 1 },
            { itemKey: 'burglars-pack', quantity: 1 },
          ],
          gold: 8,
        },
        goldOnly('B', 100),
      ],
    },
    spellcasting: null,
    level1Features: [
      {
        key: 'expertise',
        name: 'Expertise',
        description:
          'Votre bonus de maîtrise est doublé pour deux compétences que vous maîtrisez.',
        effects: [{ application: 'grant', grants: { expertiseChoiceCount: 2 } }],
      },
      {
        key: 'sneak-attack',
        name: 'Attaque sournoise',
        description:
          "Une fois par tour, vous infligez 1d6 dégâts supplémentaires avec une arme de Finesse ou à distance, si vous avez l'Avantage ou un allié adjacent à la cible.",
        effects: [
          {
            application: 'informational',
            note: 'Attaque sournoise : 1d6 au niveau 1, une fois par tour.',
          },
        ],
      },
      {
        key: 'thieves-cant',
        name: 'Ruse des voleurs',
        description:
          'Vous connaissez le jargon des voleurs, plus une autre langue de votre choix.',
        effects: [
          { application: 'grant', grants: { languageChoiceCount: 1 } },
          { application: 'grant', grants: { languages: ['thievesCant'] } },
        ],
      },
      weaponMastery(2),
    ],
    multiclassPrerequisites: [requires('dexterity')],
  },

  {
    key: 'sorcerer',
    name: 'Ensorceleur',
    primaryAbilities: ['charisma'],
    hitDie: 6,
    savingThrows: ['constitution', 'charisma'],
    skillChoice: {
      count: 2,
      options: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
    },
    weaponProficiencies: ['simple'],
    armorTraining: [],
    toolProficiencies: [],
    toolChoice: null,
    startingEquipment: {
      options: [
        {
          id: 'A',
          label:
            "Lance, 2 dagues, focaliseur arcanique (cristal), sac d'exploration souterraine, 28 po",
          entries: [
            { itemKey: 'spear', quantity: 1 },
            { itemKey: 'dagger', quantity: 2 },
            { itemKey: 'arcane-focus', quantity: 1 },
            { itemKey: 'dungeoneer-pack', quantity: 1 },
          ],
          gold: 28,
        },
        goldOnly('B', 50),
      ],
    },
    spellcasting: {
      kind: 'full',
      ability: 'charisma',
      cantripsKnown: 4,
      spellsPrepared: 2,
      level1Slots: 2,
      focus: 'focaliseur arcanique',
    },
    level1Features: [
      spellcastingFeature("Le Charisme est votre caractéristique d'incantation."),
      {
        key: 'innate-sorcery',
        name: 'Sorcellerie innée',
        description:
          'Par une action Bonus, pendant 1 minute : +1 au DD de sauvegarde de vos sorts et Avantage aux jets d\'attaque de vos sorts d\'ensorceleur.',
        effects: [
          {
            application: 'active',
            resource: { key: 'innateSorcery', max: constant(2), recovery: 'longRest' },
            trigger: { event: 'onTurnStart', action: 'bonusAction' },
          },
        ],
      },
    ],
    multiclassPrerequisites: [requires('charisma')],
  },

  {
    key: 'warlock',
    name: 'Occultiste',
    primaryAbilities: ['charisma'],
    hitDie: 8,
    savingThrows: ['wisdom', 'charisma'],
    skillChoice: {
      count: 2,
      options: [
        'arcana',
        'deception',
        'history',
        'intimidation',
        'investigation',
        'nature',
        'religion',
      ],
    },
    weaponProficiencies: ['simple'],
    armorTraining: ['light'],
    toolProficiencies: [],
    toolChoice: null,
    startingEquipment: {
      options: [
        {
          id: 'A',
          label:
            "Armure de cuir, serpe, 2 dagues, focaliseur arcanique (orbe), livre de savoir occulte, sac d'érudit, 15 po",
          entries: [
            { itemKey: 'leather', quantity: 1 },
            { itemKey: 'sickle', quantity: 1 },
            { itemKey: 'dagger', quantity: 2 },
            { itemKey: 'arcane-focus', quantity: 1 },
            { itemKey: 'book', quantity: 1 },
            { itemKey: 'scholars-pack', quantity: 1 },
          ],
          gold: 15,
        },
        goldOnly('B', 100),
      ],
    },
    spellcasting: {
      kind: 'pact',
      ability: 'charisma',
      cantripsKnown: 2,
      spellsPrepared: 2,
      level1Slots: 1,
      focus: 'focaliseur arcanique',
    },
    level1Features: [
      spellcastingFeature(
        "Le Charisme est votre caractéristique d'incantation. Vos emplacements de pacte se récupèrent au Repos court.",
      ),
      {
        key: 'eldritch-invocations',
        name: 'Manifestations occultes',
        description: 'Vous connaissez une Manifestation occulte de votre choix.',
        effects: [
          { application: 'informational', note: 'Une Manifestation occulte au niveau 1.' },
        ],
      },
    ],
    multiclassPrerequisites: [requires('charisma')],
  },

  {
    key: 'wizard',
    name: 'Magicien',
    primaryAbilities: ['intelligence'],
    hitDie: 6,
    savingThrows: ['intelligence', 'wisdom'],
    skillChoice: {
      count: 2,
      options: [
        'arcana',
        'history',
        'insight',
        'investigation',
        'medicine',
        'nature',
        'religion',
      ],
    },
    weaponProficiencies: ['simple'],
    armorTraining: [],
    toolProficiencies: [],
    toolChoice: null,
    startingEquipment: {
      options: [
        {
          id: 'A',
          label: "2 dagues, focaliseur arcanique (bâton), robe, grimoire, sac d'érudit, 5 po",
          entries: [
            { itemKey: 'dagger', quantity: 2 },
            { itemKey: 'arcane-focus', quantity: 1 },
            { itemKey: 'robe', quantity: 1 },
            { itemKey: 'spellbook', quantity: 1 },
            { itemKey: 'scholars-pack', quantity: 1 },
          ],
          gold: 5,
        },
        goldOnly('B', 55),
      ],
    },
    spellcasting: {
      kind: 'full',
      ability: 'intelligence',
      cantripsKnown: 3,
      spellsPrepared: 4,
      level1Slots: 2,
      focus: 'focaliseur arcanique ou grimoire',
    },
    level1Features: [
      spellcastingFeature("L'Intelligence est votre caractéristique d'incantation."),
      {
        key: 'ritual-adept',
        name: 'Savoir rituel',
        description:
          'Vous lancez comme rituel tout sort de votre grimoire portant la mention Rituel, sans le préparer.',
        effects: [
          { application: 'informational', note: 'Incantation rituelle depuis le grimoire.' },
        ],
      },
      {
        key: 'arcane-recovery',
        name: 'Restauration magique',
        description:
          "Une fois par jour, à la fin d'un Repos court, vous récupérez des emplacements de sorts dont la somme des niveaux vaut la moitié de votre niveau de magicien arrondie au supérieur.",
        effects: [
          {
            application: 'active',
            resource: {
              key: 'arcaneRecovery',
              max: constant(1),
              recovery: 'longRest',
            },
            trigger: { event: 'onShortRest', action: 'noAction' },
          },
        ],
      },
    ],
    multiclassPrerequisites: [requires('intelligence')],
  },
];

export const CLASSES: Readonly<Record<ClassKey, CharacterClass>> = Object.fromEntries(
  CLASS_LIST.map((characterClass) => [characterClass.key, characterClass]),
) as Record<ClassKey, CharacterClass>;

/** Les six classes qui lancent des sorts dès le niveau 1. */
export const SPELLCASTING_CLASS_KEYS: readonly ClassKey[] = CLASS_LIST.filter(
  (characterClass) => characterClass.spellcasting !== null,
).map((characterClass) => characterClass.key);
