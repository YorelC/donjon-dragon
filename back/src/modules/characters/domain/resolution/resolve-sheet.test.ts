// Les cas concrets du moteur. Chaque test est un personnage entier, écrit à la
// main, dont on vérifie les chiffres un à un — c'est la seule façon d'attraper
// une règle appliquée à l'envers.

import { describe, expect, it } from 'vitest';

import { aBuild, type BuildDraft } from '../../testing/character-build.fixture';
import { resolveSheet } from './resolve-sheet';

const CHAIN_MAIL = 'chain-mail';

describe('guerrier nain en cotte de mailles', () => {
  const sheet = resolveSheet(
    aBuild({
      speciesKey: 'dwarf',
      classKey: 'fighter',
      backgroundKey: 'soldier',
      base: {
        strength: 15,
        dexterity: 13,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
      },
      backgroundBonuses: { strength: 2, constitution: 1 },
      armorKey: CHAIN_MAIL,
      choices: [
        { source: { type: 'class', key: 'fighter' }, skills: ['perception', 'survival'] },
      ],
    }),
  );

  it('applique les bonus de caractéristique de son historique', () => {
    expect(sheet.abilities.strength).toEqual({ score: 17, modifier: 3 });
    expect(sheet.abilities.constitution).toEqual({ score: 15, modifier: 2 });
    expect(sheet.abilities.dexterity).toEqual({ score: 13, modifier: 1 });
  });

  it("tient la CA de l'armure, sans y ajouter la Dextérité", () => {
    expect(sheet.armorClass.value).toBe(16);
    expect(sheet.armorClass.sources).toEqual(['Cotte de mailles']);
  });

  it('ajoute la Ténacité naine au maximum du dé de vie', () => {
    expect(sheet.maxHitPoints.value).toBe(13);
    expect(sheet.maxHitPoints.sources).toEqual(['Dé de vie d10', 'Ténacité naine']);
  });

  it('maîtrise les jets de sauvegarde de sa classe, et eux seuls', () => {
    expect(sheet.savingThrows.strength).toEqual({
      ability: 'strength',
      modifier: 5,
      proficient: true,
    });
    expect(sheet.savingThrows.constitution.modifier).toBe(4);
    expect(sheet.savingThrows.dexterity).toEqual({
      ability: 'dexterity',
      modifier: 1,
      proficient: false,
    });
  });

  it('cumule les compétences de la classe et de l’historique', () => {
    expect([...sheet.proficiencies.skills].sort()).toEqual([
      'athletics',
      'intimidation',
      'perception',
      'survival',
    ]);
    expect(sheet.passivePerception).toBe(13);
  });

  it('garde la vitesse et la vision nocturne de son espèce', () => {
    expect(sheet.speed.value).toBe(9);
    expect(sheet.darkvision).toBe(36);
  });
});

describe('barbare torse nu', () => {
  const draft = {
    speciesKey: 'halfling',
    classKey: 'barbarian',
    backgroundKey: 'farmer',
    base: {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
    },
    backgroundBonuses: { constitution: 2, strength: 1 },
  } as const;

  it('remplace la CA de base par sa Défense sans armure', () => {
    const sheet = resolveSheet(aBuild({ ...draft }));

    expect(sheet.abilities.constitution.modifier).toBe(2);
    expect(sheet.armorClass.value).toBe(14);
    expect(sheet.armorClass.sources).toEqual(['Défense sans armure']);
  });

  it('cumule le bouclier avec sa Défense sans armure', () => {
    const sheet = resolveSheet(aBuild({ ...draft, shield: true }));

    expect(sheet.armorClass.value).toBe(16);
    expect(sheet.armorClass.sources).toEqual(['Défense sans armure', 'Bouclier']);
  });

  it('perd sa Défense sans armure dès qu’il enfile une armure', () => {
    const sheet = resolveSheet(aBuild({ ...draft, armorKey: CHAIN_MAIL }));

    expect(sheet.armorClass.value).toBe(16);
    expect(sheet.armorClass.sources).toEqual(['Cotte de mailles']);
  });

  it('expose la Rage comme ressource, sans la déclencher', () => {
    const sheet = resolveSheet(aBuild({ ...draft }));
    const rage = sheet.resources.find((resource) => resource.key === 'rageUses');

    expect(rage).toEqual({
      key: 'rageUses',
      feature: 'Rage',
      max: 2,
      recovery: 'longRest',
    });
  });
});

