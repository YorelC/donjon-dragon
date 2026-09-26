import type { CharacterChoice, CharacterChoices } from '../character-choices';
import type { Ability } from '../reference/abilities';
import { CLASSES } from '../reference/classes';
import type {
  CollectedEffect,
  EffectSource,
  EffectSourceType,
  GrantedSpell,
  GrantedSpellFrequency,
} from '../reference/effect';
import type { ClassKey, SpellKey } from '../reference/keys';
import { SPECIES } from '../reference/species';
import { SPELLS } from '../reference/spells';
import type { CharacterBuild } from './character-build';

/** DD de sauvegarde d'un sort : 8, plus le bonus de maîtrise, plus le modificateur. */
const SPELL_SAVE_DC_BASE = 8;

const CANTRIP_LEVEL = 0;
const LEVEL_ONE = 1;

/**
 * Un sort connu porte son nom en plus de sa clé : la fiche l'affiche, et le
 * moteur est le seul à pouvoir le nommer sans I/O — `SPELLS` est une constante
 * du domaine, contrairement au catalogue d'objets qui vit en base.
 */
export interface NamedSpell {
  spellKey: SpellKey;
  name: string;
  alwaysPrepared: boolean;
  ritualOnly: boolean;
  freeCastFrequency: GrantedSpellFrequency | null;
}

export interface ResolvedSpellcasting {
  origin: string;
  ability: Ability;
  saveDc: number;
  attackBonus: number;
  cantripsKnown: NamedSpell[];
  spellsPrepared: NamedSpell[];
  level1Slots: number;
  /** Le pacte de l'occultiste se récupère au Repos court, pas au Repos long. */
  slotsRecoverOnShortRest: boolean;
}

export interface SpellcastingInput {
  build: CharacterBuild;
  effects: readonly CollectedEffect[];
  abilityModifiers: Record<Ability, number>;
  proficiencyBonus: number;
}

/**
 * Un personnage peut lancer des sorts par trois chemins au niveau 1 : sa classe,
 * le don Initié à la magie, et son espèce ou sa lignée. Chacun a sa propre
 * caractéristique et sa propre liste — un barbare Initié à la magie n'a aucun
 * emplacement mais lance quand même ses sorts mineurs.
 */
export function resolveSpellcasting(input: SpellcastingInput): ResolvedSpellcasting[] {
  return [
    ...classSpellcasting(input),
    ...featSpellcasting(input),
    ...originSpellcasting(input),
    ...invocationSpellcasting(input),
  ];
}

function classSpellcasting(input: SpellcastingInput): ResolvedSpellcasting[] {
  const characterClass = CLASSES[input.build.classKey];
  const spellcasting = characterClass.spellcasting;
  if (!spellcasting) return [];

  const chosen = spellsChosenBy(input.build.choices, 'class', characterClass.key);
  const granted = grantedClassSpells(input, characterClass.key);
  return [
    {
      ...scoresFor(spellcasting.ability, input),
      origin: characterClass.name,
      ability: spellcasting.ability,
      cantripsKnown: [...chosen.cantrips, ...granted.filter(isGrantedCantrip).map(grantedNamed)],
      spellsPrepared: [...chosen.prepared, ...granted.filter(isGrantedLevelOne).map(grantedNamed)],
      level1Slots: spellcasting.level1Slots,
      slotsRecoverOnShortRest: spellcasting.kind === 'pact',
    },
  ];
}

/**
 * Les sorts mineurs qu'une capacité ajoute à ceux de la classe — Thaumaturge et
 * Mage en donnent un chacun. C'est un compte, pas un sort : c'est l'étape des
 * sorts du wizard qui s'en sert pour en proposer un de plus.
 */
