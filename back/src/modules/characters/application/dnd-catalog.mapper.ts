import type {
  CatalogArmor,
  CatalogBackground,
  CatalogClass,
  CatalogClassChoice,
  CatalogFeature,
  CatalogLineageChoice,
  CatalogOriginFeat,
  CatalogSkillChoice,
  CatalogSpecies,
  CatalogSpell,
  DndCatalog,
} from '@donjon-dragon/shared/dnd-catalog-schema';

import { ARMORS, SHIELD } from '../domain/reference/armors';
import { BACKGROUNDS, type Background } from '../domain/reference/backgrounds';
import { CLASSES, type CharacterClass } from '../domain/reference/classes';
import { CLASS_ORDERS } from '../domain/reference/class-orders';
import { FIGHTING_STYLES } from '../domain/reference/fighting-styles';
import type { Feature, GrantPayload, SkillChoice } from '../domain/reference/effect';
import { ORIGIN_FEATS, type OriginFeat } from '../domain/reference/origin-feats';
import { SKILL_LABELS } from '../domain/reference/skills';
import { SPECIES, type Species } from '../domain/reference/species';
import type { Spell } from '../domain/reference/spells';

/**
 * Données de référence du domaine → catalogue HTTP.
 *
 * Le wizard a besoin de savoir quoi proposer ; il n'a pas besoin des effets. Un
 * `passive` avec sa formule ne veut rien dire pour un formulaire, et le front
 * n'a pas à savoir les lire — c'est le moteur qui les applique. Ce qui traverse
 * ici, ce sont des libellés et des bornes de choix.
 */
export function toDndCatalog(): DndCatalog {
  return {
    species: Object.values(SPECIES).map(toCatalogSpecies),
    classes: Object.values(CLASSES).map(toCatalogClass),
    backgrounds: Object.values(BACKGROUNDS).map(toCatalogBackground),
    originFeats: Object.values(ORIGIN_FEATS).map(toCatalogOriginFeat),
    armors: Object.values(ARMORS).map(toCatalogArmor),
    shieldArmorClassBonus: SHIELD.armorClassBonus,
    skillLabels: { ...SKILL_LABELS },
  };
}

function toCatalogSpecies(species: Species): CatalogSpecies {
  return {
    key: species.key,
    name: species.name,
    size: species.size,
    sizeOptions: [...(species.sizeOptions ?? [species.size])],
    speed: species.speed,
    darkvision: species.darkvision,
    traits: species.traits.map(toCatalogFeature),
    skillChoice: skillChoiceOf(species.traits),
    grantsOriginFeatChoice: grantsOriginFeatChoice(species.traits),
    lineage: toCatalogLineage(species),
  };
}

function toCatalogLineage(species: Species): CatalogLineageChoice | null {
  const { lineage } = species;
  if (!lineage) return null;

  return {
    label: lineage.label,
    spellcastingAbilityOptions: [...(lineage.spellcastingAbilityOptions ?? [])],
    options: lineage.options.map((option) => ({
      key: option.key,
      name: option.name,
      description: option.description,
      traits: option.traits.map(toCatalogFeature),
    })),
  };
}

function toCatalogClass(characterClass: CharacterClass): CatalogClass {
  return {
    key: characterClass.key,
    name: characterClass.name,
    primaryAbilities: [...characterClass.primaryAbilities],
    hitDie: characterClass.hitDie,
    savingThrows: [...characterClass.savingThrows],
    skillChoice: toCatalogSkillChoice(characterClass.skillChoice),
    toolProficiencies: [...characterClass.toolProficiencies],
    armorTraining: [...characterClass.armorTraining],
    weaponProficiencies: [...characterClass.weaponProficiencies],
    startingEquipment: { ...characterClass.startingEquipment },
    spellcasting: toCatalogSpellcasting(characterClass),
    level1Features: characterClass.level1Features.map(toCatalogFeature),
    expertiseCount: expertiseCountOf(characterClass.level1Features),
    level1Choices: level1ChoicesOf(characterClass),
  };
}

/**
 * Ce que la classe fait choisir au niveau 1, en plus de ses compétences : le
 * Style de combat du guerrier, l'Ordre du clerc et du druide. Le wizard en fait
 * une étape à part.
 */
function level1ChoicesOf(characterClass: CharacterClass): CatalogClassChoice[] {
  return [...fightingStyleChoice(characterClass), ...orderChoice(characterClass)];
}

function fightingStyleChoice(characterClass: CharacterClass): CatalogClassChoice[] {
  const grantsStyle = characterClass.level1Features
    .flatMap((feature) => feature.effects)
    .some((effect) => effect.grants?.feature === 'fightingStyle');
  if (!grantsStyle) return [];

  return [
    {
      key: 'fightingStyle',
      name: 'Style de combat',
      description: 'Vous obtenez un don de Style de combat de votre choix.',
      options: Object.values(FIGHTING_STYLES).map(toCatalogFeature),
    },
  ];
}

