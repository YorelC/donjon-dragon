import type {
  AbilityRoll as AbilityRollDto,
  BackgroundAbilityBonuses,
  CharacterBuildDetailDto,
} from '@donjon-dragon/shared/character-schema';

import type { Character } from '../domain/character';
import type { CharacterChoice } from '../domain/character-choices';
import { IncompleteMagicInitiateChoiceError } from '../domain/character.errors';
import { CLASSES } from '../domain/reference/classes';
import type { ClassKey, OriginFeatKey, SpellKey } from '../domain/reference/keys';
import { SPELLS } from '../domain/reference/spells';

const CANTRIP_LEVEL = 0;

/**
 * L'agrégat → le build éclaté qu'attend le wizard pour se pré-remplir en
 * édition. Chaque source connue de `choices` retrouve sa place ; une source
 * inconnue est silencieusement ignorée, comme le fait déjà `CharacterChoices`.
 */
export function toCharacterBuildDetailDto(character: Character): CharacterBuildDetailDto {
  const build = character.build;
  const choices = build.choices.all;

  return {
    ...identityFieldsOf(character),
    ...originFieldsOf(build, choices),
    classKey: build.classKey,
    ...classFieldsOf(build.classKey, choices),
    backgroundKey: build.backgroundKey,
    backgroundTool: backgroundToolOf(choices),
    ...magicInitiateFieldsOf(choices),
    ...skilledFieldsOf(choices),
    featToolChoices: featToolChoicesOf(choices),
    ...abilityFieldsOf(character),
    ...equipmentFieldsOf(character),
  };
}

/** Ce que le joueur a saisi de sa main : le nom et la fiche d'etat civil. */
function identityFieldsOf(character: Character) {
  return { name: character.name.value, ...character.identity };
}

/** L'espece et ce qui en decoule : lignee, taille, langues, choix d'espece. */
function originFieldsOf(build: Character['build'], choices: readonly CharacterChoice[]) {
  return {
    speciesKey: build.speciesKey,
    lineageKey: build.lineageKey,
    size: build.size,
    standardLanguages: [...build.standardLanguages],
    ...lineageFieldsOf(choices),
    ...speciesFieldsOf(choices),
  };
}

/**
 * Le wizard se rouvre sur les options retenues, pas sur l'inventaire : c'est
 * l'option qui est le choix, l'inventaire n'en est que la conséquence. Il sort
 * quand même, pour que l'étape puisse afficher ce que le personnage possède
 * déjà sans redemander le catalogue.
 */
function equipmentFieldsOf(character: Character) {
  const equipment = character.build.equipment;
  const selection = equipment.snapshot();

  return {
    armorKey: equipment.armorKey,
    shield: equipment.shield,
    items: equipment.items.map((item) => ({ ...item })),
    gold: equipment.gold,
    classOptionId: equipment.classOptionId,
    backgroundOptionId: equipment.backgroundOptionId,
    classChoiceItemKey: selection.classChoiceItemKey ?? null,
    backgroundChoiceItemKey: selection.backgroundChoiceItemKey ?? null,
    trinketId: equipment.trinketId,
  };
}

function abilityFieldsOf(character: Character) {
  const abilities = character.build.abilities.snapshot();

  return {
    backgroundBonuses: abilities.backgroundBonuses as BackgroundAbilityBonuses,
    abilityMethod: abilities.method,
    base: abilities.base,
    abilityRoll: rollOf(character),
  };
}

function lineageFieldsOf(choices: readonly CharacterChoice[]) {
  const choice = choices.find((entry) => entry.source.type === 'lineage');

  return { lineageSpellcastingAbility: choice?.spellcastingAbility ?? null };
}

function speciesFieldsOf(choices: readonly CharacterChoice[]) {
  const choice = choices.find((entry) => entry.source.type === 'species');

  return {
    speciesSkills: [...(choice?.skills ?? [])],
    speciesFeat: choice?.originFeat ?? null,
  };
}