describe('moine, dont la Défense sans armure exclut le bouclier', () => {
  const draft = {
    speciesKey: 'human',
    classKey: 'monk',
    backgroundKey: 'guard',
    base: {
      strength: 12,
      dexterity: 15,
      constitution: 13,
      intelligence: 8,
      wisdom: 14,
      charisma: 10,
    },
    backgroundBonuses: { wisdom: 2, strength: 1 },
    choices: [{ source: { type: 'species', key: 'human' }, skills: ['acrobatics'] }],
  } as const;

  it('additionne Dextérité et Sagesse quand il ne porte rien', () => {
    const sheet = resolveSheet(aBuild({ ...draft, choices: [...draft.choices] }));

    expect(sheet.armorClass.value).toBe(15);
    expect(sheet.armorClass.sources).toEqual(['Défense sans armure']);
  });

  it('retombe sur 10 plus Dextérité s’il prend un bouclier', () => {
    const sheet = resolveSheet(
      aBuild({ ...draft, choices: [...draft.choices], shield: true }),
    );

    expect(sheet.armorClass.value).toBe(14);
    expect(sheet.armorClass.sources).toEqual(['Sans armure', 'Bouclier']);
  });

  it('remplace les dégâts de la Frappe à mains nues', () => {
    const sheet = resolveSheet(aBuild({ ...draft, choices: [...draft.choices] }));

    expect(sheet.unarmedDamage).toBe('1d6');
  });
});

describe('roublard haut-elfe avec le don Doué', () => {
  const sheet = resolveSheet(
    aBuild({
      speciesKey: 'elf',
      lineageKey: 'high-elf',
      classKey: 'rogue',
      backgroundKey: 'charlatan',
      base: {
        strength: 8,
        dexterity: 15,
        constitution: 13,
        intelligence: 14,
        wisdom: 10,
        charisma: 12,
      },
      backgroundBonuses: { dexterity: 2, charisma: 1 },
      choices: [
        {
          source: { type: 'class', key: 'rogue' },
          skills: ['acrobatics', 'investigation', 'perception', 'stealth'],
          expertise: ['stealth', 'perception'],
        },
        { source: { type: 'species', key: 'elf' }, skills: ['insight'] },
        {
          source: { type: 'feat', key: 'skilled' },
          skills: ['athletics', 'history', 'persuasion'],
        },
      ],
    }),
  );

  it('réunit les compétences de quatre sources, sans doublon', () => {
    expect([...sheet.proficiencies.skills].sort()).toEqual([
      'acrobatics',
      'athletics',
      'deception',
      'history',
      'insight',
      'investigation',
      'perception',
      'persuasion',
      'sleightOfHand',
      'stealth',
    ]);
  });

  it('double le bonus de maîtrise sur l’expertise, et lui seul', () => {
    const skillOf = (name: string) => sheet.skills.find((skill) => skill.skill === name);

    expect(skillOf('stealth')).toEqual({
      skill: 'stealth',
      ability: 'dexterity',
      modifier: 7,
      proficient: true,
      expert: true,
    });
    expect(skillOf('acrobatics')?.modifier).toBe(5);
    expect(skillOf('nature')?.modifier).toBe(2);
  });

  it('reçoit le sort mineur de son lignage', () => {
    const cantrip = sheet.features.find((feature) => feature.name === 'Prestidigitation');

    expect(cantrip?.sourceType).toBe('lineage');
    expect(cantrip?.source).toBe('Haut-elfe');
  });
});

