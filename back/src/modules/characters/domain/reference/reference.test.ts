// Les catalogues de référence sont écrits à la main depuis des sources qui
// n'avaient pas deux schémas identiques. Ce test est le filet : il vérifie que
// les clés se répondent d'un catalogue à l'autre et qu'aucun effet ne promet une
// mécanique sans porter la donnée qui va avec.

import { describe, expect, it } from 'vitest';

import { ABILITIES } from './abilities';
import { ARMORS, ARMOR_KEYS } from './armors';
import { BACKGROUNDS } from './backgrounds';
import { CLASSES, SPELLCASTING_CLASS_KEYS } from './classes';
import type { Effect, Feature, GrantPayload, PassiveEffect } from './effect';
import { BACKGROUND_KEYS, CLASS_KEYS, ORIGIN_FEAT_KEYS, SPECIES_KEYS } from './keys';
import { ORIGIN_FEATS } from './origin-feats';
import { ARMOR_TRAININGS, WEAPON_PROFICIENCIES } from './proficiencies';
import { SKILLS, SKILL_ABILITY } from './skills';
import { SPECIES } from './species';
import { SPELLS, spellsAvailableTo } from './spells';
import { WEAPONS } from './weapons';

const skillNames = new Set<string>(SKILLS);
const abilityNames = new Set<string>(ABILITIES);
const armorTrainings = new Set<string>(ARMOR_TRAININGS);
const weaponProficiencies = new Set<string>(WEAPON_PROFICIENCIES);

function speciesFeatures(): Feature[] {
  return Object.values(SPECIES).flatMap((species) => [
    ...species.traits,
    ...(species.lineage?.options.flatMap((lineage) => lineage.traits) ?? []),
  ]);
}

function allFeatures(): Feature[] {
  return [
    ...speciesFeatures(),
    ...Object.values(CLASSES).flatMap((characterClass) => characterClass.level1Features),
  ];
}

function allEffects(): Effect[] {
  return [
    ...allFeatures().flatMap((feature) => [...feature.effects]),
    ...Object.values(ORIGIN_FEATS).flatMap((feat) => [...feat.effects]),
  ];
}

function passives(): PassiveEffect[] {
  return allEffects().flatMap((effect) => (effect.passive ? [effect.passive] : []));
}

function grants(): GrantPayload[] {
  return allEffects().flatMap((effect) => (effect.grants ? [effect.grants] : []));
}

describe('catalogues de référence', () => {
  it('déclare exactement une entrée par clé annoncée', () => {
    expect(Object.keys(SPECIES).sort()).toEqual([...SPECIES_KEYS].sort());
    expect(Object.keys(CLASSES).sort()).toEqual([...CLASS_KEYS].sort());
    expect(Object.keys(BACKGROUNDS).sort()).toEqual([...BACKGROUND_KEYS].sort());
    expect(Object.keys(ORIGIN_FEATS).sort()).toEqual([...ORIGIN_FEAT_KEYS].sort());
  });

  it('associe une caractéristique à chacune des 18 compétences', () => {
    expect(SKILLS).toHaveLength(18);
    expect(Object.keys(SKILL_ABILITY).sort()).toEqual([...SKILLS].sort());
    expect(Object.values(SKILL_ABILITY).every((ability) => abilityNames.has(ability))).toBe(
      true,
    );
  });
});

describe('historiques', () => {
  it('octroient un don d’Origines qui existe', () => {
    Object.values(BACKGROUNDS).forEach((background) => {
      expect(ORIGIN_FEATS[background.originFeat]).toBeDefined();
    });
  });

  it("précise la liste de sorts quand le don est Initié à la magie", () => {
    Object.values(BACKGROUNDS)
      .filter((background) => background.originFeat === 'magic-initiate')
      .forEach((background) => {
        const spellList = background.originFeatSpellList;
        if (!spellList) throw new Error(`${background.key} : liste de sorts manquante`);
        expect(CLASSES[spellList]).toBeDefined();
      });
  });

  it('portent trois caractéristiques distinctes et deux compétences connues', () => {
    Object.values(BACKGROUNDS).forEach((background) => {
      expect(new Set(background.abilityBonuses).size).toBe(3);
      background.abilityBonuses.forEach((ability) => expect(abilityNames.has(ability)).toBe(true));
      expect(new Set(background.skillProficiencies).size).toBe(2);
      background.skillProficiencies.forEach((skill) => expect(skillNames.has(skill)).toBe(true));
    });
  });
});

