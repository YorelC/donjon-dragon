import type {
  CatalogAlignment,
  CatalogBackground,
  CatalogBoundedChoice,
  CatalogClass,
  CatalogClassChoice,
  CatalogFeature,
  CatalogLanguage,
  CatalogLanguages,
  CatalogLineageChoice,
  CatalogOriginFeat,
  CatalogSkillChoice,
  CatalogSpecies,
  CatalogSpell,
  CatalogStartingEquipment,
  DndCatalog,
} from '@donjon-dragon/shared/dnd-catalog-schema';

import { ALIGNMENTS, ALIGNMENT_LABELS, type Alignment } from '../domain/character-identity';
import { BACKGROUNDS, type Background } from '../domain/reference/backgrounds';
import { CLASSES, type CharacterClass } from '../domain/reference/classes';
import { CLASS_ORDERS } from '../domain/reference/class-orders';
import { FIGHTING_STYLES } from '../domain/reference/fighting-styles';
import type { Feature, GrantPayload, SkillChoice } from '../domain/reference/effect';
import { ORIGIN_FEATS, type OriginFeat } from '../domain/reference/origin-feats';
import {
  ALL_CONCRETE_TOOLS,
  RARE_LANGUAGES,
  STANDARD_LANGUAGES,
  creationItemName,
  creationTrinkets,
  LEVEL_ONE_FAMILIAR_FORMS,
  LEVEL_ONE_INVOCATIONS,
} from '../domain/reference/creation-options';
import {
  backgroundToolOptions,
  classToolOptions,
  weaponMasteryCount,
  weaponMasteryOptions,
} from '../domain/resolution/class-options';
import { LANGUAGE_LABELS, type Language } from '../domain/reference/proficiencies';
import { SKILL_LABELS } from '../domain/reference/skills';
import {
  SPECIES,
  SPECIES_PHYSICAL_BOUNDS,
  type Species,
} from '../domain/reference/species';
import {
  backgroundEquipmentChoiceOptions,
  classEquipmentChoiceOptions,
  genericEquipmentItemKeys,
} from '../domain/resolution/resolve-starting-equipment';
import type { StartingEquipment } from '../domain/reference/starting-equipment';
import type { Spell } from '../domain/reference/spells';
import { WEAPONS } from '../domain/reference/weapons';

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
    ...catalogLabels(),
    languages: toCatalogLanguages(),
    alignments: ALIGNMENTS.map(toCatalogAlignment),
    trinkets: creationTrinkets(),
    invocations: LEVEL_ONE_INVOCATIONS.map(toCatalogInvocation),
    familiarForms: LEVEL_ONE_FAMILIAR_FORMS.map((key) => ({ key, name: familiarName(key) })),
    pactWeaponOptions: Object.values(WEAPONS)
      .filter((weapon) => weapon.kind === 'melee')
      .map((weapon) => ({ key: weapon.key, name: weapon.name })),
  };
}

function catalogLabels() {
  return {
    skillLabels: { ...SKILL_LABELS },
    toolLabels: labelsOf(ALL_CONCRETE_TOOLS, creationItemName),
    weaponLabels: Object.fromEntries(Object.values(WEAPONS).map((weapon) => [weapon.key, weapon.name])),
  };
}

const INVOCATION_DETAILS = {
  'armor-of-shadows': ['Armure des ombres', 'Lance Armure du mage sur vous-même à volonté.', 'none'],
  'eldritch-mind': ['Esprit occulte', 'Vous avez l’avantage aux jets de sauvegarde de Constitution pour maintenir votre concentration.', 'none'],
  'pact-of-the-chain': ['Pacte de la Chaîne', 'Vous apprenez Appel de familier et choisissez sa forme.', 'familiar'],
  'pact-of-the-blade': ['Pacte de la Lame', 'Vous invoquez une arme de pacte de corps à corps.', 'weapon'],
  'pact-of-the-tome': ['Pacte du Grimoire', 'Vous choisissez trois sorts mineurs et deux rituels de niveau 1.', 'tome'],
} as const;

function toCatalogInvocation(key: typeof LEVEL_ONE_INVOCATIONS[number]) {
  const [name, description, detail] = INVOCATION_DETAILS[key];
  return { key, name, description, detail };
}