describe('clerc acolyte', () => {
  const sheet = resolveSheet(
    aBuild({
      speciesKey: 'human',
      classKey: 'cleric',
      backgroundKey: 'acolyte',
      base: {
        strength: 12,
        dexterity: 10,
        constitution: 13,
        intelligence: 14,
        wisdom: 15,
        charisma: 8,
      },
      backgroundBonuses: { wisdom: 2, intelligence: 1 },
      choices: [
        { source: { type: 'species', key: 'human' }, skills: ['medicine'] },
        { source: { type: 'class', key: 'cleric' }, skills: ['insight', 'religion'] },
        {
          source: { type: 'feat', key: 'magic-initiate' },
          spellcastingAbility: 'wisdom',
          spellList: 'cleric',
          spells: ['thaumaturgy', 'mending', 'detect-magic'],
        },
      ],
    }),
  );

  it('calcule le DD et le bonus d’attaque de sa classe', () => {
    const clericCasting = sheet.spellcasting.find((entry) => entry.origin === 'Clerc');

    expect(sheet.abilities.wisdom).toEqual({ score: 17, modifier: 3 });
    expect(clericCasting?.saveDc).toBe(13);
    expect(clericCasting?.attackBonus).toBe(5);
    expect(clericCasting?.level1Slots).toBe(2);
  });

  it('ajoute une seconde incantation pour le don de son historique', () => {
    const featCasting = sheet.spellcasting.find((entry) => entry.origin.startsWith('Initié'));

    expect(featCasting?.origin).toBe('Initié à la magie (Clerc)');
    expect(featCasting?.cantripsKnown).toEqual(['thaumaturgy', 'mending']);
    expect(featCasting?.spellsPrepared).toEqual(['detect-magic']);
    expect(featCasting?.level1Slots).toBe(0);
  });
});

// Doué n'a que des effets `grant`. Tant que resolveFeatures les jetait, le don
// du noble n'apparaissait nulle part sur sa fiche.
describe('noble magicien humain', () => {
  const sheet = resolveSheet(
    aBuild({
      speciesKey: 'human',
      classKey: 'wizard',
      backgroundKey: 'noble',
      base: {
        strength: 8,
        dexterity: 14,
        constitution: 13,
        intelligence: 15,
        wisdom: 12,
        charisma: 10,
      },
      backgroundBonuses: { intelligence: 2, charisma: 1 },
      choices: [
        { source: { type: 'species', key: 'human' }, skills: ['medicine'] },
        { source: { type: 'class', key: 'wizard' }, skills: ['arcana', 'history'] },
        {
          source: { type: 'feat', key: 'skilled' },
          skills: ['investigation', 'nature', 'religion'],
        },
      ],
    }),
  );

  it('affiche le don de son historique', () => {
    const skilled = sheet.features.find((feature) => feature.name === 'Doué');

    expect(skilled).toBeDefined();
    expect(skilled?.source).toBe('Doué');
    expect(skilled?.applications).toEqual(['grant']);
  });

  it('ne montre chaque capacité qu’une fois, quel que soit son nombre d’effets', () => {
    const names = sheet.features.map((feature) => `${feature.source}/${feature.name}`);

    expect(new Set(names).size).toBe(names.length);
  });

  it('regroupe les modes d’une capacité qui en porte plusieurs', () => {
    const resilience = sheet.features.find((feature) => feature.name === 'Polyvalent');

    expect(resilience?.applications).toEqual(['grant']);
  });
});