describe('classes', () => {
  it('ne proposent que des compétences connues', () => {
    Object.values(CLASSES).forEach((characterClass) => {
      const { options } = characterClass.skillChoice;
      if (options === 'any') return;
      options.forEach((skill) => expect(skillNames.has(skill)).toBe(true));
    });
  });

  it('déclarent deux jets de sauvegarde distincts et connus', () => {
    Object.values(CLASSES).forEach((characterClass) => {
      expect(new Set(characterClass.savingThrows).size).toBe(2);
      characterClass.savingThrows.forEach((ability) =>
        expect(abilityNames.has(ability)).toBe(true),
      );
    });
  });

  it('ne déclarent que des maîtrises connues et un dé de vie pair', () => {
    Object.values(CLASSES).forEach((characterClass) => {
      expect([6, 8, 10, 12]).toContain(characterClass.hitDie);
      characterClass.armorTraining.forEach((training) =>
        expect(armorTrainings.has(training)).toBe(true),
      );
      characterClass.weaponProficiencies.forEach((proficiency) =>
        expect(weaponProficiencies.has(proficiency)).toBe(true),
      );
    });
  });

  // En 2024 le paladin et le rôdeur lancent des sorts dès le niveau 1, ce que la
  // note de docs/characteres/sorts.md — restée sur les règles 2014 — dit encore au niveau 2.
  it('recense huit lanceurs de sorts au niveau 1', () => {
    expect([...SPELLCASTING_CLASS_KEYS].sort()).toEqual([
      'bard',
      'cleric',
      'druid',
      'paladin',
      'ranger',
      'sorcerer',
      'warlock',
      'wizard',
    ]);
  });
});

describe('espèces', () => {
  it('proposent au moins deux lignages quand elles en imposent un', () => {
    Object.values(SPECIES).forEach((species) => {
      const { lineage } = species;
      if (!lineage) return;
      expect(lineage.options.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('donnent une taille cohérente avec ses variantes', () => {
    Object.values(SPECIES).forEach((species) => {
      if (!species.sizeOptions) return;
      expect(species.sizeOptions).toContain(species.size);
    });
  });
});

describe('effets', () => {
  it('portent la charge utile qu’annonce leur mode d’application', () => {
    allEffects().forEach((effect) => {
      if (effect.application === 'passive') expect(effect.passive).toBeDefined();
      if (effect.application === 'grant') expect(effect.grants).toBeDefined();
      if (effect.application === 'informational') expect(effect.note).toBeDefined();
    });
  });

  it('chiffrent les bonus et les remplacements', () => {
    passives()
      .filter((passive) => passive.kind === 'bonus' || passive.kind === 'set')
      .forEach((passive) => {
        expect(passive.target).toBeDefined();
        expect(passive.formula ?? passive.dice).toBeDefined();
      });
  });

  it('nomment le type de dégâts des résistances', () => {
    passives()
      .filter((passive) => passive.kind === 'resistance' || passive.kind === 'immunity')
      .forEach((passive) => expect(passive.damageType).toBeDefined());
  });

  it('ne font choisir que des compétences connues', () => {
    grants().forEach((grant) => {
      const choice = grant.skillChoice;
      if (!choice || choice.options === 'any') return;
      choice.options.forEach((skill) => expect(skillNames.has(skill)).toBe(true));
      expect(choice.options.length).toBeGreaterThanOrEqual(choice.count);
    });
  });

  it("ne proposent pour Initié à la magie que des listes de classe existantes", () => {
    grants()
      .flatMap((grant) => (grant.spellcastingChoice ? [grant.spellcastingChoice] : []))
      .forEach((choice) => {
        choice.spellListOptions.forEach((classKey) =>
          expect(CLASSES[classKey]).toBeDefined(),
        );
        choice.abilityOptions.forEach((ability) =>
          expect(abilityNames.has(ability)).toBe(true),
        );
      });
  });
});

describe('sorts', () => {
  it('ne contient que des niveaux 0 et 1', () => {
    Object.values(SPELLS).forEach((spell) => {
      expect([0, 1]).toContain(spell.level);
    });
  });

  it('offre à chaque classe lanceuse de quoi remplir sa fiche', () => {
    SPELLCASTING_CLASS_KEYS.forEach((classKey) => {
      const spellcasting = CLASSES[classKey].spellcasting;
      if (!spellcasting) throw new Error(`${classKey} : incantation manquante`);
      const available = spellsAvailableTo(classKey);
      const cantrips = available.filter((spell) => spell.level === 0);
      const level1 = available.filter((spell) => spell.level === 1);
      expect(cantrips.length).toBeGreaterThanOrEqual(spellcasting.cantripsKnown);
      expect(level1.length).toBeGreaterThanOrEqual(spellcasting.spellsPrepared);
    });
  });

  it('ne voit octroyer que des sorts qui existent', () => {
    grants()
      .flatMap((grant) => grant.spells ?? [])
      .forEach((granted) => {
        expect(SPELLS[granted.spellKey]).toBeDefined();
      });
  });
});

describe('équipement', () => {
  it('range chaque armure dans une famille de maîtrise connue', () => {
    expect(ARMOR_KEYS.length).toBeGreaterThan(0);
    Object.values(ARMORS).forEach((armor) => {
      expect(armorTrainings.has(armor.training)).toBe(true);
      expect(armor.baseArmorClass).toBeGreaterThan(0);
    });
  });

  it('donne des dégâts à chaque arme', () => {
    Object.values(WEAPONS).forEach((weapon) => {
      expect(weapon.damageDice).toMatch(/^\d+(d\d+)?$/);
    });
  });
});
