import type { CharacterChoice, CharacterChoices } from '../character-choices';
import type { Ability } from '../reference/abilities';
import { CLASSES } from '../reference/classes';
import type { CollectedEffect, EffectSource, EffectSourceType } from '../reference/effect';
import type { ClassKey, SpellKey } from '../reference/keys';
import { SPECIES } from '../reference/species';
import { SPELLS } from '../reference/spells';
import type { CharacterBuild } from './character-build';

/** DD de sauvegarde d'un sort : 8, plus le bonus de maîtrise, plus le modificateur. */
const SPELL_SAVE_DC_BASE = 8;

const CANTRIP_LEVEL = 0;

/**
 * Un sort connu porte son nom en plus de sa clé : la fiche l'affiche, et le
 * moteur est le seul à pouvoir le nommer sans I/O — `SPELLS` est une constante
 * du domaine, contrairement au catalogue d'objets qui vit en base.
 */
export interface NamedSpell {
  spellKey: SpellKey;
  name: string;
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
  return [...classSpellcasting(input), ...featSpellcasting(input), ...originSpellcasting(input)];
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
    const ability = originAbility(granted.source, input);
    return {
      ...scoresFor(ability, input),
      origin: granted.source.label,
      ability,
      cantripsKnown: granted.spellKeys.filter(isCantrip).map(named),
      spellsPrepared: granted.spellKeys.filter(isNotCantrip).map(named),
      level1Slots: 0,
      slotsRecoverOnShortRest: false,
    };
  });
}

interface GrantedByOrigin {
  source: EffectSource;
  spellKeys: SpellKey[];
}

/** Une entrée par origine : l'espèce et la lignée ne se mélangent pas. */
function grantedSpellsBySource(
  effects: readonly CollectedEffect[],
): Map<string, GrantedByOrigin> {
  const bySource = new Map<string, GrantedByOrigin>();

  effects.filter(isOriginSpellGrant).forEach((collected) => {
    const existing = bySource.get(collected.source.key) ?? {
      source: collected.source,
      spellKeys: [],
    };
    existing.spellKeys.push(...(collected.effect.grants?.spells ?? []).map((s) => s.spellKey));
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
 * Le manuel fait choisir la caractéristique à la création — Intelligence,
 * Sagesse ou Charisme. Un personnage créé avant que le wizard ne la demande n'a
 * rien d'enregistré : on retombe alors sur la première option de l'espèce, le
 * temps qu'il soit rejoué.
 */
function originAbility(source: EffectSource, input: SpellcastingInput): Ability {
  const chosen = input.build.choices
    .from({ type: source.type, key: source.key })
    .find((choice) => choice.spellcastingAbility)?.spellcastingAbility;

  return chosen ?? defaultOriginAbility(input.build);
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
    cantrips: chosen.flatMap((choice) => choice.spells ?? []).filter(isCantrip).map(named),
    prepared: chosen.flatMap((choice) => choice.spells ?? []).filter(isNotCantrip).map(named),
  };
}

function cantripsOf(choice: MagicInitiateChoice): NamedSpell[] {
  return (choice.spells ?? []).filter(isCantrip).map(named);
}

function level1SpellsOf(choice: MagicInitiateChoice): NamedSpell[] {
  return (choice.spells ?? []).filter(isNotCantrip).map(named);
}

/** Une clé inconnue se rend telle quelle : mieux qu'un trou dans la fiche. */
function named(spellKey: SpellKey): NamedSpell {
  return { spellKey, name: SPELLS[spellKey]?.name ?? spellKey };
}

function isCantrip(spellKey: SpellKey): boolean {
  return SPELLS[spellKey]?.level === CANTRIP_LEVEL;
}

function isNotCantrip(spellKey: SpellKey): boolean {
  return !isCantrip(spellKey);
}