function familiarName(key: string): string {
  return key.split('-').map(capitalize).join(' ');
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function labelsOf(keys: readonly string[], labelOf: (key: string) => string | null) {
  return Object.fromEntries(keys.map((key) => [key, labelOf(key) ?? key]));
}

/**
 * Le front ne redit pas ces listes : il les reçoit. Le Commun en est absent des
 * deux côtés — il est accordé d'office et ne se choisit jamais.
 */
function toCatalogLanguages(): CatalogLanguages {
  return {
    standard: STANDARD_LANGUAGES.map(toCatalogLanguage),
    rare: RARE_LANGUAGES.map(toCatalogLanguage),
  };
}

function toCatalogLanguage(key: Language): CatalogLanguage {
  return { key, name: LANGUAGE_LABELS[key] };
}

function toCatalogAlignment(key: Alignment): CatalogAlignment {
  return { key, name: ALIGNMENT_LABELS[key] };
}

function toCatalogSpecies(species: Species): CatalogSpecies {
  return {
    key: species.key,
    name: species.name,
    size: species.size,
    sizeOptions: [...(species.sizeOptions ?? [species.size])],
    physicalBounds: SPECIES_PHYSICAL_BOUNDS[species.key],
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
    startingEquipment: classStartingEquipment(characterClass),
    spellcasting: toCatalogSpellcasting(characterClass),
    level1Features: characterClass.level1Features.map(toCatalogFeature),
    expertiseCount: expertiseCountOf(characterClass.level1Features),
    level1Choices: level1ChoicesOf(characterClass),
    ...boundedChoicesOf(characterClass),
  };
}

function classStartingEquipment(characterClass: CharacterClass) {
  return toCatalogStartingEquipment(
    characterClass.startingEquipment,
    classEquipmentChoiceOptions(characterClass.key),
  );
}

/** Les trois bornes que le wizard doit connaître pour ne rien proposer d'invalide. */
function boundedChoicesOf(characterClass: CharacterClass) {
  return {
    weaponMastery: weaponMasteryOf(characterClass.key),
    toolChoice: toolChoiceOf(characterClass),
    grantsLanguageChoice: characterClass.key === ROGUE,
  };
}

/** Le Roublard, et lui seul, apprend une langue de plus au niveau 1. */
const ROGUE = 'rogue';

/**
 * Ce que le wizard doit proposer vient des MÊMES fonctions que la validation.
 * Publier une liste calculée ici la ferait diverger au premier errata.
 */
function weaponMasteryOf(classKey: CharacterClass['key']): CatalogBoundedChoice | null {
  const count = weaponMasteryCount(classKey);

  return count > 0 ? { count, options: [...weaponMasteryOptions(classKey)] } : null;
}

function toolChoiceOf(characterClass: CharacterClass): CatalogBoundedChoice | null {
  const count = characterClass.toolChoice?.count ?? 0;

  return count > 0 ? { count, options: [...classToolOptions(characterClass.key)] } : null;
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
    spellbookSize: spellcasting.spellbookSize ?? 0,
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
    toolOptions: [...backgroundToolOptions(background.key)],
    equipment: toCatalogStartingEquipment(
      background.equipment,
      backgroundEquipmentChoiceOptions(background.key),
    ),
  };
}

/** Copie en profondeur : rien de ce que le domaine tient ne sort par référence. */
function toCatalogStartingEquipment(
  equipment: StartingEquipment,
  choiceOptions: readonly string[],
): CatalogStartingEquipment {
  return {
    options: equipment.options.map((option) => ({
      id: option.id,
      label: option.label,
      entries: option.entries.map((entry) => ({ ...entry })),
      gold: option.gold,
      itemChoice: itemChoiceOf(option.entries, choiceOptions),
    })),
  };
}

function itemChoiceOf(entries: StartingEquipment['options'][number]['entries'], options: readonly string[]) {
  if (entries.length === 0 || options.length === 0) return null;

  return {
    options: options.map((key) => ({ key, name: creationItemName(key) ?? key })),
    replacesItemKeys: genericEquipmentItemKeys(entries),
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