export function extraCantripsOf(effects: readonly CollectedEffect[]): number {
  return effects.reduce(
    (total, collected) => total + (collected.effect.grants?.extraCantrips ?? 0),
    0,
  );
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

/**
 * Les sorts qu'une espèce ou une lignée octroie : le Haut-elfe connaît
 * Prestidigitation, le Gnome des forêts Illusion mineure. Ils ne sont pas
 * choisis dans une liste — le trait les nomme — mais ils comptent comme des
 * sorts connus, et ils avaient été oubliés ici.
 */
const ORIGIN_SOURCE_TYPES: readonly EffectSourceType[] = ['species', 'lineage'];

function originSpellcasting(input: SpellcastingInput): ResolvedSpellcasting[] {
  return [...grantedSpellsBySource(input.effects)].map(([, granted]) => {
    const ability = originAbility(granted, input);
    return {
      ...scoresFor(ability, input),
      origin: granted.source.label,
      ability,
      cantripsKnown: granted.spells.filter(isGrantedCantrip).map(grantedNamed),
      spellsPrepared: granted.spells.filter(isGrantedLevelOne).map(grantedNamed),
      level1Slots: 0,
      slotsRecoverOnShortRest: false,
    };
  });
}

interface GrantedByOrigin {
  source: EffectSource;
  spells: GrantedSpell[];
}

/** Une entrée par origine : l'espèce et la lignée ne se mélangent pas. */
function grantedSpellsBySource(
  effects: readonly CollectedEffect[],
): Map<string, GrantedByOrigin> {
  const bySource = new Map<string, GrantedByOrigin>();

  effects.filter(isOriginSpellGrant).forEach((collected) => {
    const existing = bySource.get(collected.source.key) ?? {
      source: collected.source,
      spells: [],
    };
    existing.spells.push(...(collected.effect.grants?.spells ?? []));
    bySource.set(collected.source.key, existing);
  });

  return bySource;
}

function isOriginSpellGrant(collected: CollectedEffect): boolean {
  return (
    ORIGIN_SOURCE_TYPES.includes(collected.source.type) &&
    (collected.effect.grants?.spells?.length ?? 0) > 0
  );
}

/**
 * Un trait qui nomme sa caractéristique l'impose : Porteur de lumière incante
 * Lumière avec le Charisme. Sinon le manuel la fait choisir à la création —
 * Intelligence, Sagesse ou Charisme. Un personnage créé avant que le wizard ne
 * la demande n'a rien d'enregistré : on retombe alors sur la première option de
 * l'espèce, le temps qu'il soit rejoué.
 */
function originAbility(granted: GrantedByOrigin, input: SpellcastingInput): Ability {
  const fixed = granted.spells.find((spell) => spell.ability)?.ability;
  const chosen = input.build.choices
    .from({ type: granted.source.type, key: granted.source.key })
    .find((choice) => choice.spellcastingAbility)?.spellcastingAbility;

  return fixed ?? chosen ?? defaultOriginAbility(input.build);
}

function defaultOriginAbility(build: CharacterBuild): Ability {
  const offered = SPECIES[build.speciesKey].lineage?.spellcastingAbilityOptions;
  return offered?.[0] ?? FALLBACK_ORIGIN_ABILITY;
}

const FALLBACK_ORIGIN_ABILITY: Ability = 'intelligence';

type MagicInitiateChoice = CharacterChoice & {
  spellcastingAbility: Ability;
  spellList: ClassKey;
};

function isMagicInitiateChoice(choice: CharacterChoice): choice is MagicInitiateChoice {
  return Boolean(choice.spellcastingAbility && choice.spellList);
}

function invocationSpellcasting(input: SpellcastingInput): ResolvedSpellcasting[] {
  const choice = input.build.choices.all.find((candidate) => candidate.invocation !== undefined);
  if (!choice) return [];
  const fixed = fixedInvocationSpell(choice.invocation);
  const spells = fixed ? [fixed] : choice.invocationSpells ?? [];
  if (spells.length === 0) return [];
  return [{
    ...scoresFor('charisma', input), origin: invocationName(choice.invocation),
    ability: 'charisma', cantripsKnown: spells.filter(isCantrip).map(atWillNamed),
    spellsPrepared: spells.filter(isNotCantrip).map(fixed ? atWillPrepared : ritualNamed),
    level1Slots: 0, slotsRecoverOnShortRest: false,
  }];
}

function fixedInvocationSpell(invocation: string | undefined): SpellKey | null {
  const spells: Readonly<Record<string, SpellKey>> = {
    'armor-of-shadows': 'mage-armor',
    'pact-of-the-chain': 'find-familiar',
  };
  return invocation ? spells[invocation] ?? null : null;
}

function invocationName(invocation: string | undefined): string {
  return `Manifestation occulte (${invocation ?? ''})`;
}

function grantedClassSpells(input: SpellcastingInput, classKey: ClassKey): GrantedSpell[] {
  return input.effects.filter((collected) =>
    collected.source.type === 'class' && collected.source.key === classKey)
    .flatMap((collected) => collected.effect.grants?.spells ?? []);
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
): { cantrips: NamedSpell[]; prepared: NamedSpell[] } {
  const chosen = choices.from({ type, key });
  return {
    cantrips: chosen.flatMap((choice) => choice.spells ?? []).filter(isCantrip).map(atWillNamed),
    prepared: chosen.flatMap((choice) => choice.spells ?? []).filter(isNotCantrip).map(preparedNamed),
  };
}

function cantripsOf(choice: MagicInitiateChoice): NamedSpell[] {
  return (choice.spells ?? []).filter(isCantrip).map(atWillNamed);
}

function level1SpellsOf(choice: MagicInitiateChoice): NamedSpell[] {
  return (choice.spells ?? []).filter(isNotCantrip).map(freeOnceNamed);
}

/**
 * Ce qu'un sort devient une fois posé sur la fiche : toujours préparé ou non,
 * rituel seul, et la cadence à laquelle il se lance sans dépenser d'emplacement.
 * Cinq états nommés, parce qu'une série de booléens anonymes ne se relit pas.
 */
interface SpellFlags {
  alwaysPrepared: boolean;
  ritualOnly: boolean;
  freeCastFrequency: GrantedSpellFrequency | null;
}

const AT_WILL: SpellFlags = {
  alwaysPrepared: false, ritualOnly: false, freeCastFrequency: 'atWill',
};
const PREPARED: SpellFlags = {
  alwaysPrepared: false, ritualOnly: false, freeCastFrequency: null,
};
const FREE_ONCE: SpellFlags = {
  alwaysPrepared: true, ritualOnly: false, freeCastFrequency: 'oncePerLongRest',
};
const AT_WILL_PREPARED: SpellFlags = {
  alwaysPrepared: true, ritualOnly: false, freeCastFrequency: 'atWill',
};
const RITUAL: SpellFlags = {
  alwaysPrepared: false, ritualOnly: true, freeCastFrequency: 'atWill',
};

function spellNamed(spellKey: SpellKey, flags: SpellFlags): NamedSpell {
  return { spellKey, name: SPELLS[spellKey]?.name ?? spellKey, ...flags };
}

const atWillNamed = (key: SpellKey): NamedSpell => spellNamed(key, AT_WILL);
const preparedNamed = (key: SpellKey): NamedSpell => spellNamed(key, PREPARED);
const freeOnceNamed = (key: SpellKey): NamedSpell => spellNamed(key, FREE_ONCE);
const atWillPrepared = (key: SpellKey): NamedSpell => spellNamed(key, AT_WILL_PREPARED);
const ritualNamed = (key: SpellKey): NamedSpell => spellNamed(key, RITUAL);
const grantedNamed = (spell: GrantedSpell): NamedSpell =>
  spellNamed(spell.spellKey, grantedFlags(spell));

/** Un octroi d'espèce ou de classe est toujours préparé, à sa propre cadence. */
function grantedFlags(spell: GrantedSpell): SpellFlags {
  return {
    alwaysPrepared: SPELLS[spell.spellKey]?.level === LEVEL_ONE,
    ritualOnly: false,
    freeCastFrequency: spell.frequency,
  };
}

function isCantrip(spellKey: SpellKey): boolean {
  return SPELLS[spellKey]?.level === CANTRIP_LEVEL;
}

function isNotCantrip(spellKey: SpellKey): boolean {
  return !isCantrip(spellKey);
}

function isGrantedCantrip(spell: GrantedSpell): boolean {
  return isCantrip(spell.spellKey);
}

function isGrantedLevelOne(spell: GrantedSpell): boolean {
  return isNotCantrip(spell.spellKey);
}
