import type {
  AbilityRoll as AbilityRollDto,
  BackgroundAbilityBonuses,
  CharacterBuildDetailDto,
} from '@donjon-dragon/shared/character-schema';

import type { Character } from '../domain/character';
import type { CharacterChoice } from '../domain/character-choices';
import type { SpellKey } from '../domain/reference/keys';
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
    ...classFieldsOf(choices),
    backgroundKey: build.backgroundKey,
    ...magicInitiateFieldsOf(choices),
    ...skilledFieldsOf(choices),
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

function classFieldsOf(choices: readonly CharacterChoice[]) {
  const choice = choices.find((entry) => entry.source.type === 'class');
  const spells = choice?.spells ?? [];

  return {
    classSkills: [...(choice?.skills ?? [])],
    expertise: [...(choice?.expertise ?? [])],
    classCantrips: cantripsOf(spells),
    classSpells: levelOneOf(spells),
    fightingStyle: choice?.fightingStyle ?? null,
    classOrder: choice?.classOrder ?? null,
    weaponMasteries: [...(choice?.weaponMasteries ?? [])],
    invocation: choice?.invocation ?? null,
    invocationSpells: [...(choice?.invocationSpells ?? [])],
    familiarForm: choice?.familiarForm ?? null,
    pactWeaponKey: choice?.pactWeaponKey ?? null,
    spellbook: [...(choice?.spellbook ?? [])],
  };
}

function magicInitiateFieldsOf(choices: readonly CharacterChoice[]) {
  const choice = choices.find(
    (entry) => entry.source.type === 'feat' && entry.source.key === 'magic-initiate',
  );
  const spells = choice?.spells ?? [];

  return {
    spellcastingAbility: choice?.spellcastingAbility ?? null,
    spellList: choice?.spellList ?? null,
    featCantrips: cantripsOf(spells),
    featSpells: levelOneOf(spells),
  };
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