function classFieldsOf(classKey: ClassKey, choices: readonly CharacterChoice[]) {
  const choice = choices.find((entry) => entry.source.type === 'class');
  const spells = choice?.spells ?? [];

  return {
    classSkills: [...(choice?.skills ?? [])],
    expertise: [...(choice?.expertise ?? [])],
    classCantrips: cantripsOf(spells),
    classSpells: preparedAtCreationOf(classKey, spells),
    fightingStyle: choice?.fightingStyle ?? null,
    classOrder: choice?.classOrder ?? null,
    weaponMasteries: [...(choice?.weaponMasteries ?? [])],
    classTools: [...(choice?.tools ?? [])],
    classLanguage: choice?.languages?.[0] ?? null,
    invocation: choice?.invocation ?? null,
    invocationSpells: [...(choice?.invocationSpells ?? [])],
    familiarForm: choice?.familiarForm ?? null,
    pactWeaponKey: choice?.pactWeaponKey ?? null,
    spellbook: [...(choice?.spellbook ?? [])],
  };
}

/**
 * Un lanceur à grimoire ne prépare rien à la création (DR-B01-05). Un brouillon
 * de Magicien plus ancien porte encore quatre sorts préparés : le wizard ne les
 * montre plus et la validation les refuse, ils ne sont donc pas rendus.
 */
function preparedAtCreationOf(classKey: ClassKey, spells: readonly SpellKey[]): string[] {
  if (CLASSES[classKey].spellcasting?.spellbookSize) return [];
  return levelOneOf(spells);
}

/**
 * Cinq historiques font choisir leur outil ; les onze autres l'imposent, et
 * n'émettent alors aucun choix. `null` dit « rien à rouvrir », pas « perdu ».
 */
function backgroundToolOf(choices: readonly CharacterChoice[]): string | null {
  const choice = choices.find((entry) => entry.source.type === 'background');

  return choice?.tools?.[0] ?? null;
}

function magicInitiateFieldsOf(choices: readonly CharacterChoice[]) {
  const matching = choices.filter(isMagicInitiateChoice);
  const choice = matching[0];
  const spells = choice?.spells ?? [];

  return {
    spellcastingAbility: choice?.spellcastingAbility ?? null,
    spellList: choice?.spellList ?? null,
    featCantrips: cantripsOf(spells),
    featSpells: levelOneOf(spells),
    magicInitiateChoices: matching.map(magicInitiateDetail),
  };
}

function isMagicInitiateChoice(entry: CharacterChoice): boolean {
  return entry.source.type === 'feat' && entry.source.key === 'magic-initiate';
}

function magicInitiateDetail(choice: CharacterChoice) {
  const spells = choice.spells ?? [];
  return {
    grantedBy: choice.source.grantedBy ? { ...choice.source.grantedBy } : null,
    spellcastingAbility: required(choice.spellcastingAbility),
    spellList: required(choice.spellList),
    cantrips: cantripsOf(spells),
    spells: levelOneOf(spells),
  };
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new IncompleteMagicInitiateChoiceError();
  return value;
}

function skilledFieldsOf(choices: readonly CharacterChoice[]) {
  const choice = choices.find(
    (entry) => entry.source.type === 'feat' && entry.source.key === 'skilled',
  );

  return {
    featSkills: [...(choice?.skills ?? [])],
    featTools: [...(choice?.tools ?? [])],
  };
}

/** Façonneur et Musicien : les outils de chaque don, rangés sous sa clé. */
const TOOL_CHOOSING_FEATS: readonly OriginFeatKey[] = ['crafter', 'musician'];

function featToolChoicesOf(choices: readonly CharacterChoice[]) {
  return Object.fromEntries(choices
    .filter((choice) => choice.source.type === 'feat')
    .filter((choice) => TOOL_CHOOSING_FEATS.includes(choice.source.key as OriginFeatKey))
    .map((choice) => [choice.source.key, [...(choice.tools ?? [])]]));
}

/** Le détail des dés accompagne les totaux : le joueur doit pouvoir refaire le calcul. */
function rollOf(character: Character): AbilityRollDto | null {
  const roll = character.abilityRoll;
  if (!roll) return null;

  return { dice: roll.snapshot().dice, totals: roll.totals };
}

function levelOf(key: SpellKey): number | undefined {
  return SPELLS[key]?.level;
}

function cantripsOf(spells: readonly SpellKey[]): string[] {
  return spells.filter((key) => levelOf(key) === CANTRIP_LEVEL);
}

function levelOneOf(spells: readonly SpellKey[]): string[] {
  return spells.filter((key) => levelOf(key) === 1);
}