function orderChoice(characterClass: CharacterClass): CatalogClassChoice[] {
  const order = CLASS_ORDERS[characterClass.key];
  if (!order) return [];

  return [
    {
      key: order.key,
      name: order.name,
      description: order.description,
      options: order.options.map(toCatalogFeature),
    },
  ];
}

/** Le type de lanceur ne sort pas : au niveau 1 seul le pacte s'en distingue. */
function toCatalogSpellcasting(characterClass: CharacterClass) {
  const spellcasting = characterClass.spellcasting;
  if (!spellcasting) return null;

  return {
    ability: spellcasting.ability,
    cantripsKnown: spellcasting.cantripsKnown,
    spellsPrepared: spellcasting.spellsPrepared,
    level1Slots: spellcasting.level1Slots,
    focus: spellcasting.focus,
  };
}

function toCatalogBackground(background: Background): CatalogBackground {
  return {
    key: background.key,
    name: background.name,
    description: background.description,
    abilityBonuses: [...background.abilityBonuses],
    originFeat: background.originFeat,
    originFeatSpellList: background.originFeatSpellList ?? null,
    skillProficiencies: [...background.skillProficiencies],
    toolProficiency: background.toolProficiency,
    equipment: { ...background.equipment },
  };
}

/**
 * Le wizard a besoin de savoir qu'un don attend un paramétrage — sinon Initié à
 * la magie arrive sans liste ni caractéristique, et Doué sans ses trois
 * maîtrises. Tout se lit dans les effets déjà écrits, il n'y a pas de donnée à
 * ajouter au catalogue du domaine.
 */
function toCatalogOriginFeat(feat: OriginFeat): CatalogOriginFeat {
  const grants = feat.effects.flatMap((effect) => (effect.grants ? [effect.grants] : []));

  return {
    key: feat.key,
    name: feat.name,
    description: feat.description,
    repeatable: feat.repeatable,
    spellcastingChoice: spellcastingChoiceOf(grants),
    skillOrToolChoiceCount: sumOf(grants, (grant) => grant.skillOrToolChoiceCount),
    toolChoiceCount: sumOf(grants, (grant) => grant.toolChoice?.count),
  };
}

function spellcastingChoiceOf(
  grants: readonly GrantPayload[],
): CatalogOriginFeat['spellcastingChoice'] {
  const choice = grants.flatMap((grant) =>
    grant.spellcastingChoice ? [grant.spellcastingChoice] : [],
  )[0];
  if (!choice) return null;

  return {
    abilityOptions: [...choice.abilityOptions],
    spellListOptions: [...choice.spellListOptions],
    cantripsKnown: choice.cantripsKnown,
    spellsPrepared: choice.spellsPrepared,
  };
}

function sumOf(
  grants: readonly GrantPayload[],
  read: (grant: GrantPayload) => number | undefined,
): number {
  return grants.reduce((total, grant) => total + (read(grant) ?? 0), 0);
}

function toCatalogArmor(armor: (typeof ARMORS)[string]): CatalogArmor {
  return { ...armor };
}

export function toCatalogSpell(spell: Spell): CatalogSpell {
  return {
    key: spell.key,
    name: spell.name,
    level: spell.level,
    school: spell.school,
    castingTime: spell.castingTime,
    range: spell.range,
    duration: spell.duration,
    concentration: spell.concentration,
    ritual: spell.ritual,
    description: spell.description,
  };
}

function toCatalogFeature(feature: Feature): CatalogFeature {
  return { key: feature.key, name: feature.name, description: feature.description };
}

function toCatalogSkillChoice(choice: SkillChoice): CatalogSkillChoice {
  return {
    count: choice.count,
    options: choice.options === 'any' ? 'any' : [...choice.options],
  };
}

/** Les Sens aiguisés de l'elfe et le Compétent de l'humain, seuls cas au niveau 1. */
function skillChoiceOf(traits: readonly Feature[]): CatalogSkillChoice | null {
  const choice = traits
    .flatMap((trait) => trait.effects)
    .flatMap((effect) => (effect.grants?.skillChoice ? [effect.grants.skillChoice] : []))
    .at(0);

  return choice ? toCatalogSkillChoice(choice) : null;
}

function grantsOriginFeatChoice(traits: readonly Feature[]): boolean {
  return traits
    .flatMap((trait) => trait.effects)
    .some((effect) => effect.grants?.originFeatChoice === true);
}

function expertiseCountOf(features: readonly Feature[]): number {
  return features
    .flatMap((feature) => feature.effects)
    .reduce((total, effect) => total + (effect.grants?.expertiseChoiceCount ?? 0), 0);
}