describe('guerrier au Style de combat Défense', () => {
  const draft: BuildDraft = {
    speciesKey: 'halfling',
    classKey: 'fighter',
    backgroundKey: 'soldier',
    base: {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    },
    backgroundBonuses: { strength: 2, constitution: 1 },
    choices: [
      {
        source: { type: 'class', key: 'fighter' },
        skills: ['perception', 'survival'],
        fightingStyle: 'defense',
      },
    ],
  };

  it('ajoute son point de CA quand une armure est portée', () => {
    const sheet = resolveSheet(aBuild({ ...draft, armorKey: CHAIN_MAIL }));

    expect(sheet.armorClass.value).toBe(17);
    expect(sheet.armorClass.sources).toEqual(['Cotte de mailles', 'Défense']);
  });

  // Sans ce filtre, un magicien qui prendrait Défense gagnerait un point de CA
  // qu'aucune règle ne lui accorde.
  it('ne donne rien à un personnage sans armure', () => {
    const sheet = resolveSheet(aBuild({ ...draft }));

    expect(sheet.armorClass.value).toBe(12);
    expect(sheet.armorClass.sources).toEqual(['Sans armure']);
  });
});

describe('clerc Protecteur', () => {
  const sheet = resolveSheet(
    aBuild({
      speciesKey: 'halfling',
      classKey: 'cleric',
      backgroundKey: 'acolyte',
      base: {
        strength: 8,
        dexterity: 10,
        constitution: 12,
        intelligence: 14,
        wisdom: 15,
        charisma: 13,
      },
      backgroundBonuses: { wisdom: 2, intelligence: 1 },
      choices: [
        {
          source: { type: 'class', key: 'cleric' },
          skills: ['insight', 'religion'],
          classOrder: 'protector',
        },
      ],
    }),
  );

  it('gagne les armures lourdes et les armes de guerre', () => {
    expect(sheet.proficiencies.armorTraining).toContain('heavy');
    expect(sheet.proficiencies.weapons).toContain('martial');
  });

  it('affiche son Ordre divin comme une capacité', () => {
    const order = sheet.features.find((feature) => feature.source === 'Ordre divin');

    expect(order?.name).toBe('Protecteur');
  });
});

describe('druide Mage', () => {
  // Sagesse laissée à 10 : son modificateur vaut 0, et le plancher du « minimum
  // +1 » est justement ce qui se vérifie ici.
  const sheet = resolveSheet(
    aBuild({
      speciesKey: 'halfling',
      classKey: 'druid',
      backgroundKey: 'artisan',
      base: {
        strength: 8,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 15,
      },
      backgroundBonuses: { dexterity: 2, intelligence: 1 },
      choices: [
        {
          source: { type: 'class', key: 'druid' },
          skills: ['arcana', 'nature'],
          classOrder: 'magician',
        },
      ],
    }),
  );

  const skillOf = (name: string) => sheet.skills.find((skill) => skill.skill === name);

  it('applique le plancher de +1 quand la Sagesse ne donne rien', () => {
    expect(sheet.abilities.wisdom.modifier).toBe(0);
    expect(skillOf('arcana')?.modifier).toBe(4);
    expect(skillOf('nature')?.modifier).toBe(4);
  });

  it('ne touche pas aux compétences que l’Ordre ne vise pas', () => {
    expect(skillOf('history')?.modifier).toBe(1);
  });
});

describe('occultiste', () => {
  it('récupère ses emplacements de pacte au Repos court', () => {
    const sheet = resolveSheet(
      aBuild({
        speciesKey: 'tiefling',
        lineageKey: 'infernal',
        classKey: 'warlock',
        backgroundKey: 'noble',
        base: {
          strength: 8,
          dexterity: 13,
          constitution: 14,
          intelligence: 12,
          wisdom: 10,
          charisma: 15,
        },
        backgroundBonuses: { charisma: 2, intelligence: 1 },
        choices: [
          { source: { type: 'feat', key: 'skilled' }, skills: ['arcana', 'stealth', 'survival'] },
        ],
      }),
    );
    const pact = sheet.spellcasting.find((entry) => entry.origin === 'Occultiste');

    expect(pact?.level1Slots).toBe(1);
    expect(pact?.slotsRecoverOnShortRest).toBe(true);
  });
});
