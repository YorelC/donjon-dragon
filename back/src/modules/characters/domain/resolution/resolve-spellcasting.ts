import type { CharacterChoice, CharacterChoices } from '../character-choices';
import type { Ability } from '../reference/abilities';
import { CLASSES } from '../reference/classes';
import type { ClassKey, SpellKey } from '../reference/keys';
import { SPELLS } from '../reference/spells';
import type { CharacterBuild } from './character-build';

/** DD de sauvegarde d'un sort : 8, plus le bonus de maîtrise, plus le modificateur. */
const SPELL_SAVE_DC_BASE = 8;

const CANTRIP_LEVEL = 0;

export interface ResolvedSpellcasting {
  origin: string;
  ability: Ability;
  saveDc: number;
  attackBonus: number;
  cantripsKnown: SpellKey[];
  spellsPrepared: SpellKey[];
  level1Slots: number;
  /** Le pacte de l'occultiste se récupère au Repos court, pas au Repos long. */
  slotsRecoverOnShortRest: boolean;
}

export interface SpellcastingInput {
  build: CharacterBuild;
  abilityModifiers: Record<Ability, number>;
  proficiencyBonus: number;
}

/**
 * Un personnage peut lancer des sorts par deux chemins au niveau 1 : sa classe,
 * et le don Initié à la magie. Les deux ont leur propre caractéristique et leur
 * propre liste — un barbare Initié à la magie n'a aucun emplacement mais lance
 * quand même ses sorts mineurs.
 */
export function resolveSpellcasting(input: SpellcastingInput): ResolvedSpellcasting[] {
  return [...classSpellcasting(input), ...featSpellcasting(input)];
}

function classSpellcasting(input: SpellcastingInput): ResolvedSpellcasting[] {
  const characterClass = CLASSES[input.build.classKey];
  const spellcasting = characterClass.spellcasting;
  if (!spellcasting) return [];

  const chosen = spellsChosenBy(input.build.choices, 'class', characterClass.key);
  return [
    {
      ...scoresFor(spellcasting.ability, input),
      origin: characterClass.name,
      ability: spellcasting.ability,
      cantripsKnown: chosen.cantrips,
      spellsPrepared: chosen.prepared,
      level1Slots: spellcasting.level1Slots,
      slotsRecoverOnShortRest: spellcasting.kind === 'pact',
    },
  ];
}

function featSpellcasting(input: SpellcastingInput): ResolvedSpellcasting[] {
  return input.build.choices.all
    .filter(isMagicInitiateChoice)
    .map((choice) => ({
      ...scoresFor(choice.spellcastingAbility, input),
      origin: `Initié à la magie (${CLASSES[choice.spellList].name})`,
      ability: choice.spellcastingAbility,
      cantripsKnown: cantripsOf(choice),
      spellsPrepared: level1SpellsOf(choice),
      level1Slots: 0,
      slotsRecoverOnShortRest: false,
    }));
}

type MagicInitiateChoice = CharacterChoice & {
  spellcastingAbility: Ability;
  spellList: ClassKey;
};

function isMagicInitiateChoice(choice: CharacterChoice): choice is MagicInitiateChoice {
  return Boolean(choice.spellcastingAbility && choice.spellList);
}

function scoresFor(
  ability: Ability,
  input: SpellcastingInput,
): { saveDc: number; attackBonus: number } {
  const modifier = input.abilityModifiers[ability];
  return {
    saveDc: SPELL_SAVE_DC_BASE + input.proficiencyBonus + modifier,
    attackBonus: input.proficiencyBonus + modifier,
  };
}

function spellsChosenBy(
  choices: CharacterChoices,
  type: 'class' | 'feat',
  key: string,
): { cantrips: SpellKey[]; prepared: SpellKey[] } {
  const chosen = choices.from({ type, key });
  return {
    cantrips: chosen.flatMap((choice) => choice.spells ?? []).filter(isCantrip),
    prepared: chosen.flatMap((choice) => choice.spells ?? []).filter(isNotCantrip),
  };
}

function cantripsOf(choice: MagicInitiateChoice): SpellKey[] {
  return (choice.spells ?? []).filter(isCantrip);
}

function level1SpellsOf(choice: MagicInitiateChoice): SpellKey[] {
  return (choice.spells ?? []).filter(isNotCantrip);
}

function isCantrip(spellKey: SpellKey): boolean {
  return SPELLS[spellKey]?.level === CANTRIP_LEVEL;
}

function isNotCantrip(spellKey: SpellKey): boolean {
  return !isCantrip(spellKey);
}
